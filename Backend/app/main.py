import os
import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from groq import Groq, APIError
from dotenv import load_dotenv
from groq.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from typing import cast

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

conversations: dict[str, list[dict]] = {}
MAX_HISTORY_MESSAGES = 50  # prevent unbounded memory growth

class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=4000)

class NewSessionResponse(BaseModel):
    session_id: str

@app.post("/session", response_model=NewSessionResponse)
async def create_session():
    """Generate a new session id so the frontend never invents its own."""
    session_id = str(uuid.uuid4())
    conversations[session_id] = []
    return {"session_id": session_id}

@app.post("/chat")
async def chat(req: ChatRequest):
    # Reject empty/whitespace-only messages
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Auto-create the session if it's unknown instead of hard-failing —
    # change to raise HTTPException(404) instead if you want strict validation
    history = conversations.setdefault(req.session_id, [])

    history.append({"role": "user", "content": req.message})

    # Trim history so it doesn't grow forever / blow context limits
    if len(history) > MAX_HISTORY_MESSAGES:
        conversations[req.session_id] = history[-MAX_HISTORY_MESSAGES:]
        history = conversations[req.session_id]

    def event_stream():
        full_reply = ""
        try:
            stream = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=cast(list[ChatCompletionMessageParam], history),
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    full_reply += delta
                    yield delta
        except APIError as e:
            # Roll back the user message we appended since the call failed
            if history and history[-1]["role"] == "user":
                history.pop()
            yield f"\n[error: {str(e)}]"
            return
        except Exception as e:
            if history and history[-1]["role"] == "user":
                history.pop()
            yield f"\n[error: unexpected failure - {str(e)}]"
            return

        history.append({"role": "assistant", "content": full_reply})

    return StreamingResponse(event_stream(), media_type="text/plain")

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    if session_id not in conversations:
        raise HTTPException(status_code=404, detail="Session not found")
    del conversations[session_id]
    return {"status": "deleted"}

@app.get("/health")
async def health():
    return {"status": "ok"}