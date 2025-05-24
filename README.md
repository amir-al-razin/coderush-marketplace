# Coderush Marketplace

A modern web application for student identity and marketplace features, built with Next.js, Supabase, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Next.js** (App Router)
- **React**
- **Supabase** (Auth, Database, Storage, Realtime)
- **Tailwind CSS**
- **shadcn/ui** (UI components)
- **pnpm** (package manager)
- **FastAPI** (AI backend)

## Major Features

- **Student Authentication & Profiles**: University-verified registration, profile management.
- **Product Listings**: Create, browse, and search products with images and filters.
- **Bidding System**: Place and manage bids on products.
- **Comments & Seller Replies**: Comment on products, sellers can reply once per comment.
- **Reviews & Ratings**: Leave reviews and star ratings for products and sellers.
- **Real-Time Chat**: Buyer-seller chat per product, with real-time updates and message history.
- **Image Upload in Chat**: Send images in chat (Supabase Storage, public bucket `chat-images`).
- **Notifications**: Real-time notifications for bids, comments, and more.
- **AI Price Advisor**: Chatbot powered by Gemini (RAG with Supabase products table), answers in Markdown.
- **Seller Chat Management**: Sellers can view and manage all their chats in a dedicated dashboard.
- **Dark Mode**: Fully themeable UI.

## Setup Notes

### Supabase
- Create a public storage bucket named `chat-images` for chat image uploads.
- Ensure the `messages` table has an `image_url` column (migration included).
- Set up RLS policies for privacy and security (see codebase for details).

### Running the App

1. **Frontend**
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   # Open http://localhost:3000
   ```
2. **Backend (AI/Advisor)**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   # Ensure .env and API keys are set
   ```

## Folder Structure

```
.
├── frontend/           # Next.js app (UI, chat, marketplace)
├── backend/            # FastAPI backend (AI, RAG, advisor)
├── README.md           # Project documentation
└── ...
```

---

For more details, see the `frontend/README.md`. 