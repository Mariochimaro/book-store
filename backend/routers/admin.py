from fastapi import APIRouter, HTTPException, Depends
from routers.auth import require_admin
from pydantic import BaseModel
from typing import List, Optional
from collections import Counter
from datetime import datetime, timedelta
from database import supabase
from routers.auth import get_current_user 
from dateutil.relativedelta import relativedelta
import calendar

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(require_admin)] # როუტერი დაცულია ადმინის ფილტრით
)

# Pydantic მოდელი სტატუსის შესაცვლელად
class BookReview(BaseModel):
    book_id: int
    status: str # 'active', 'rejected' ან 'pending'
    title: Optional[str] = None      # ადმინის მიერ შესწორებული სათაური
    condition: Optional[str] = None  # ადმინის მიერ შესწორებული მდგომარეობა
    genres: Optional[List[str]] = None 
    rejection_reason: Optional[str] = None

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
    if data.status not in ["active", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="არასწორი სტატუსი")

    update_data = {
        "status": data.status,
        "is_approved": data.status == "active"
    }

    if data.status == "active":
        update_data["rejection_reason"] = None
    elif data.status == "rejected" and data.rejection_reason:
        update_data["rejection_reason"] = data.rejection_reason
    
    # თუ ადმინმა რამე შეცვალა, ვამატებთ სააფდეითო ობიექტში
    if data.title:
        update_data["title"] = data.title
    if data.condition:
        update_data["condition"] = data.condition
    if data.genres is not None:
        update_data["genres"] = data.genres
        
    if data.status == "rejected" and data.rejection_reason:
        update_data["rejection_reason"] = data.rejection_reason

    try:
        # ვაფდეითებთ წიგნს და ვითხოვთ დაბრუნდეს განახლებული მონაცემი (რათა გავიგოთ seller_id)
        response = supabase.table("books").update(update_data).eq("id", data.book_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
            
        updated_book = response.data[0]

        # === NOTIFICATION ლოგიკა ===
        if data.status == "rejected":
            # ვიღებთ გამყიდველის ID-ს წიგნიდან (თქვენს ბაზაში შეიძლება ეწეროს user_id ან seller_id)
            seller_id = updated_book.get("seller_id") or updated_book.get("user_id") 
            
            notification_data = {
                "user_id": seller_id,
                "book_id": data.book_id,
                "type": "listing_rejected",
                "message": f"თქვენი განცხადება წიგნზე '{updated_book['title']}' უარყოფილია. მიზეზი: {data.rejection_reason}"
            }
            supabase.table("notifications").insert(notification_data).execute()

        return {"status": "success", "message": "წიგნი დამუშავდა!", "book": updated_book}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 3. უსაფრთხოების ალერტები (IP-ების მიხედვით)
@router.get("/security-alerts")
def get_security_alerts():
    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    
    try:
        logs_res = supabase.table("audit_logs").select("ip_address, user_id, action").gte("created_at", one_hour_ago).execute()
        logs = logs_res.data
        
        if not logs:
            return {"status": "safe", "alerts": [], "message": "ბოლო 1 საათში საეჭვო აქტივობა არ ფიქსირდება."}
            
        ip_counts = Counter([log["ip_address"] for log in logs if log.get("ip_address")])
        
        alerts = []
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

# 4. იუზერის ბლოკირება / განბლოკვა
@router.post("/ban-user/{user_id}")
def ban_user(user_id: int):
    try:
        supabase.table("users").update({"is_banned": True}).eq("id", user_id).execute()
        return {"message": "იუზერი წარმატებით დაიბლოკა"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unban-user/{user_id}")
def unban_user(user_id: int):
    try:
        supabase.table("users").update({"is_banned": False}).eq("id", user_id).execute()
        return {"message": "იუზერი წარმატებით განიბლოკა"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 5. საეჭვო მომხმარებლების სია (Reports Panel-ისთვის)
@router.get("/suspicious_users")
def get_sus_users():
    one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    try:
        # ვიღებთ ბოლო 1 საათის ლოგებს
        logs_res = supabase.table("audit_logs").select("user_id").gte("created_at", one_hour_ago).execute()
        logs = logs_res.data or []

        # ვითვლით თითოეულ იუზერზე რექვესტების რაოდენობას
        user_counts = Counter([log["user_id"] for log in logs if log.get("user_id")])

        suspicious_list = []
        for user_id, count in user_counts.items():
            # თუ იუზერს აქვს მაგალითად 15-ზე მეტი რექვესტი 1 საათში
            if count >= 50:
                user_res = supabase.table("users").select("id, username, email, is_banned").eq("id", user_id).execute()
                if user_res.data:
                    u = user_res.data[0]
                    suspicious_list.append({
                        "user_id": u["id"],
                        "username": u.get("username", "Unknown"),
                        "email": u.get("email", "N/A"),
                        "request_count": count,
                        "is_banned": u.get("is_banned", False)
                    })

        return {"suspicious_users": suspicious_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 6. Audit Logs სრული სია (Logs Panel-ისთვის)
@router.get("/audit-logs")
def get_audit_logs():
    try:
        response = supabase.table("audit_logs").select("""
            *,
            users:user_id(username)
        """).order("created_at", desc=True).execute()

        return {"logs": response.data or []}
    except Exception as e:
        # თუ იუზერთან relation ვერ გააკეთა Supabase-მა, წამოვიღოთ მარტივი სელექტით
        try:
            fallback_res = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(100).execute()
            return {"logs": fallback_res.data or []}
        except Exception as fallback_err:
            raise HTTPException(status_code=500, detail=str(fallback_err))

# 7. წიგნის ყიდვის აქტიური ტაიმერის შემოწმება
@router.get("/pending-confirmation/{book_id}")
def get_pending_confirmation(book_id: int, current_user=Depends(get_current_user)):
    seller_id = current_user["id"]

    res = (
        supabase.table("book_requests")
        .select("id, buyer_id, expires_at")
        .eq("book_id", book_id)
        .eq("seller_id", seller_id)
        .eq("status", "active_timer")
        .order("id", desc=True)
        .limit(1)
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=404,
            detail="ამ წიგნზე აქტიური ყიდვის მოთხოვნა ვერ მოიძებნა."
        )

    return res.data[0]

@router.get("/finance-stats")
async def get_finance_stats(current_user=Depends(get_current_user)):
    try:
        # 1. Total Transactions (გაყიდული წიგნების ჯამური რაოდენობა)
        completed_res = supabase.table("book_requests").select("id", count="exact").eq("status", "completed").execute()
        total_transactions = completed_res.count if completed_res.count is not None else len(completed_res.data or [])

        # 2. Active Sellers (უნიკალური სელერები active წიგნებით)
        books_res = supabase.table("books").select("seller_id").eq("status", "active").execute()
        active_sellers = len(set(b["seller_id"] for b in (books_res.data or []) if b.get("seller_id")))

        # 3. Platform Fee (ჯერ 0-ია)
        platform_fee = 0.0

        # 4. Revenue Chart (მონაცემები ახალი monthly_finance ცხრილიდან)
        finance_res = supabase.table("monthly_finance").select("month_year, total_revenue").execute()
        db_finance_data = {row["month_year"]: float(row["total_revenue"]) for row in (finance_res.data or [])}

        # ვაწყობთ ბოლო 6 თვის სრულ მასივს (თუ რომელიმე თვეში 0 გაყიდვაა, ჩასვამს 0-ს)
        revenue_chart = []
        today = datetime.today()
        
        for i in range(5, -1, -1):
            target_date = today - relativedelta(months=i)
            key_format = target_date.strftime("%Y-%m") # მაგ: '2026-07'
            month_label = calendar.month_abbr[target_date.month] # მაგ: 'Jul'
            
            revenue_chart.append({
                "label": month_label,
                "amount": db_finance_data.get(key_format, 0.0)
            })

        # 5. Genre Popularity (ჟანრები active და sold წიგნებიდან)
        all_books_res = supabase.table("books").select("genres").in_("status", ["active", "sold"]).execute()
        all_books = all_books_res.data or []

        genre_counts = {}
        total_genre_hits = 0
        for book in all_books:
            genres = book.get("genres")
            if isinstance(genres, list):
                for g in genres:
                    if g:
                        genre_counts[g] = genre_counts.get(g, 0) + 1
                        total_genre_hits += 1

        sorted_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        genres_data = []
        for g_label, count in sorted_genres:
            pct = round((count / total_genre_hits) * 100) if total_genre_hits > 0 else 0
            genres_data.append({
                "label": g_label,
                "pct": pct
            })

        return {
            "total_transactions": total_transactions,
            "active_sellers": active_sellers,
            "platform_fee": platform_fee,
            "revenue_chart": revenue_chart,
            "genres": genres_data
        }

    except Exception as e:
        print("Error in finance stats:", e)
        raise HTTPException(status_code=500, detail=str(e))