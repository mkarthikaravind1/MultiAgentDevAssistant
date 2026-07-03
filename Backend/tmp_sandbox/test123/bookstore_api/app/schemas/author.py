from pydantic import BaseModel
from typing import Optional

class AuthorBase(BaseModel):
    name: str

class AuthorCreate(AuthorBase):
    pass

class AuthorUpdate(BaseModel):
    name: Optional[str] = None

class Author(AuthorBase):
    id: int

    class Config:
        orm_mode = True
