from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str

class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None