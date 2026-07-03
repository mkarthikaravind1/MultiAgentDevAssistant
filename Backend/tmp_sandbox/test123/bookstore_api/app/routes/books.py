from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models
from app.utils.database import get_db

router = APIRouter(
    prefix='/books',
    tags=['books'],
)

@router.get('/'
)
def read_books(db: Session = Depends(get_db)):
    return db.query(models.Book).all()

@router.get('/{book_id}'
)
def read_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    return book

@router.post('/'
)
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    db_book = models.Book(**book.dict())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.put('/{book_id}'
)
def update_book(book_id: int, book: schemas.BookUpdate, db: Session = Depends(get_db)):
    db_book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if db_book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    db_book.title = book.title
    db_book.author_id = book.author_id
    db_book.genre_id = book.genre_id
    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete('/{book_id}'
)
def delete_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail='Book not found')
    db.delete(book)
    db.commit()
    return {'message': 'Book deleted'}
