import os, json
from typing import TypedDict, Generator
from groq import Groq
from dotenv import load_dotenv
from app.services.tools import write_file, _session_dir

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

# ── Shared State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    session_id: str
    task: str
    subtasks: list        # from Planner
    architecture: dict    # from Architect
    written_files: list   # from Coder
    review: str           # from Reviewer

# ── Helpers ───────────────────────────────────────────────────────────────────

def _chat(system: str, user: str, json_mode: bool = False) -> str:
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    r = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
        **kwargs,
    )
    return r.choices[0].message.content or ""

def _parse_json(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(
            lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        )
    return json.loads(cleaned)

# ── Agent Nodes ───────────────────────────────────────────────────────────────

def node_planner(state: AgentState) -> AgentState:
    system = """You are a senior software engineering planner.
Break the given task into 3-6 ordered subtasks.
Respond ONLY with valid JSON:
{
  "subtasks": [
    {"id": 1, "title": "...", "description": "...", "type": "planning|coding|testing|review|documentation"}
  ]
}"""
    raw = _chat(system, f"Task: {state['task']}", json_mode=True)
    parsed = _parse_json(raw)
    return {**state, "subtasks": parsed.get("subtasks", [])}


def node_architect(state: AgentState) -> AgentState:
    subtasks_text = "\n".join(
        f"{s['id']}. {s['title']}: {s['description']}"
        for s in state["subtasks"]
    )
    system = """You are a software architect.
Given a task and its subtasks, design the project structure and key technical decisions.
Respond ONLY with valid JSON:
{
  "folder_structure": "ascii tree of files/folders",
  "files": ["list of file paths to create"],
  "tech_decisions": ["decision 1", "decision 2"],
  "notes": "any important implementation notes"
}"""
    user = f"Task: {state['task']}\n\nSubtasks:\n{subtasks_text}"
    raw = _chat(system, user, json_mode=True)
    parsed = _parse_json(raw)
    return {**state, "architecture": parsed}


def node_coder(state: AgentState) -> AgentState:
    arch = state["architecture"]
    subtasks_text = "\n".join(
        f"{s['id']}. {s['title']}: {s['description']}"
        for s in state["subtasks"]
    )
    system = """You are an expert software engineer.
Given a task, subtasks, and architecture plan, write the complete code for every file.
Respond ONLY with valid JSON:
{
  "files": [
    {"path": "relative/path/file.py", "content": "full file content here"}
  ]
}
Rules:
- Write complete, working code for every file listed in the architecture
- No placeholders, no TODOs — real implementation only
- Keep files focused and clean"""
    user = (
        f"Task: {state['task']}\n\n"
        f"Subtasks:\n{subtasks_text}\n\n"
        f"Architecture:\n"
        f"Folder structure:\n{arch.get('folder_structure','')}\n\n"
        f"Files to create: {', '.join(arch.get('files', []))}\n\n"
        f"Tech decisions:\n" + "\n".join(arch.get("tech_decisions", []))
    )
    raw = _chat(system, user, json_mode=True)
    parsed = _parse_json(raw)

    written = []
    for f in parsed.get("files", []):
        path = f.get("path", "")
        content = f.get("content", "")
        if path and content:
            result = write_file(state["session_id"], path, content)
            written.append({"path": path, "result": result})

    return {**state, "written_files": written}


def node_reviewer(state: AgentState) -> AgentState:
    files_summary = "\n".join(
        f"- {f['path']}: {f['result']}" for f in state["written_files"]
    )
    arch = state["architecture"]
    system = """You are a senior code reviewer.
Review the completed project based on the task, architecture decisions, and files written.
Give specific, actionable feedback per file and an overall verdict.
Respond in plain text — clear sections per file, then an Overall Summary."""
    user = (
        f"Task: {state['task']}\n\n"
        f"Architecture decisions:\n" + "\n".join(arch.get("tech_decisions", [])) +
        f"\n\nFiles written:\n{files_summary}\n\n"
        f"Notes: {arch.get('notes', '')}"
    )
    review = _chat(system, user, json_mode=False)
    return {**state, "review": review}

# ── Graph ─────────────────────────────────────────────────────────────────────

def build_graph():
    from langgraph.graph import StateGraph, END
    g = StateGraph(AgentState)
    g.add_node("planner",   node_planner)
    g.add_node("architect", node_architect)
    g.add_node("coder",     node_coder)
    g.add_node("reviewer",  node_reviewer)
    g.set_entry_point("planner")
    g.add_edge("planner",   "architect")
    g.add_edge("architect", "coder")
    g.add_edge("coder",     "reviewer")
    g.add_edge("reviewer",  END)
    return g.compile()

GRAPH = build_graph()

# ── SSE Stream ────────────────────────────────────────────────────────────────

def run_multi_agent_stream(session_id: str, task: str) -> Generator[str, None, None]:
    # Ensure sandbox dir exists before agents start writing
    _session_dir(session_id)

    initial: AgentState = {
        "session_id": session_id,
        "task": task,
        "subtasks": [],
        "architecture": {},
        "written_files": [],
        "review": "",
    }

    NODE_STATUS = {
        "planner":   "🧠 Planner is breaking down the task...",
        "architect": "🏗️ Architect is designing the structure...",
        "coder":     "⚙️ Coder is writing files...",
        "reviewer":  "🔍 Reviewer is checking the code...",
    }

    try:
        for step in GRAPH.stream(initial):
            node_name = list(step.keys())[0]
            state = step[node_name]

            if node_name == "planner":
                yield f"event: status\ndata: {NODE_STATUS['planner']}\n\n"
                payload = json.dumps({
                    "agent": "planner",
                    "subtasks": state.get("subtasks", []),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "architect":
                yield f"event: status\ndata: {NODE_STATUS['architect']}\n\n"
                payload = json.dumps({
                    "agent": "architect",
                    "architecture": state.get("architecture", {}),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "coder":
                yield f"event: status\ndata: {NODE_STATUS['coder']}\n\n"
                payload = json.dumps({
                    "agent": "coder",
                    "written_files": state.get("written_files", []),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "reviewer":
                yield f"event: status\ndata: {NODE_STATUS['reviewer']}\n\n"
                payload = json.dumps({
                    "agent": "reviewer",
                    "review": state.get("review", ""),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

        yield "event: done\ndata: {}\n\n"

    except json.JSONDecodeError as e:
        yield f"event: error\ndata: JSON parse error — {str(e)}\n\n"
    except Exception as e:
        yield f"event: error\ndata: {str(e)}\n\n"