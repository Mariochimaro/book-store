from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel, field_validator
import re
import time
from database import supabase
from datetime import datetime
# ვიყენებთ ჩვენს უსაფრთხო ფილტრს
from routers.auth import get_current_user 
from services.recommendations.affinity import update_user_affinity

router = APIRouter(
    prefix="/user",
    tags=["User Profile"]
)

# --- PYDANTIC მოდელები ---

class BankAccount(BaseModel):
    bank_name: str
    account_number: str

    @field_validator('account_number')
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        # ვაშორებთ შესაძლო სფეისებს
        clean_v = v.replace(" ", "")
        # ვამოწმებთ სიგრძეს (მინიმუმ 10 სიმბოლო, მაქსიმუმ 22 - რაც აკმაყოფილებს IBAN სტანდარტს)
        if not (10 <= len(clean_v) <= 22):
            raise ValueError("საბანკო ანგარიშის ნომერი უნდა იყოს 10-დან 22 სიმბოლომდე.")
        # ვამოწმებთ რომ შედგებოდეს მხოლოდ ასოებისა და ციფრებისგან (ალფანუმერული)
        if not clean_v.isalnum():
            raise ValueError("საბანკო ანგარიში უნდა შეიცავდეს მხოლოდ ასოებსა და ციფრებს.")
        return clean_v

class UserOnboarding(BaseModel):
    location: str
    phone_numbers: List[str]
    bank_accounts: List[BankAccount]
    birth_year: int
    selling_method: List[str]

    @field_validator('phone_numbers')
    @classmethod
    def validate_phone_numbers(cls, v: List[str]) -> List[str]:
        # ქართული ნომრებისთვის (5xx xxx xxx)
        # ვამოწმებთ, რომ თითოეული ნომერი შეიცავს 9 ციფრს და შესაძლოა იწყებოდეს +995-ით
        phone_pattern = r"^(\+995)?5\d{8}$"
        for phone in v:
            # ვასუფთავებთ სფეისებისგან
            clean_phone = phone.replace(" ", "").replace("-", "")
            if not re.match(phone_pattern, clean_phone):
                raise ValueError(f"ტელეფონის ნომერი '{phone}' არასწორი ფორმატის არის. უნდა იყოს 5xx xxx xxx ფორმატის.")
        return v
    
    @field_validator('birth_year')
    @classmethod
    def validate_age(cls, v: int) -> int:
        # მაგალითად, 1900-დან 2026-მდე
        if not (1900 <= v <= 2026):
            raise ValueError("დაბადების წელი არასწორია.")
        return v

# მოდელი პროფილის განახლებისთვის
class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    location: Optional[str] = None
    phone_numbers: Optional[List[str]] = None
    bank_accounts: Optional[List[BankAccount]] = None
    birth_year: Optional[int] = None
    selling_method: Optional[List[str]] = None

# --- ენდპოინტები ---

# 1. პროფილის მონაცემების წაკითხვა (GET /user/profile)
@router.get("/profile")
def get_user_profile(current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="მომხმარებელი ვერ მოიძებნა"
        )
        
    user_info = response.data[0]
    
    if "password" in user_info:
        del user_info["password"]
        
    return user_info

# 2.1 პროფილის მონაცემების განახლება (PUT /user/profile)
@router.put("/profile")
def update_user_profile(
    data: UserProfileUpdate, 
    current_user = Depends(get_current_user)
):
    user_id = current_user["id"] # ეს უკვე bigint-ია
    
    # ვაშორებთ None მნიშვნელობებს
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="გასანახლებლად მონაცემები არ გადმოცემულა."
        )
        
    try:
        response = supabase.table("users").update(update_data).eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="მომხმარებელი ვერ მოიძებნა"
            )
            
        updated_user = response.data[0]
        if "password" in updated_user:
            del updated_user["password"]
            
        return {
            "status": "success", 
            "message": "პროფილი წარმატებით განახლდა!",
            "user": updated_user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# 2.2 პროფილის ფოტოს განახლება / წაშლა
@router.put("/photo")
async def update_profile_photo(
    action: str = Form(..., description="'upload' ან 'delete'"),
    photo: Optional[UploadFile] = File(None),
    current_user = Depends(get_current_user)
):
    user_id = current_user["id"]
    new_photo_url = None

    if action == "delete":
        new_photo_url = None
    elif action == "upload":
        if not photo:
            raise HTTPException(status_code=400, detail="ფაილი არ არის არჩეული.")
            
        file_size = len(await photo.read())
        await photo.seek(0)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="ფოტოს ზომა აჭარბებს 5MB-ს!")

        try:
            file_ext = photo.filename.split(".")[-1]
            # ვიყენებთ user_id + timestamp, uuid-ის ნაცვლად
            unique_name = f"{user_id}_{int(time.time())}.{file_ext}"
            file_bytes = await photo.read()
            
            supabase.storage.from_("profile-images").upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": photo.content_type}
            )
            new_photo_url = supabase.storage.from_("profile-images").get_public_url(unique_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ფოტოს ატვირთვისას მოხდა შეცდომა: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="არასწორი action პარამეტრი.")

    # ვაახლებთ ბაზას
    try:
        response = supabase.table("users").update({"profile_picture": new_photo_url}).eq("id", user_id).execute()
        updated_user = response.data[0]
        if "password" in updated_user:
            del updated_user["password"]
            
        return {
            "status": "success", 
            "message": "ფოტო წარმატებით განახლდა" if new_photo_url else "ფოტო წაიშალა",
            "profile_picture": new_photo_url,
            "user": updated_user
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ბაზის განახლების შეცდომა: {str(e)}")

# 3. ონბორდინგი
@router.post("/onboarding")
def onboard_user(
    data: UserOnboarding, 
    current_user = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    update_data = {
        "location": data.location,
        "phone_numbers": data.phone_numbers,
        # აქ დაგჭირდება Pydantic ობიექტების ლისტად/დიქტად გადაქცევა ბაზისთვის
        "bank_accounts": [acc.model_dump() for acc in data.bank_accounts], 
        "birth_year": data.birth_year,
        "selling_method": data.selling_method
    }
    
    response = supabase.table("users").update(update_data).eq("id", user_id).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="მომხმარებელი ვერ მოიძებნა"
        )
        
    return {
        "status": "success", 
        "message": "ინფორმაცია წარმატებით განახლდა!",
        "user": response.data[0]
    }

# 4. გამყიდველის წიგნები
@router.get("/my-books")
def get_my_books(current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    try:
        response = supabase.table("books") \
            .select("*") \
            .eq("seller_id", user_id) \
            .execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# 5. ანგარიშის Soft Delete
@router.delete("/delete-account")
def soft_delete_my_account(
    confirm: bool = False, 
    current_user=Depends(get_current_user)
):
    user_id = current_user["id"]
    
    books_res = supabase.table("books").select("id").eq("seller_id", user_id).execute()
    active_books_count = len(books_res.data)
    
    if active_books_count > 0 and not confirm:
        return {
            "status": "warning",
            "message": f"ყურადღება! თქვენ გაქვთ {active_books_count} ატვირთული წიგნი. ანგარიშის გაუქმებით ისინიც წაიშლება. ნამდვილად გსურთ გაგრძელება?",
            "requires_confirmation": True
        }

    try:
        deletion_time = datetime.utcnow().isoformat()
        
        supabase.table("users").update({
            "is_banned": True,
            "is_deleted": True,
            "deleted_at": deletion_time
        }).eq("id", user_id).execute()
        
        if active_books_count > 0:
            supabase.table("books").update({
                "status": "seller_deleted" 
            }).eq("seller_id", user_id).execute()
            
        return {"status": "success", "message": "თქვენი ანგარიში და წიგნები გაუქმდა. მონაცემები სრულად წაიშლება 4 დღეში."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/orders")
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Supabase-ის შეკვრა: მოგვაქვს მოთხოვნა, მასზე მიბმული წიგნი და წიგნზე მიბმული გამყიდველი (users)
    # ვვარაუდობ, book_requests-ში გაქვს buyer_id და book_id
    response = supabase.table("book_requests") \
        .select("id, status, requested_at, books(title, price, users!books_seller_id_fkey(username, phone_numbers, bank_accounts, email))") \
        .eq("buyer_id", user_id) \
        .order("requested_at", desc=True) \
        .execute()
    
    orders = []
    for req in response.data:
        book = req.get("books", {})
        seller = book.get("users", {}) if book else {}
        
        orders.append({
            "order_id": req["id"],
            "status": req["status"],
            "requested_at": req["requested_at"],
            "book": {
                "title": book.get("title"),
                "price": book.get("price")
            },
            "seller": {
                "username": seller.get("username"),
                "email": seller.get("email"),
                "phones": seller.get("phone_numbers", []),
                # ბანკის მონაცემებს ვაჩვენებთ მხოლოდ მაშინ, თუ გადახდის ეტაპზეა
                "bank_accounts": seller.get("bank_accounts", []) if req["status"] == "pending_payment" else None
            }
        })
        
    return {"orders": orders}

@router.get("/seller-stats")
async def get_seller_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # სელექტში დავამატეთ "views"
    response = supabase.table("books") \
        .select("status, price, views") \
        .eq("seller_id", user_id) \
        .is_("deleted_at", "null") \
        .execute()
        
    books = response.data

    total_earned = 0
    total_sold = 0
    active_listings = 0
    pending_sales = 0
    total_views = 0  # შევქმნათ ცვლადი ჯამისთვის

    for book in books:
        # მიმდინარე წიგნის ნახვებს ვუმატებთ საერთო ჯამს
        total_views += book.get("views") or 0
        
        # სტატუსების ლოგიკა
        if book["status"] == "sold":
            total_sold += 1
            if book["price"]:
                total_earned += book["price"]
        elif book["status"] == "active":
            active_listings += 1
        elif book["status"] in ["pending", "reserved"]:
            pending_sales += 1

    return {
        "stats": {
            "total_earned": total_earned,
            "total_sold_books": total_sold,
            "active_listings": active_listings,
            "pending_sales": pending_sales,
            "total_views": total_views  # აქ უკვე რეალური ჯამი ბრუნდება
        }
    }

@router.get("/bookmarks")
async def get_user_bookmarks(current_user: dict = Depends(get_current_user)):
    user_email = current_user["email"]
    
    # ვიღებთ მომხმარებლის ყველა bookmark-ს წიგნის დეტალებთან ერთად
    response = supabase.table("book_bookmarks") \
        .select("id, created_at, books(*)") \
        .eq("user_email", user_email) \
        .execute()
        
    # სუფთა სახით დავაბრუნოთ მხოლოდ წიგნების მასივი
    bookmarked_books = [item["books"] for item in response.data if item.get("books")]
    
    return {"bookmarks": bookmarked_books}

class GenrePreferencesPayload(BaseModel):
    genres: List[str]

@router.put("/genres")
def update_genre_preferences(
    payload: GenrePreferencesPayload,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]
    new_genres = {g.strip() for g in payload.genres if g.strip()}

    res = supabase.table("users").select("genres").eq("id", user_id).single().execute()
    old_genres = set(res.data.get("genres") or []) if res.data else set()

    added   = new_genres - old_genres
    removed = old_genres - new_genres

    for genre in added:
        background_tasks.add_task(
            update_user_affinity, user_id, {"genres": [genre]}, "select_genre_preference"
        )
    for genre in removed:
        background_tasks.add_task(
            update_user_affinity, user_id, {"genres": [genre]}, "deselect_genre_preference"
        )

    supabase.table("users").update({"genres": list(new_genres)}).eq("id", user_id).execute()

    return {"genres": sorted(new_genres)}