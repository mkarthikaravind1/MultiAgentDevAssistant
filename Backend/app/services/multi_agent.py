import os, json
from typing import TypedDict, Generator
from groq import Groq
from app.services.tools import write_file, _session_dir
from app.services.codebase_rag import client as chroma_client, query_codebase, embed_fn

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"

# ── Shared State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    session_id: str
    task: str
    research_context: str     # from Research node (empty if no codebase)
    subtasks: list            # from Planner
    architecture: dict        # from Architect
    written_files: list       # from Coder
    review: str               # from Reviewer
    verdict: str              # "pass" or "needs_fix"
    coder_iterations: int     # track how many times Coder has run
    summary: str              # from Summary node

# ── Helpers ───────────────────────────────────────────────────────────────────

def _chat(system: str, user: str, json_mode: bool = False) -> str:
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    r = groq_client.chat.completions.create(
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

def _codebase_exists(session_id: str) -> bool:
    """Check if a ChromaDB collection exists for this session."""
    try:
        collections = chroma_client.list_collections()
        names = [c.name for c in collections]
        return f"codebase_{session_id}" in names
    except Exception:
        return False

# ── Agent Nodes ───────────────────────────────────────────────────────────────

def node_research(state: AgentState) -> AgentState:
    """Option A: skip if no codebase uploaded for this session."""
    if not _codebase_exists(state["session_id"]):
        return {**state, "research_context": ""}
    try:
        context = query_codebase(state["session_id"], state["task"], top_k=5)
        return {**state, "research_context": context}
    except Exception:
        return {**state, "research_context": ""}


def node_planner(state: AgentState) -> AgentState:
    research_section = (
        f"\n\nExisting codebase context (use this to avoid duplicating work):\n{state['research_context']}"
        if state["research_context"] else ""
    )
    system = """You are a senior software engineering planner.
Break the given task into 3-6 ordered subtasks.
Respond ONLY with valid JSON:
{
  "subtasks": [
    {"id": 1, "title": "...", "description": "...", "type": "planning|coding|testing|review|documentation"}
  ]
}"""
    raw = _chat(system, f"Task: {state['task']}{research_section}", json_mode=True)
    try:
        parsed = _parse_json(raw)
    except json.JSONDecodeError:
        return {
            **state,
            "subtasks": []
    }
    return {**state, "subtasks": parsed.get("subtasks", [])}


def node_architect(state: AgentState) -> AgentState:
    subtasks_text = "\n".join(
        f"{s['id']}. {s['title']}: {s['description']}"
        for s in state["subtasks"]
    )
    research_section = (
        f"\n\nExisting codebase context:\n{state['research_context']}"
        if state["research_context"] else ""
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
    user = f"Task: {state['task']}\n\nSubtasks:\n{subtasks_text}{research_section}"
    raw = _chat(system, user, json_mode=True)
    parsed = _parse_json(raw)
    return {**state, "architecture": parsed}


# def node_coder(state: AgentState) -> AgentState:
#     arch = state["architecture"]
#     subtasks_text = "\n".join(
#         f"{s['id']}. {s['title']}: {s['description']}"
#         for s in state["subtasks"]
#     )

#     # On re-run: include previous review so Coder knows what to fix
#     fix_section = ""
#     if state["coder_iterations"] > 0 and state["review"]:
#         fix_section = f"\n\nPrevious review feedback to fix:\n{state['review']}"

#     system = """You are an expert software engineer.
# Given a task, subtasks, and architecture plan, write the complete code for every file.
# Return only ONE file per response as JSON: {"path": "...", "content": "..."}.
# Do not return multiple files in a single response.
# Respond ONLY with valid JSON:
# {
#   "files": [
#     {"path": "relative/path/file.py", "content": "full file content here"}
#   ]
# }
# Rules:
# - Write complete, working code for every file listed in the architecture
# - No placeholders, no TODOs — real implementation only
# - Keep files focused and clean"""

#     user = (
#         f"Task: {state['task']}\n\n"
#         f"Subtasks:\n{subtasks_text}\n\n"
#         f"Architecture:\n"
#         f"Folder structure:\n{arch.get('folder_structure', '')}\n\n"
#         f"Files to create: {', '.join(arch.get('files', []))}\n\n"
#         f"Tech decisions:\n" + "\n".join(arch.get("tech_decisions", []))
#         + fix_section
#     )
#     raw = _chat(system, user, json_mode=True)
#     parsed = _parse_json(raw)

#     written = []
#     for f in parsed.get("files", []):
#         path = f.get("path", "")
#         content = f.get("content", "")
#         if path and content:
#             result = write_file(state["session_id"], path, content)
#             written.append({"path": path, "result": result})

#     return {
#         **state,
#         "written_files": written,
#         "coder_iterations": state["coder_iterations"] + 1,
#     }
def node_coder(state: AgentState) -> AgentState:
    arch = state["architecture"]
    files_to_create = arch.get("files", [])
    subtasks_text = "\n".join(
        f"{s['id']}. {s['title']}: {s['description']}"
        for s in state["subtasks"]
    )

    fix_section = ""
    if state["coder_iterations"] > 0 and state["review"]:
        fix_section = f"\n\nPrevious review feedback to fix:\n{state['review']}"

    system = """You are an expert software engineer.
Write complete, production-ready code for ONE file.
Respond ONLY with valid JSON (no markdown):
{"path": "relative/path/file.py", "content": "full file content here"}
Rules:
- Write complete, working code — no placeholders, no TODOs
- Infer correct content from the task, subtasks, and architecture"""

    written = []
    for file_path in files_to_create:
        user = (
            f"Task: {state['task']}\n\n"
            f"Subtasks:\n{subtasks_text}\n\n"
            f"Architecture folder structure:\n{arch.get('folder_structure', '')}\n\n"
            f"All files in project: {', '.join(files_to_create)}\n\n"
            f"Tech decisions:\n" + "\n".join(arch.get("tech_decisions", [])) +
            f"\n\nNow write THIS specific file: {file_path}"
            + fix_section
        )
        try:
            raw = _chat(system, user, json_mode=True)
            parsed = _parse_json(raw)
            path = parsed.get("path", file_path)
            content = parsed.get("content", "")
            if content:
                result = write_file(state["session_id"], path, content)
                written.append({"path": path, "result": result})
        except Exception as e:
            written.append({"path": file_path, "result": f"Error: {str(e)}"})

    return {
        **state,
        "written_files": written,
        "coder_iterations": state["coder_iterations"] + 1,
    }

def node_reviewer(state: AgentState) -> AgentState:
    files_summary = "\n".join(
        f"- {f['path']}: {f['result']}" for f in state["written_files"]
    )
    arch = state["architecture"]
    system = """You are a senior code reviewer.
Review the completed project based on the task, architecture decisions, and files written.
Respond ONLY with valid JSON:
{
  "verdict": "pass or needs_fix",
  "review": "your full review text here — per file feedback and overall summary"
}

verdict rules:
- "pass": code is complete, functional, no critical issues
- "needs_fix": there are critical issues that must be fixed (missing logic, broken imports, incomplete implementations)
- Minor style issues alone should NOT trigger needs_fix
- File type errors (e.g. .sql, .sh not allowed) should NOT trigger needs_fix"""

    user = (
        f"Task: {state['task']}\n\n"
        f"Architecture decisions:\n" + "\n".join(arch.get("tech_decisions", [])) +
        f"\n\nFiles written:\n{files_summary}\n\n"
        f"Notes: {arch.get('notes', '')}"
    )
    raw = _chat(system, user, json_mode=True)
    parsed = _parse_json(raw)

    return {
        **state,
        "verdict": parsed.get("verdict", "pass"),
        "review": parsed.get("review", raw),
    }


def node_summary(state: AgentState) -> AgentState:
    files_written = [
        f["path"] for f in state["written_files"]
        if not f["result"].startswith("Error")
    ]
    system = """You are a technical project manager.
Write a clean, concise handoff summary for the completed project.
Structure it as:
## What Was Built
<brief description>

## Files Created
<list of files>

## Tech Stack
<stack used>

## Next Steps
<3-5 actionable next steps for the developer>

Keep it practical and developer-focused."""

    user = (
        f"Task: {state['task']}\n\n"
        f"Files successfully written:\n" + "\n".join(files_written) +
        f"\n\nArchitecture notes: {state['architecture'].get('notes', '')}\n\n"
        f"Final review:\n{state['review']}"
    )
    summary = _chat(system, user, json_mode=False)

    # Write SUMMARY.md to sandbox
    write_file(state["session_id"], "SUMMARY.md", summary)

    return {**state, "summary": summary}


# ── Conditional Edge ──────────────────────────────────────────────────────────

def should_recode(state: AgentState) -> str:
    """Route back to coder if verdict is needs_fix and under iteration limit."""
    if state["verdict"] == "needs_fix" and state["coder_iterations"] < 2:
        return "coder"
    return "summary"


# ── Graph ─────────────────────────────────────────────────────────────────────

def build_graph():
    from langgraph.graph import StateGraph, END
    g = StateGraph(AgentState)

    g.add_node("research",  node_research)
    g.add_node("planner",   node_planner)
    g.add_node("architect", node_architect)
    g.add_node("coder",     node_coder)
    g.add_node("reviewer",  node_reviewer)
    g.add_node("summary",   node_summary)

    g.set_entry_point("research")
    g.add_edge("research",  "planner")
    g.add_edge("planner",   "architect")
    g.add_edge("architect", "coder")
    g.add_edge("coder",     "reviewer")
    g.add_conditional_edges("reviewer", should_recode, {
        "coder":   "coder",
        "summary": "summary",
    })
    g.add_edge("summary", END)

    return g.compile()

GRAPH = build_graph()

# ── SSE Stream ────────────────────────────────────────────────────────────────

def run_multi_agent_stream(session_id: str, task: str) -> Generator[str, None, None]:
    _session_dir(session_id)

    initial: AgentState = {
        "session_id":       session_id,
        "task":             task,
        "research_context": "",
        "subtasks":         [],
        "architecture":     {},
        "written_files":    [],
        "review":           "",
        "verdict":          "",
        "coder_iterations": 0,
        "summary":          "",
    }

    NODE_STATUS = {
        "research":  "🔎 Researching existing codebase...",
        "planner":   "🧠 Planner is breaking down the task...",
        "architect": "🏗️ Architect is designing the structure...",
        "coder":     "⚙️ Coder is writing files...",
        "reviewer":  "🔍 Reviewer is checking the code...",
        "summary":   "📋 Generating final summary...",
    }

    try:
        for step in GRAPH.stream(initial):
            node_name = list(step.keys())[0]
            state = step[node_name]

            if node_name == "research":
                yield f"event: status\ndata: {NODE_STATUS['research']}\n\n"
                has_context = bool(state.get("research_context", ""))
                payload = json.dumps({
                    "agent": "research",
                    "has_context": has_context,
                    "message": "Codebase context loaded." if has_context else "No codebase uploaded — skipping research.",
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "planner":
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
                iteration = state.get("coder_iterations", 1)
                status_msg = NODE_STATUS["coder"] if iteration == 1 else f"⚙️ Coder is fixing issues (attempt {iteration})..."
                yield f"event: status\ndata: {status_msg}\n\n"
                payload = json.dumps({
                    "agent": "coder",
                    "iteration": iteration,
                    "written_files": state.get("written_files", []),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "reviewer":
                yield f"event: status\ndata: {NODE_STATUS['reviewer']}\n\n"
                payload = json.dumps({
                    "agent": "reviewer",
                    "verdict": state.get("verdict", ""),
                    "review": state.get("review", ""),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

            elif node_name == "summary":
                yield f"event: status\ndata: {NODE_STATUS['summary']}\n\n"
                payload = json.dumps({
                    "agent": "summary",
                    "summary": state.get("summary", ""),
                })
                yield f"event: agent_result\ndata: {payload}\n\n"

        yield "event: done\ndata: {}\n\n"

    except json.JSONDecodeError as e:
        yield f"event: error\ndata: JSON parse error — {str(e)}\n\n"
    except Exception as e:
        yield f"event: error\ndata: {str(e)}\n\n"