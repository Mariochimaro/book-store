from fastapi import APIRouter, Depends
from dependencies import get_optional_current_user
from services.recommendations.manager import get_best_recommendations
from services.recommendations import popularity
from database import supabase
from utils import format_public_book

router = APIRouter(prefix="/feed", tags=["Feed"])

# 1. პერსონალიზებული ფიდი ("შენთვის შერჩეული")
@router.get("/")
async def get_feed(current_user = Depends(get_optional_current_user)):
    print(f"DEBUG FEED: current_user object is {current_user}")
    user_id = current_user.get("id") if current_user else None
    print(f"DEBUG FEED: User ID is {user_id}")
    user_email = current_user.get("email") if current_user else None
    
    has_history = False
    if user_id and user_email:
        b_res = supabase.table("book_bookmarks").select("id").eq("user_email", user_email).limit(1).execute()
        r_res = supabase.table("book_ratings").select("id").eq("user_email", user_email).limit(1).execute()
        if b_res.data or r_res.data:
            has_history = True

    books = get_best_recommendations(user_id=user_id, user_email=user_email, user_has_history=has_history)
    public_books = [format_public_book(book) for book in books]
    
    return {"books": public_books}

# 2. პოპულარული ფიდი ("ტრენდული წიგნები")
@router.get("/popular")
async def get_popular_feed():
    print("DEBUG FEED: Fetching global popular books")
    
    # აქ limit შეგიძლია გაზარდო, მაგალითად 20-მდე, რადგან ტრენდებში მეტი წიგნის ნახვა უყვართ
    books = popularity.get_popular_books(limit=15) 
    
    # ვაფორმატებთ ისევე, როგორც მთავარ ფიდს
    public_books = [format_public_book(book) for book in books]
    
    return {"books": public_books}