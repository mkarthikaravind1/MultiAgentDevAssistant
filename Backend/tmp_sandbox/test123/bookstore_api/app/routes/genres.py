from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models
from app.utils.database import get_db

router = APIRouter(
    prefix='/genres',
    tags=['genres'],
)

@router.get('/'
)
def read_genres(db: Session = Depends(get_db)):
    return db.query(models.Genre).all()

@router.get('/{genre_id}'
)
def read_genre(genre_id: int, db: Session = Depends(get_db)):
    genre = db.query(models.Genre).filter(models.Genre.id == genre_id).first()
    if genre is None:
        raise HTTPException(status_code=404, detail='Genre not found')
    return genre

@router.post('/'
)
def create_genre(genre: schemas.GenreCreate, db: Session = Depends(get_db)):
    db_genre = models.Genre(**genre.dict())
    db.add(db_genre)
    db.commit()
    db.refresh(db_genre)
    return db_genre

@router.put('/{genre_id}'
)
def update_genre(genre_id: int, genre: schemas.GenreUpdate, db: Session = Depends(get_db)):
    db_genre = db.query(models.Genre).filter(models.Genre.id == genre_id).first()
    if db_genre is None:
        raise HTTPException(status_code=404, detail='Genre not found')
    db_genre.name = genre.name
    db.commit()
    db.refresh(db_genre)
    return db_genre

@router.delete('/{genre_id}'
)
def delete_genre(genre_id: int, db: Session = Depends(get_db)):
    genre = db.query(models.Genre).filter(models.Genre.id == genre_id).first()
    if genre is None:
        raise HTTPException(status_code=404, detail='Genre not found')
    db.delete(genre)
    db.commit()
    return {'message': 'Genre deleted'}
