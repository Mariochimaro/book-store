from fastapi import APIRouter, HTTPException, Depends
from routers.auth import require_admin
from pydantic import BaseModel
from typing import List, Optional
from collections import Counter
from datetime import datetime, timedelta
from database import supabase

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(require_admin)] #როუტერი დაცულია ადმინის ფილტრით
)

# Pydantic მოდელი სტატუსის შესაცვლელად
class BookReview(BaseModel):
    book_id: int
    status: str # 'active' ან 'rejected'
    genres: Optional[List[str]] = None # ადმინს შეუძლია ჟანრები შეცვალოს
    rejection_reason: Optional[str] = None # მიზეზი, თუ უარვყოფთ

# 1. Pending წიგნების წამოღება ადმინისთვის
@router.get("/pending-books")
def get_pending_books():
    try:
        response = supabase.table("books").select("""
            *,
            seller:users(id, username, location, phone_numbers)
        """).eq("status", "pending").execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. წიგნის დადასტურება, უარყოფა/კორექტირება
@router.post("/review-book")
def review_book(data: BookReview):
    if data.status not in ["active", "rejected", "pending"]:  # დაემატა 'pending'
        raise HTTPException(status_code=400, detail="სტატუსი უნდა იყოს 'active', 'rejected' ან 'pending'")

    # ვაგროვებთ მონაცემებს განახლებისთვის
    update_data = {
        "status": data.status,
        "is_approved": data.status == "active"
    }
    
    # თუ ჟანრები გამოგზავნა ადმინმა, განვაახლოთ
    if data.genres is not None:
        update_data["genres"] = data.genres
        
    # თუ უარვყოფთ, ჩავწეროთ მიზეზი
    if data.status == "rejected" and data.rejection_reason:
        update_data["rejection_reason"] = data.rejection_reason

    try:
        response = supabase.table("books").update(update_data).eq("id", data.book_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
            
        return {"status": "success", "message": "წიგნი დამუშავდა!", "book": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/security-alerts")
def get_security_alerts(current_user = Depends(require_admin)):
    # ვიღებთ ბოლო 1 საათის ლოგებს
    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    
    try:
        logs_res = supabase.table("audit_logs").select("ip_address, user_id, action").gte("created_at", one_hour_ago).execute()
        logs = logs_res.data
        
        if not logs:
            return {"status": "safe", "alerts": [], "message": "ბოლო 1 საათში საეჭვო აქტივობა არ ფიქსირდება."}
            
        # ვითვლით რომელი IP-დან ან იუზერიდან მოვიდა ყველაზე მეტი მოთხოვნა
        ip_counts = Counter([log["ip_address"] for log in logs if log.get("ip_address")])
        
        alerts = []
        # თუ რომელიმე IP-მ 20-ზე მეტი მოქმედება შეასრულა (Brute force ან სპამი)
        for ip, count in ip_counts.items():
            if count > 20:
                alerts.append({
                    "type": "HIGH_TRAFFIC",
                    "target": ip,
                    "count": count,
                    "message": f"ყურადღება: ამ IP მისამართიდან დაფიქსირდა {count} მოქმედება ბოლო 1 საათში!"
                })
                
        return {
            "status": "warning" if alerts else "safe",
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ადმინის პანელში: იუზერის ბლოკირება
@router.post("/ban-user/{user_id}")
def ban_user(user_id: int):
    # უბრალოდ ვუცვლით სტატუსს 'banned'-ზე
    supabase.table("users").update({"is_banned": True}).eq("id", user_id).execute()
    return {"message": "იუზერი წარმატებით დაიბლოკა"}

@router.post("/unban-user/{user_id}")
def unban_user(user_id: int):
    supabase.table("users").update({"is_banned": False}).eq("id", user_id).execute()
    return {"message": "იუზერი წარმატებით განიბლოკა"}