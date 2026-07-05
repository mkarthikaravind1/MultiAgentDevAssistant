from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from todo_app.database import get_db
from todo_app.models import User
from todo_app.schemas import UserCreate, UserUpdate

router = APIRouter()

@router.get('/users/')
def read_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.get('/users/{user_id}')
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')
    return user

@router.post('/users/')
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put('/users/{user_id}')
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail='User not found')
    db_user.username = user.username
    db_user.email = user.email
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete('/users/{user_id}')
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail='User not found')
    db.delete(user)
    db.commit()
    return {'message': 'User deleted successfully'}