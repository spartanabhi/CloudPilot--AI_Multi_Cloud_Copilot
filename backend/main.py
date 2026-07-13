import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agent.graph import ask_agent

# Load environment variables
load_dotenv()

app = FastAPI(
    title="CloudPilot API",
    version="1.0"
)

# Enable CORS for http://localhost and chrome-extension://*
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_origin_regex="chrome-extension://.*",
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    provider: str
    context: dict | None = None

class ChatResponse(BaseModel):
    response: str
    provider: str

@app.get("/")
async def root():
    return {
        "name": "CloudPilot API",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "provider_support": [
            "aws",
            "azure",
            "gcp"
        ]
    }

@app.post("/ask", response_model=ChatResponse)
async def ask(request: ChatRequest):
    try:
        if request.context:
            answer = ask_agent(request.message, context=request.context)
        else:
            # Fallback to legacy context prepending
            full_question = f"[The user is currently viewing the {request.provider.upper()} console] {request.message}"
            answer = ask_agent(full_question)
            
        return ChatResponse(
            response=answer,
            provider=request.provider
        )
    except Exception as e:
        print(f"Error in /ask: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request with the AI agent."
        )
