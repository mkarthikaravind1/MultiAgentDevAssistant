from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import books, authors, genres

app = FastAPI()

app.include_router(books.router)
app.include_router(authors.router)
app.include_router(genres.router)

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
