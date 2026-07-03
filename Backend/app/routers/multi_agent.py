from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.multi_agent import run_multi_agent_stream

router = APIRouter(prefix="/multi-agent", tags=["multi-agent"])

class MultiAgentRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    task: str = Field(..., min_length=5, max_length=2000)

@router.post("/run")
async def run_multi_agent(req: MultiAgentRequest):
    return StreamingResponse(
        run_multi_agent_stream(req.session_id, req.task),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )