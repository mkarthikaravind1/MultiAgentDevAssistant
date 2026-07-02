import json, os
from typing import cast
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from groq import Groq
from dotenv import load_dotenv
from app.services.tools import TOOLS_SCHEMA, dispatch_tool
from groq.types.chat import ChatCompletionMessageParam, ChatCompletionToolParam 

load_dotenv()
router = APIRouter(prefix="/tools", tags=["tools"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a dev assistant with access to real tools that operate on the user's codebase.
When you need information or want to take action, call the appropriate tool.
You may call multiple tools in sequence. After gathering results, give a clear final answer."""

class ToolChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)

@router.post("/chat")
async def tool_chat(req: ToolChatRequest):
    def event_stream():
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": req.message},
        ]

        # Agentic loop — max 8 iterations to prevent runaway
        for _ in range(8):
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=cast(list[ChatCompletionMessageParam], messages),
                tools=cast(list[ChatCompletionToolParam], TOOLS_SCHEMA), 
                tool_choice="auto",
            )

            msg = response.choices[0].message
            finish = response.choices[0].finish_reason

            # Stream any text content first
            if msg.content:
                yield json.dumps({"type": "text_chunk", "content": msg.content}) + "\n"

            # No tool calls — we're done
            if finish == "stop" or not msg.tool_calls:
                yield json.dumps({"type": "done"}) + "\n"
                return

            # Append assistant message with tool_calls to history
            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments}
                    }
                    for tc in msg.tool_calls
                ] # type: ignore
            })

            # Execute each tool call
            for tc in msg.tool_calls:
                name = tc.function.name
                try:
                    args = json.loads(tc.function.arguments)
                except Exception:
                    args = {}

                # Notify frontend: tool is being called
                yield json.dumps({"type": "tool_call", "tool_call_id": tc.id, "name": name, "args": args}) + "\n"

                # Run tool
                result = dispatch_tool(req.session_id, name, args)

                # Notify frontend: result is ready
                yield json.dumps({"type": "tool_result", "tool_call_id": tc.id, "result": result}) + "\n"

                # Append tool result to messages for next LLM turn
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })

        # Exceeded max iterations
        yield json.dumps({"type": "error", "content": "Max tool iterations reached"}) + "\n"
        yield json.dumps({"type": "done"}) + "\n"

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")