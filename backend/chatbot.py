import os
import json
import pandas as pd
import numpy as np
from typing import List, Dict, Any
import google.generativeai as genai
from supabase import create_client, Client
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings('ignore')

# ===== CONFIGURATION =====
class Config:
    # Replace with your actual API keys
    GOOGLE_API_KEY = "AIzaSyBoUdOFtm6VgmUdzkiTM5bW67TJXc5zMk0"
    SUPABASE_URL = "https://cjkppjohrpaovejudjhx.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqa3Bwam9ocnBhb3ZlanVkamh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTYwMzYsImV4cCI6MjA2MzYzMjAzNn0.7ishfq4wplkKu71pUi_lwNTikapDTFOHbdeiFfBVKvo"
    
    # Model configuration
    GEMINI_MODEL = "gemini-2.0-flash-lite"
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    
    # ChromaDB configuration
    COLLECTION_NAME = "price_advisor_products"

class DatabaseManager:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.table_name = "products"
    
    def get_all_products(self):
        """Retrieve all products from database"""
        try:
            result = self.supabase.table(self.table_name).select("*").limit(10000).execute()
            print(f"Fetched {len(result.data)} products from Supabase")
            return result.data
        except Exception as e:
            print(f"Error retrieving data: {e}")
            return []
    
    def search_products(self, query: str, limit: int = 10):
        """Search products by name or description"""
        try:
            result = self.supabase.table(self.table_name).select("*").ilike("name", f"%{query}%").limit(limit).execute()
            if not result.data:
                result = self.supabase.table(self.table_name).select("*").ilike("description", f"%{query}%").limit(limit).execute()
            return result.data
        except Exception as e:
            print(f"Error searching products: {e}")
            return []

class RAGSystem:
    def __init__(self, config: Config):
        self.config = config
        self.embedding_model = SentenceTransformer(config.EMBEDDING_MODEL)
        self.chroma_client = chromadb.Client()
        self.collection = None
        self.db_manager = DatabaseManager(config.SUPABASE_URL, config.SUPABASE_KEY)
        self._setup_chromadb()
    
    def _setup_chromadb(self):
        """Initialize ChromaDB collection"""
        try:
            # Delete existing collection if it exists
            try:
                self.chroma_client.delete_collection(name=self.config.COLLECTION_NAME)
            except:
                pass
            
            # Create new collection
            self.collection = self.chroma_client.create_collection(
                name=self.config.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            print("ChromaDB collection created successfully")
        except Exception as e:
            print(f"Error setting up ChromaDB: {e}")
    
    def load_products_to_vector_db(self):
        products = self.db_manager.get_all_products()
        if not products:
            print("No products found in database")
            return
        documents, metadatas, ids = [], [], []
        for product in products:
            doc_text = f"""
            Product Title: {product.get('title', '')}
            Description: {product.get('description', '')}
            Category: {product.get('category', '')}
            Type: {product.get('type', '')}
            Price: {product.get('price', '')}
            Price Type: {product.get('price_type', '')}
            Condition: {product.get('condition', '')}
            Visibility: {product.get('visibility', '')}
            University: {product.get('university', '')}
            Department: {product.get('department', '')}
            Batch: {product.get('batch', '')}
            Image URL: {product.get('image_url', '')}
            """
            documents.append(doc_text.strip())
            metadatas.append({
                "id": str(product.get('id', '')),
                "title": product.get('title', ''),
                "category": product.get('category', ''),
                "type": product.get('type', ''),
                "price": float(product.get('price', 0) or 0),
                "university": product.get('university', ''),
            })
            ids.append(str(product.get('id', '')))
        try:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"Loaded {len(documents)} products into ChromaDB")
        except Exception as e:
            print(f"Error loading data to vector DB: {e}")
    
    def search_similar_products(self, query: str, n_results: int = 5):
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            print("Search results:", results)
            return results
        except Exception as e:
            print(f"Error searching similar products: {e}")
            return None

class GeminiChatbot:
    def __init__(self, config: Config, rag_system: RAGSystem):
        self.config = config
        self.rag_system = rag_system
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(config.GEMINI_MODEL)
        
    def generate_response(self, user_query: str, context: str):
        """Generate response using Gemini with RAG context"""
        prompt = f"""
        You are a helpful price advisor chatbot. Use the following product information to answer the user's question about pricing, recommendations, and product comparisons.

        PRODUCT CONTEXT:
        {context}

        USER QUESTION: {user_query}

        Instructions:
        - Always use the product context above to answer the user's question.
        - If you find relevant products, compare them, mention which are good, cheap, available, or better options, and explain why.
        - If no relevant products are found, say so.
        - Be specific and reference product names, prices, and features from the context.
        - Provide clear buying advice (buy now, wait, or consider alternatives).
        - **Format your response using Markdown (MDN) for readability.** Use lists, bold, tables, and other markdown features where appropriate.
        - Keep your response conversational, informative, and focused on helping the user make the best purchasing decision.
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Sorry, I encountered an error: {e}"

class PriceAdvisorChatbot:
    def __init__(self, config: Config):
        self.config = config
        self.rag_system = RAGSystem(config)
        self.chatbot = GeminiChatbot(config, self.rag_system)
    
    def chat(self, user_input: str):
        """Main chat function"""
        if not user_input.strip():
            return "Please ask me something about products and pricing!"
        self.rag_system._setup_chromadb()
        self.rag_system.load_products_to_vector_db()
        search_results = self.rag_system.search_similar_products(user_input, n_results=3)
        if not search_results or not search_results['documents'][0]:
            return "I couldn't find any relevant products for your query. Please try rephrasing your question."
        context = "\n\n".join(search_results['documents'][0])
        print("Context passed to AI:", context)
        response = self.chatbot.generate_response(user_input, context)
        return response 