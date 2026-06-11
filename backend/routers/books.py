from fastapi import APIRouter, HTTPException, status
from typing import Optional
from database import supabase
from utils import search_match, sort_books_by_genres

router = APIRouter(
    prefix="/books",
    tags=["Books"]
)

# 1. წიგნების სიის წამოღება "ჭკვიანი" ფილტრაციითა და სორტირებით
@router.get("")
def get_books(
    genre: Optional[str] = None, 
    max_price: Optional[float] = None, 
    language: Optional[str] = None, 
    condition: Optional[str] = None, 
    q: Optional[str] = None
):
    # ვიწყებთ მოთხოვნას Supabase-თან. 
    # თან ავტომატურად "მოაყოლე" გამყიდველის ინფორმაცია users ცხრილიდან!
    query = supabase.table("books").select("""
    *,
    seller:users(
        id,
        username,
        location                                  
    )
    """)
    # ბაზის დონეზე ფილტრაცია მაქსიმალური სისწრაფისთვის
    if max_price:
        query = query.lte("price", max_price) # lte = Less Than or Equal (<=)

    response = query.execute()
    db_books = response.data

    # ახლა მივმართავთ Python-ის ფილტრებს იმ ველებზე, სადაც შენი ტრანსლიტერაციის ლოგიკა გვაქვს
    filtered_books = db_books

    if language:
        filtered_books = [b for b in filtered_books if search_match(language, b["language"])]

    if condition:
        filtered_books = [b for b in filtered_books if search_match(condition, b["condition"])]

    if q:
        filtered_books = [
            b for b in filtered_books 
            if search_match(q, b["title"]) or search_match(q, b["description"])
        ]

    # ჟანრების მრავალკომპონენტიანი "ჭკვიანი" სორტირება, რომელიც წინა ეტაპზე დავწერეთ
    if genre:
        filtered_books = sort_books_by_genres(filtered_books, genre)

    return filtered_books


# 2. კონკრეტული ერთი წიგნის დეტალები ID-ით (ნიკას BookDetail.jsx გვერდისთვის)
@router.get("/{book_id}")
def get_book_by_id(book_id: int):
    response = supabase.table("books").select("""
    *,
    seller:users(
        id,
        username,
        location
    )
    """).eq("id", book_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="წიგნი მოცემული ID-ით ვერ მოიძებნა!"
        )
        
    return response.data[0]