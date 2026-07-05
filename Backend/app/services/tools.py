#tools.py
import os, subprocess
import fnmatch
import shlex

CODEBASE_ROOT = "./tmp_codebase"
FALLBACK_ROOT = "./tmp_sandbox"

ALLOWED_EXT = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".md",
               ".json", ".html", ".css", ".txt", ".yml", ".yaml", ".toml", ".cfg", ".ini"}

BLOCKED_COMMANDS = {"rm", "rmdir", "del", "format", "mkfs", "dd", "shutdown",
                    "reboot", "kill", "pkill", "wget", "curl", "nc", "ncat", "ssh"}

def _session_dir(session_id: str) -> str:
    codebase = os.path.join(CODEBASE_ROOT, session_id)
    if os.path.isdir(codebase):
        entries = os.listdir(codebase)
        if len(entries) == 1 and os.path.isdir(os.path.join(codebase, entries[0])):
            return os.path.join(codebase, entries[0])
        return codebase
    fallback = os.path.join(FALLBACK_ROOT, session_id)
    os.makedirs(fallback, exist_ok=True)
    return fallback

def read_file(session_id: str, path: str) -> str:
    root = _session_dir(session_id)
    full = os.path.realpath(os.path.join(root, path))
    if not full.startswith(os.path.realpath(root)):
        return "Error: path traversal detected"
    if not os.path.isfile(full):
        return f"Error: file not found: {path}"
    if os.path.splitext(full)[1] not in ALLOWED_EXT:
        return f"Error: file type not allowed"
    try:
        with open(full, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        if len(content) > 8000:
            content = content[:8000] + f"\n\n... [truncated, {len(content)} chars total]"
        return content
    except Exception as e:
        return f"Error: {e}"

def write_file(session_id: str, path: str, content: str) -> str:
    root = _session_dir(session_id)
    full = os.path.realpath(os.path.join(root, path))
    if not full.startswith(os.path.realpath(root)):
        return "Error: path traversal detected"
    if os.path.splitext(full)[1] not in ALLOWED_EXT:
        return "Error: file type not allowed"
    try:
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Written {len(content)} chars to {path}"
    except Exception as e:
        return f"Error: {e}"

def search_folder(session_id: str, pattern: str, directory: str = ".") -> str:
    root = _session_dir(session_id)
    search_root = os.path.realpath(os.path.join(root, directory))
    if not search_root.startswith(os.path.realpath(root)):
        return "Error: path traversal detected"
    try:
        matches = []
        for dirpath, dirs, files in os.walk(search_root):
            dirs[:] = [d for d in dirs if d not in {"node_modules","venv",".git","__pycache__","dist","build"}]
            for fname in files:
                if fnmatch.fnmatch(fname,pattern):
                    matches.append(os.path.relpath(os.path.join(dirpath, fname), root))
        return "\n".join(matches[:100]) if matches else f"No files matching '{pattern}'"
    except Exception as e:
        return f"Error: {e}"

def run_command(session_id: str, command: str) -> str:
    root = _session_dir(session_id)
    first = command.strip().split()[0].lower() if command.strip() else ""
    if first in BLOCKED_COMMANDS:
        return f"Error: '{first}' is not allowed"
    try:
        r = subprocess.run(shlex.split(command), shell=False, cwd=root, capture_output=True, text=True, timeout=15)
        out = (r.stdout + ("\n[stderr]\n" + r.stderr if r.stderr else "")).strip()
        if not out:
            return f"(exited {r.returncode}, no output)"
        return out[:4000] + ("\n... [truncated]" if len(out) > 4000 else "")
    except subprocess.TimeoutExpired:
        return "Error: timed out after 15s"
    except Exception as e:
        return f"Error: {e}"

def git_status(session_id: str) -> str:
    root = _session_dir(session_id)
    try:
        r = subprocess.run(["git", "status"], cwd=root, capture_output=True, text=True, timeout=10)
        out = (r.stdout + r.stderr).strip()
        log = subprocess.run(["git", "log", "--oneline", "-5"], cwd=root, capture_output=True, text=True, timeout=5)
        if log.stdout.strip():
            out += "\n\n-- Last 5 commits --\n" + log.stdout.strip()
        return out or "No git output"
    except FileNotFoundError:
        return "Error: git not found"
    except Exception as e:
        return f"Error: {e}"

TOOLS_SCHEMA = [
    {"type":"function","function":{"name":"read_file","description":"Read a file in the codebase.","parameters":{"type":"object","properties":{"path":{"type":"string"}},"required":["path"]}}},
    {"type":"function","function":{"name":"write_file","description":"Write/overwrite a file in the codebase.","parameters":{"type":"object","properties":{"path":{"type":"string"},"content":{"type":"string"}},"required":["path","content"]}}},
    {"type":"function","function":{"name":"search_folder","description":"List or search files in the codebase by glob pattern. Use '*' to list all files in a directory, '*.py' for all Python files, etc. Use this when the user wants to explore or list files.","parameters":{"type":"object","properties":{"pattern":{"type":"string"},"directory":{"type":"string","default":"."}},"required":["pattern"]}}},
    {"type":"function","function":{"name":"run_command","description":"Run a shell command in the codebase dir.","parameters":{"type":"object","properties":{"command":{"type":"string"}},"required":["command"]}}},
    {"type":"function","function":{"name":"git_status","description":"Get git status and recent commits.","parameters":{"type":"object","properties":{},"required":[]}}},
    {"type":"function","function":{
        "name":"list_directory",
        "description":"List all files and subdirectories inside a given folder in the codebase. Use this when the user wants to see what's in a directory.",
        "parameters":{"type":"object","properties":{
            "path":{"type":"string","description":"Relative directory path, e.g. 'src' or '.' for root","default":"."}
        },"required":[]}
    }},
]

def dispatch_tool(session_id: str, name: str, args: dict) -> str:
    if name == "read_file":      return read_file(session_id, args.get("path",""))
    if name == "write_file":     return write_file(session_id, args.get("path",""), args.get("content",""))
    if name == "search_folder":  return search_folder(session_id, args.get("pattern","*"), args.get("directory","."))
    if name == "run_command":    return run_command(session_id, args.get("command",""))
    if name == "git_status":     return git_status(session_id)
    if name == "list_directory": return list_directory(session_id, args.get("path", "."))
    return f"Error: unknown tool '{name}'"

def list_directory(session_id: str, path: str = ".") -> str:
    root = _session_dir(session_id)
    full = os.path.realpath(os.path.join(root, path))
    if not full.startswith(os.path.realpath(root)):
        return "Error: path traversal detected"
    if not os.path.isdir(full):
        return f"Error: directory not found: {path}"
    try:
        entries = []
        for entry in sorted(os.scandir(full), key=lambda e: (not e.is_dir(), e.name)):
            prefix = "[DIR] " if entry.is_dir() else "[FILE]"
            entries.append(f"{prefix} {entry.name}")
        return "\n".join(entries) if entries else f"Directory '{path}' is empty."
    except Exception as e:
        return f"Error: {e}"