#codebase.py
from fastapi import APIRouter, UploadFile, File, Form
from app.services.codebase_rag import index_codebase, query_codebase
import shutil, os
from groq import Groq
# from dotenv import load_dotenv

# load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

router = APIRouter(prefix="/codebase", tags=["codebase"])

@router.post("/upload")
async def upload_codebase(session_id: str = Form(...), file: UploadFile = File(...)):
    os.makedirs("./tmp_uploads", exist_ok=True)
    zip_path = f"./tmp_uploads/{session_id}.zip"
    with open(zip_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

        try:
            stats = index_codebase(zip_path, session_id)
        finally:
            if os.path.exists(zip_path):
                os.remove(zip_path)
    return {"status": "indexed", **stats}

@router.post("/ask")
async def ask_codebase(session_id: str = Form(...), question: str = Form(...)):
    context = query_codebase(session_id, question)

    prompt = f"""You are a codebase assistant. Answer using ONLY the context below.
If the answer isn't in the context, say so.

Context:
{context}

Question: {question}"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
    )
    return {"answer": response.choices[0].message.content, "sources": context}