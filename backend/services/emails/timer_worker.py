import time
import threading
from collections import defaultdict
from datetime import datetime, timezone
from database import supabase

def check_expired_timers(only_for_book_id=None, once=False, simulate_now=None):
    now_utc = simulate_now if simulate_now else datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    query = supabase.table("book_requests").select(
        "id, book_id, seller_id, buyer_id, group_id, expires_at, "
        "books(title, price), buyer:users!book_requests_buyer_id_fkey(username)"
    ).eq("status", "active_timer").lte("expires_at", now_utc)

    if only_for_book_id:
        query = query.eq("book_id", only_for_book_id)

    expired_reqs = query.execute()
    rows = expired_reqs.data

    if not rows:
        return rows

    # ყველა ვადაგასულის სტატუსი ერთბაშად -> checking_payment
    ids = [r["id"] for r in rows]
    supabase.table("book_requests").update({"status": "checking_payment"}).in_("id", ids).execute()

    grouped = defaultdict(list)
    singles = []
    for r in rows:
        if r.get("group_id"):
            grouped[r["group_id"]].append(r)
        else:
            singles.append(r)

    # ცალკეული (non-bulk) მოთხოვნები — ისე, როგორც ადრე
    for r in singles:
        book_title = r["books"]["title"]
        buyer_name = r["buyer"]["username"]
        message = f"'{buyer_name}'-ს სურს თქვენი წიგნის '{book_title}' ყიდვა..."
        supabase.table("notifications").insert({
            "user_id": r["seller_id"],
            "book_id": r["book_id"],
            "request_id": r["id"],
            "type": "payment_check",
            "message": message,
        }).execute()

    # ჯგუფური მოთხოვნები — ერთი ნოთიფიკაცია მთელ ჯგუფზე
    for group_id, group_rows in grouped.items():
        seller_id = group_rows[0]["seller_id"]
        buyer_name = group_rows[0]["buyer"]["username"]
        titles = [r["books"]["title"] for r in group_rows]
        total = sum(float(r["books"]["price"]) for r in group_rows)

        if len(titles) == 1:
            titles_str = titles[0]
        elif len(titles) == 2:
            titles_str = " და ".join(titles)
        else:
            titles_str = f"{titles[0]} და კიდევ {len(titles) - 1} წიგნი"

        message = f"'{buyer_name}'-ს სურს {len(group_rows)} წიგნის ერთდროული ყიდვა ({titles_str}) — ჯამი {total:.2f} ₾"

        supabase.table("notifications").insert({
            "user_id": seller_id,
            "book_id": group_rows[0]["book_id"],   # representative, cover-ისთვის
            "request_id": group_rows[0]["id"],     # representative, FK-ისთვის
            "group_id": group_id,
            "type": "payment_check",
            "message": message,
        }).execute()

    return rows

def timer_worker_loop():
    while True:
        try:
            check_expired_timers()
        except Exception as e:
            import traceback
            print(f"[TimerWorker] Error: {e}")
            traceback.print_exc()
        time.sleep(10)

def start_timer_worker():
    thread = threading.Thread(target=timer_worker_loop, daemon=True)
    thread.start()