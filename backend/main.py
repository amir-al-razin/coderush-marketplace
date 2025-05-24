from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .chatbot import PriceAdvisorChatbot, Config

app = FastAPI()

# Allow CORS for local Next.js frontend (default: http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate the chatbot once at startup
advisor_chatbot = PriceAdvisorChatbot(Config())

@app.get("/")
def read_root():
    return {"message": "FastAPI backend is running!"}

@app.post("/chat/advisor")
async def chat_with_advisor(request: Request):
    data = await request.json()
    user_message = data.get("message", "")
    response = advisor_chatbot.chat(user_message)
    return JSONResponse({"response": response})
