from pydantic import BaseModel
from typing import Optional

class GenreBase(BaseModel):
    name: str

class GenreCreate(GenreBase):
    pass

class GenreUpdate(BaseModel):
    name: Optional[str] = None

class Genre(GenreBase):
    id: int

    class Config:
        orm_mode = True
