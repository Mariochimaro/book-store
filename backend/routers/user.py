from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pydantic import BaseModel
from database import supabase
from datetime import datetime, timedelta
# ვიყენებთ ჩვენს უსაფრთხო ფილტრს
from routers.auth import get_current_user 

router = APIRouter(
    prefix="/user",
    tags=["User Profile"]
)

# ონბორდინგისთვის მოდელიდან ამოვიღეთ user_id
class UserOnboarding(BaseModel):
    location: str
    phone_numbers: List[str]
    account_numbers: List[str]
    birth_year: int # დაემატა დაბადების წელი

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
        "birth_year": data.birth_year # დაემატა ბაზაში ჩასაწერად
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

# 2. გამყიდველის წიგნები (აქაც user_id-ს ტოკენიდან ვიღებთ)
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
    
@router.delete("/delete-account")
def soft_delete_my_account(
    confirm: bool = False, # ნიკამ ფრონტიდან უნდა გამოაგზავნოს ?confirm=true
    current_user=Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # 1. ვამოწმებთ, აქვს თუ არა წიგნები
    books_res = supabase.table("books").select("id").eq("seller_id", user_id).execute()
    active_books_count = len(books_res.data)
    
    # თუ აქვს წიგნები და confirm=False არის, ვაბრუნებთ Warning-ს
    if active_books_count > 0 and not confirm:
        return {
            "status": "warning",
            "message": f"ყურადღება! თქვენ გაქვთ {active_books_count} ატვირთული წიგნი. ანგარიშის გაუქმებით ისინიც წაიშლება. ნამდვილად გსურთ გაგრძელება?",
            "requires_confirmation": True
        }

    try:
        # 2. ლოგიკური წაშლა (ვუნიშნავთ წაშლის ზუსტ დროს)
        deletion_time = datetime.utcnow().isoformat()
        
        supabase.table("users").update({
            "is_deleted": True,
            "is_banned": True,
            "deleted_at": deletion_time
        }).eq("id", user_id).execute()
        
        # 3. წიგნების სტატუსის შეცვლა
        # 'seller_deleted' სტატუსით ნიკა მიხვდება, რომ ფრონტზე ნაცრისფრად უნდა აჩვენოს და დააწეროს "Deleted User"
        if active_books_count > 0:
            supabase.table("books").update({
                "status": "seller_deleted" 
            }).eq("seller_id", user_id).execute()
            
        return {"status": "success", "message": "თქვენი ანგარიში და წიგნები გაუქმდა. მონაცემები სრულად წაიშლება 4 დღეში."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))