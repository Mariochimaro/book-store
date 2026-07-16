import os
os.environ["ENVIRONMENT"] = "development"

import pytest
from fastapi.testclient import TestClient
from main import app
from database import supabase
from services.emails.email_worker import email_worker
from services.emails.timer_worker import check_expired_timers
from datetime import datetime, timedelta, timezone

client = TestClient(app)

# სატესტო მონაცემები ბაზიდან
USERS = {
    "string": {"email": "user@example.com", "password": "string"},
    "maka": {"email": "maka@example.com", "password": "password"},
    "kuki": {"email": "kuki@kuki.com", "password": "kuki"}
}

# მაკას წიგნი სატესტოდ (დინოზავრების ეპოქა - აქტიური)
MAKA_BOOK_ID = 50 
# kuki-ს წიგნები ჯგუფური ყიდვისთვის სატესტოდ (1984, ჰარი პოტერი - აქტიურები)
KUKI_BOOK_IDS = [55, 57]

# Fixtures ავტორიზაციისთვის
@pytest.fixture(scope="module")
def string_token():
    res = client.post("/auth/login", json=USERS["string"])
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def kuki_token():
    res = client.post("/auth/login", json=USERS["kuki"])
    return res.json()["access_token"]

@pytest.fixture(scope="module")
def maka_token():
    res = client.post("/auth/login", json=USERS["maka"])
    return res.json()["access_token"]

# ბაზის გასუფთავება (ტესტების შემდეგ)
def reset_book_state(book_ids: list):
    """აბრუნებს წიგნებს active სტატუსზე და შლის მოთხოვნებს/კალათას"""
    for b_id in book_ids:
        supabase.table("books").update({"status": "active"}).eq("id", b_id).execute()
        supabase.table("book_requests").delete().eq("book_id", b_id).execute()
        supabase.table("cart").delete().eq("book_id", b_id).execute()
        supabase.table("email_queue").delete().eq("book_id", b_id).execute()

# ==========================================
#                 ტესტები
# ==========================================

def test_add_to_cart_and_get(string_token):
    headers = {"Authorization": f"Bearer {string_token}"}
    
    try:
        # 1. დავამატოთ მაკას წიგნი string-ის კალათაში
        add_res = client.post("/cart/add", json={"book_id": MAKA_BOOK_ID}, headers=headers)
        assert add_res.status_code == 200
        assert "წარმატებით დაემატა" in add_res.json()["message"]
        
        # 2. შევამოწმოთ კალათის შიგთავსი
        get_res = client.get("/cart", headers=headers)
        assert get_res.status_code == 200
        cart_items = get_res.json().get("cart", [])
        
        # ვამოწმებთ, რომ დამატებული წიგნი კალათაშია და აქტიურია
        book_in_cart = next((item for item in cart_items if item["book_id"] == MAKA_BOOK_ID), None)
        assert book_in_cart is not None
        assert book_in_cart["status"] == "active"
        assert book_in_cart["can_purchase"] is True
        
    finally:
        # გავასუფთაოთ კალათა
        supabase.table("cart").delete().eq("book_id", MAKA_BOOK_ID).execute()


def test_single_buy_and_queue_system(string_token, kuki_token):
    string_headers = {"Authorization": f"Bearer {string_token}"}
    kuki_headers = {"Authorization": f"Bearer {kuki_token}"}
    
    try:
        print(f"\nDEBUG: Book ID {MAKA_BOOK_ID} current status:")
        status_check = client.get(f"/books/{MAKA_BOOK_ID}")
        print(status_check.json())

        # 1. პირველი მყიდველი (string) ყიდულობს წიგნს
        buy_res = client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=string_headers)
        assert buy_res.status_code == 200
        email_worker()

        buy_data = buy_res.json()
        assert buy_data["queue_status"] == "active_timer"
        assert "expires_at" in buy_data
        
        # ვამოწმებთ, რომ წიგნი pending გახდა
        book_check = client.get(f"/books/{MAKA_BOOK_ID}")
        assert book_check.json()["status"] == "pending"
        
        # 2. მეორე მყიდველი (kuki) ცდილობს იმავე წიგნის ყიდვას
        queue_res = client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=kuki_headers)
        assert queue_res.status_code == 200
        
        queue_data = queue_res.json()
        assert queue_data["queue_status"] == "waiting"
        assert "რიგში" in queue_data["message"]
        
        # 3. პირველი მყიდველი ცდილობს მეორედ ყიდვას (უნდა დაიბლოკოს)
        spam_res = client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=string_headers)
        assert spam_res.status_code == 400
        assert "უკვე გაგზავნილი გაქვთ" in spam_res.json()["detail"]

    finally:
        reset_book_state([MAKA_BOOK_ID])


def test_bulk_buy_logic(string_token):
    headers = {"Authorization": f"Bearer {string_token}"}
    
    try:
        # 1. ჯგუფური ყიდვა kuki-ს წიგნებზე
        payload = {"book_ids": KUKI_BOOK_IDS}
        bulk_res = client.post("/cart/buy-bulk", json=payload, headers=headers)
        
        assert bulk_res.status_code == 200
        bulk_data = bulk_res.json()
        
        # ვამოწმებთ შედეგებს
        assert "results" in bulk_data
        assert len(bulk_data["results"]["active_timer_books"]) == 2
        assert KUKI_BOOK_IDS[0] in bulk_data["results"]["active_timer_books"]
        assert len(bulk_data["results"]["waiting_books"]) == 0
        assert len(bulk_data["results"]["unavailable_books"]) == 0
        
        # ვამოწმებთ, რომ ორივე წიგნი pending-ში გადავიდა
        for b_id in KUKI_BOOK_IDS:
            check = client.get(f"/books/{b_id}")
            assert check.json()["status"] == "pending"

    finally:
        reset_book_state(KUKI_BOOK_IDS)


def test_buy_own_book_fails(kuki_token):
    headers = {"Authorization": f"Bearer {kuki_token}"}
    # kuki ცდილობს საკუთარი წიგნის ყიდვას
    own_book_id = KUKI_BOOK_IDS[0] 
    
    res = client.post(f"/cart/buy/{own_book_id}", headers=headers)
    assert res.status_code == 400
    assert "საკუთარი" in res.json()["detail"]

# ==========================================
#        REQUESTS & TIMER ლოგიკის ტესტები
# ==========================================

def test_timer_expiration_and_notification(string_token, maka_token):
    string_headers = {"Authorization": f"Bearer {string_token}"}
    maka_headers = {"Authorization": f"Bearer {maka_token}"}
    
    try:
        # 1. მყიდველი ყიდულობს წიგნს
        client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=string_headers)
        
        # 2. request_id-ს პოვნა ბაზიდან
        req = supabase.table("book_requests").select("id").eq("book_id", MAKA_BOOK_ID).single().execute()
        request_id = req.data["id"]
        
        # 3. მიმდინარე დროს ვუმატებთ 30 წუთს, რომ 15 წუთიანი ლიმიტი ასიანში გადაილახოს
        future_time = (datetime.now(timezone.utc) + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 4. ვორქერს გადავცემთ ამ დროს
        check_expired_timers(only_for_book_id=MAKA_BOOK_ID, simulate_now=future_time)

        # 5. ვამოწმებთ, რომ ვორქერმა ნამდვილად შეცვალა სტატუსი
        status_check = supabase.table("book_requests").select("status").eq("id", request_id).single().execute()
        assert status_check.data["status"] == "checking_payment"
        
        # 6. შევამოწმოთ, შეიქმნა თუ არა ნოთიფიკაცია
        notif_res = client.get("/requests/notifications", headers=maka_headers)
        assert notif_res.status_code == 200
        notifications = notif_res.json()["notifications"]
        
        assert len(notifications) > 0
        payment_check_notif = next((n for n in notifications if n["book_id"] == MAKA_BOOK_ID and n["type"] == "payment_check"), None)
        assert payment_check_notif is not None
        
        # 7. საბოლოო შემოწმება
        req_check = supabase.table("book_requests").select("status").eq("book_id", MAKA_BOOK_ID).execute()
        assert req_check.data[0]["status"] == "checking_payment"

    finally:
        reset_book_state([MAKA_BOOK_ID])
        supabase.table("notifications").delete().eq("book_id", MAKA_BOOK_ID).execute()


def test_seller_confirms_payment(string_token, maka_token):
    string_headers = {"Authorization": f"Bearer {string_token}"}
    maka_headers = {"Authorization": f"Bearer {maka_token}"}
    
    try:
        # 1. string ყიდულობს, maka-ს წიგნს
        client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=string_headers)
        
        # 2. request_id-ს პოვნა
        req = supabase.table("book_requests").select("id").eq("book_id", MAKA_BOOK_ID).single().execute()
        request_id = req.data["id"]
        
        # 3. მიმდინარე დროს ვუმატებთ 30 წუთს, რომ 15 წუთიანი ლიმიტი ასიანში გადაილახოს
        future_time = (datetime.now(timezone.utc) + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 4. ვორქერს გადავცემთ ამ დროს
        check_expired_timers(only_for_book_id=MAKA_BOOK_ID, simulate_now=future_time)

        # 5. ვამოწმებთ, რომ რიგი გადავიდა payment_check რეჟიმში
        status_check = supabase.table("book_requests").select("status").eq("id", request_id).single().execute()
        assert status_check.data["status"] == "checking_payment" 

        # 6. გამყიდველი (maka) ადასტურებს ფულის მიღებას
        confirm_res = client.post(f"/requests/{request_id}/confirm", headers=maka_headers)
        assert confirm_res.status_code == 200
        assert "გაყიდვა დადასტურებულია" in confirm_res.json()["message"]
        
        # 7. ვამოწმებთ შედეგებს
        book_check = client.get(f"/books/{MAKA_BOOK_ID}")
        assert book_check.json()["status"] == "sold"
        
        req_final = supabase.table("book_requests").select("status").eq("id", request_id).execute()
        assert req_final.data[0]["status"] == "completed"

    finally:
        reset_book_state([MAKA_BOOK_ID])
        supabase.table("notifications").delete().eq("book_id", MAKA_BOOK_ID).execute()


def test_seller_rejects_and_queue_moves(string_token, kuki_token, maka_token):
    string_headers = {"Authorization": f"Bearer {string_token}"}
    kuki_headers = {"Authorization": f"Bearer {kuki_token}"}
    maka_headers = {"Authorization": f"Bearer {maka_token}"}
    
    try:
        # 1. პირველი მყიდველი და მეორე მყიდველი დგებიან რიგში
        client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=string_headers)
        client.post(f"/cart/buy/{MAKA_BOOK_ID}", headers=kuki_headers)
        
        # 2. ვიპოვოთ პირველი (აქტიური) მოთხოვნის ID
        req = supabase.table("book_requests").select("id").eq("book_id", MAKA_BOOK_ID).eq("status", "active_timer").single().execute()
        request_id = req.data["id"]
        
        # 3. მიმდინარე დროს ვუმატებთ 30 წუთს, რომ 15 წუთიანი ლიმიტი ასიანში გადაილახოს
        future_time = (datetime.now(timezone.utc) + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 4. ვორქერს გადავცემთ ამ დროს
        check_expired_timers(only_for_book_id=MAKA_BOOK_ID, simulate_now=future_time)

        # შემოწმება
        status_check = supabase.table("book_requests").select("status").eq("id", request_id).single().execute()
        assert status_check.data["status"] == "checking_payment"
        
        # 4. გამყიდველი უარყოფს (reject)
        reject_res = client.post(f"/requests/{request_id}/reject", headers=maka_headers)
        assert reject_res.status_code == 200
        
        # 5. ვამოწმებთ, რომ რიგი გადავიდა kuki-ზე
        final_reqs = supabase.table("book_requests").select("id, status").eq("book_id", MAKA_BOOK_ID).order("id").execute()
        
        assert final_reqs.data[0]["status"] == "rejected"      # პირველი გაუქმდა
        assert final_reqs.data[1]["status"] == "active_timer"  # მეორეს დრო დაეწყო

    finally:
        reset_book_state([MAKA_BOOK_ID])
        supabase.table("notifications").delete().eq("book_id", MAKA_BOOK_ID).execute()