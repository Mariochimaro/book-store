from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from pydantic import BaseModel
from database import supabase
from datetime import datetime
# ვიყენებთ ჩვენს უსაფრთხო ფილტრს
from routers.auth import get_current_user 

router = APIRouter(
    prefix="/user",
    tags=["User Profile"]
)

# --- PYDANTIC მოდელები ---

class UserOnboarding(BaseModel):
    location: str
    phone_numbers: List[str]
    account_numbers: List[str]
    birth_year: int

# მოდელი პროფილის განახლებისთვის (ყველა ველი ნებაყოფლობითია - Optional)
class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    location: Optional[str] = None
    phone_numbers: Optional[List[str]] = None
    account_numbers: Optional[List[str]] = None
    birth_year: Optional[int] = None

# --- ენდპოინტები ---

# 1. პროფილის მონაცემების წაკითხვა (GET /user/profile)
@router.get("/profile")
def get_user_profile(current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # წამოვიღოთ იუზერის სრული ინფო ბაზიდან
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="მომხმარებელი ვერ მოიძებნა"
        )
        
    user_info = response.data[0]
    
    # უსაფრთხოებისთვის პაროლის ჰეშს ფრონტზე არ ვატანთ
    if "password" in user_info:
        del user_info["password"]
        
    return user_info

# 2. პროფილის მონაცემების განახლება (PUT /user/profile)
@router.put("/profile")
def update_user_profile(
    data: UserProfileUpdate, 
    current_user = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # გამოვრიცხოთ ის ველები, რომლებიც იუზერმა არ გამოაგზავნა (None-ები)
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
        "account_numbers": data.account_numbers,
        "birth_year": data.birth_year
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