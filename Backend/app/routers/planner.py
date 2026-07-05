from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.planner import run_planner_stream

router = APIRouter(prefix="/planner", tags=["planner"])

class PlannerRequest(BaseModel):
    task: str = Field(..., min_length=5, max_length=2000)

@router.post("/plan")
async def plan_task(req: PlannerRequest):
    return StreamingResponse(
        run_planner_stream(req.task),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )