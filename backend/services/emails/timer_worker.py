import time
import threading
from datetime import datetime, timezone
from database import supabase

def check_expired_timers(only_for_book_id=None, once=False, simulate_now=None):
    """
    ამოწმებს, გავიდა თუ არა 15 წუთი 'active_timer' სტატუსის მქონე მოთხოვნებზე.
    'simulate_now' პარამეტრი გამოიყენება ტესტებში დროის გადასახვევად.
    """
    # თუ ტესტიდან მოგვივა სიმულირებული დრო, გამოვიყენებთ მას, თუ არადა რეალურ UTC დროს
    now_utc = simulate_now if simulate_now else datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    query = supabase.table("book_requests").select(
        "id, book_id, seller_id, buyer_id, expires_at, books(title), buyer:users!buyer_id(username)"
    ).eq("status", "active_timer").lte("expires_at", now_utc)
    
    if only_for_book_id:
        query = query.eq("book_id", only_for_book_id)
        
    expired_reqs = query.execute()

    for req in expired_reqs.data:
        req_id = req["id"]
        book_title = req["books"]["title"]
        buyer_name = req["buyer"]["username"]
        seller_id = req["seller_id"]
        book_id = req["book_id"]
        
        # სტატუსის განახლება
        supabase.table("book_requests").update({"status": "checking_payment"}).eq("id", req_id).execute()
        
        # ნოთიფიკაციის შექმნა
        notification_message = f"'{buyer_name}'-ს სურს თქვენი წიგნის '{book_title}' ყიდვა..."
        supabase.table("notifications").insert({
            "user_id": seller_id,
            "book_id": book_id,
            "type": "payment_check",
            "message": notification_message
        }).execute()

    return expired_reqs.data

def timer_worker_loop():
    while True:
        check_expired_timers()
        time.sleep(10) # 10 წამში ერთხელ ვამოწმებთ

# ფუნქცია, რომელსაც FastAPI-ის ჩართვისას გამოვიძახებთ
def start_timer_worker():
    thread = threading.Thread(target=timer_worker_loop, daemon=True)
    thread.start()