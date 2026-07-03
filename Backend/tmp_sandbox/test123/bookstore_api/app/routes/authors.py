from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models
from app.utils.database import get_db

router = APIRouter(
    prefix='/authors',
    tags=['authors'],
)

@router.get('/'
)
def read_authors(db: Session = Depends(get_db)):
    return db.query(models.Author).all()

@router.get('/{author_id}'
)
def read_author(author_id: int, db: Session = Depends(get_db)):
    author = db.query(models.Author).filter(models.Author.id == author_id).first()
    if author is None:
        raise HTTPException(status_code=404, detail='Author not found')
    return author

@router.post('/'
)
def create_author(author: schemas.AuthorCreate, db: Session = Depends(get_db)):
    db_author = models.Author(**author.dict())
    db.add(db_author)
    db.commit()
    db.refresh(db_author)
    return db_author

@router.put('/{author_id}'
)
def update_author(author_id: int, author: schemas.AuthorUpdate, db: Session = Depends(get_db)):
    db_author = db.query(models.Author).filter(models.Author.id == author_id).first()
    if db_author is None:
        raise HTTPException(status_code=404, detail='Author not found')
    db_author.name = author.name
    db.commit()
    db.refresh(db_author)
    return db_author

@router.delete('/{author_id}'
)
def delete_author(author_id: int, db: Session = Depends(get_db)):
    author = db.query(models.Author).filter(models.Author.id == author_id).first()
    if author is None:
        raise HTTPException(status_code=404, detail='Author not found')
    db.delete(author)
    db.commit()
    return {'message': 'Author deleted'}
