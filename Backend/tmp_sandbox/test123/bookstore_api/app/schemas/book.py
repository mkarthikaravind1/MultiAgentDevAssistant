from pydantic import BaseModel
from typing import Optional

class BookBase(BaseModel):
    title: str
    author_id: int
    genre_id: int

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author_id: Optional[int] = None
    genre_id: Optional[int] = None

class Book(BookBase):
    id: int

    class Config:
        orm_mode = True
