#codebase_rag.py
import os, shutil, zipfile, uuid
import chromadb
from chromadb.utils import embedding_functions
from chromadb.api.types import EmbeddingFunction

CHROMA_PATH = "./chroma_codebase_db"
ALLOWED_EXT = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".md", ".json", ".html", ".css", ".txt"}
SKIP_DIRS = {"node_modules", "venv", ".git", "__pycache__", "dist", "build"}
SKIP_FILES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}

client = chromadb.PersistentClient(path=CHROMA_PATH)
embed_fn: EmbeddingFunction = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")  # type: ignore

def extract_zip(zip_path: str, session_id: str) -> str:
    extract_dir = f"./tmp_codebase/{session_id}"
    os.makedirs(extract_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(extract_dir)
    return extract_dir

def chunk_file(text: str, chunk_size=800, overlap=100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks

def chunk_codebase(root_dir: str):
    documents, metadatas, ids = [], [], []
    for dirpath, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if fname in SKIP_FILES:        # ← add this
                continue
            ext = os.path.splitext(fname)[1]
            if ext not in ALLOWED_EXT:
                continue
            fpath = os.path.join(dirpath, fname)
            rel_path = os.path.relpath(fpath, root_dir)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
            except Exception:
                continue
            for i, chunk in enumerate(chunk_file(text)):
                if not chunk.strip():
                    continue
                documents.append(f"File: {rel_path}\n\n{chunk}")
                metadatas.append({"file_path": rel_path, "chunk_index": i})
                ids.append(str(uuid.uuid4()))
    return documents, metadatas, ids

def index_codebase(zip_path: str, session_id: str):
    extract_dir = extract_zip(zip_path, session_id)
    documents, metadatas, ids = chunk_codebase(extract_dir)

    collection = client.get_or_create_collection(
        name=f"codebase_{session_id}", embedding_function=embed_fn
    )
    # Batch add (Chroma has a max batch size, so chunk it)
    BATCH = 100
    for i in range(0, len(documents), BATCH):
        collection.add(
            documents=documents[i:i+BATCH],
            metadatas=metadatas[i:i+BATCH],
            ids=ids[i:i+BATCH],
        )

    shutil.rmtree(extract_dir, ignore_errors=True)
    return {"files_indexed": len(set(m["file_path"] for m in metadatas)), "chunks_indexed": len(documents)}

def query_codebase(session_id: str, question: str, top_k=8):
    collection = client.get_collection(name=f"codebase_{session_id}", embedding_function=embed_fn)
    results = collection.query(query_texts=[question], n_results=top_k)

    docs = results.get("documents") or [[]]
    metas = results.get("metadatas") or [[]]
    retrieved = []
    for doc, meta in zip(docs[0], metas[0]):
        retrieved.append(f"# {meta['file_path']} (chunk {meta['chunk_index']})\n{doc}")
    return "\n\n---\n\n".join(retrieved)