import os
from groq import Groq
from typing import TypedDict, Generator
import json
from langgraph.graph import StateGraph, END

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PLANNER_SYSTEM_PROMPT = """You are a senior software engineering planner.
When given a coding task, break it down into clear, ordered subtasks.

Respond ONLY with a valid JSON object in this exact format:
{
  "task": "<restate the original task briefly>",
  "subtasks": [
    {
      "id": 1,
      "title": "<short title>",
      "description": "<what to do and why>",
      "type": "<one of: planning | coding | testing | review | documentation>"
    }
  ]
}

Rules:
- 3 to 7 subtasks only
- Each subtask must be actionable and specific
- No markdown, no explanation outside the JSON
- type must be one of the 5 values listed above"""


class PlannerState(TypedDict):
    task: str
    raw_plan: str
    parsed_plan: dict


def call_llm(task: str) -> str:
    """Node 1: Call Groq and get raw JSON plan."""
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": f"Task: {task}"},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def parse_plan(raw: str) -> dict:
    """Node 2: Parse and validate the JSON plan."""
    # Strip markdown fences if model misbehaves
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    parsed = json.loads(cleaned)

    # Basic validation
    if "task" not in parsed:
        raise ValueError("Missing task")
    assert "task" in parsed and "subtasks" in parsed, "Missing keys"
    assert isinstance(parsed["subtasks"], list), "subtasks must be a list"
    assert 1 <= len(parsed["subtasks"]) <= 10, "Unexpected subtask count"

    return parsed


def run_planner_stream(task: str) -> Generator[str, None, None]:
    """
    Runs the two-node LangGraph planner and yields SSE-friendly chunks.
    Yields status events so the frontend can show progress.
    """

    # --- Build graph ---
    def node_llm(state: PlannerState) -> PlannerState:
        raw = call_llm(state["task"])
        return {**state, "raw_plan": raw}

    def node_parse(state: PlannerState) -> PlannerState:
        parsed = parse_plan(state["raw_plan"])
        return {**state, "parsed_plan": parsed}

    graph = StateGraph(PlannerState)
    graph.add_node("llm", node_llm)
    graph.add_node("parse", node_parse)
    graph.set_entry_point("llm")
    graph.add_edge("llm", "parse")
    graph.add_edge("parse", END)
    app = graph.compile()

    # --- Stream progress + result ---
    yield "event: status\ndata: Analyzing task...\n\n"

    initial_state: PlannerState = {
        "task": task,
        "raw_plan": "",
        "parsed_plan": {},
    }

    final_state = None
    try:
        for step in app.stream(initial_state):
            node_name = list(step.keys())[0]
            if node_name == "llm":
                yield "event: status\ndata: Structuring subtasks...\n\n"
            elif node_name == "parse":
                yield "event: status\ndata: Validating plan...\n\n"
                final_state = step["parse"]

        if final_state and final_state.get("parsed_plan"):
            yield f"event: plan\ndata: {json.dumps(final_state['parsed_plan'])}\n\n"
        else:
            yield "event: error\ndata: Planner returned empty result\n\n"

    except json.JSONDecodeError as e:
        yield f"event: error\ndata: Failed to parse plan JSON — {str(e)}\n\n"
    except AssertionError as e:
        yield f"event: error\ndata: Plan validation failed — {str(e)}\n\n"
    except Exception as e:
        yield f"event: error\ndata: Unexpected error — {str(e)}\n\n"