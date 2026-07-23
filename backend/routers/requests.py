from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from database import supabase
from routers.auth import get_current_user
from services.emails.email_service import send_purchase_success, send_purchase_failed, send_purchase_instructions, send_purchase_success_bulk, send_purchase_failed_bulk
from datetime import datetime, timedelta, timezone

router = APIRouter(
    prefix="/requests",
    tags=["Requests & Notifications"]
)


# 1. მომხმარებლის შეტყობინებების (Notifications) წამოღება
@router.get("/notifications")
def get_notifications(current_user=Depends(get_current_user)):
    user_id = current_user["id"]

    res = supabase.table("notifications").select(
        """
        *,
        books(title, photos_urls, price),
        book_requests(
            id, buyer_id, seller_id, status, expires_at,
            buyer:users!book_requests_buyer_id_fkey(username, email),
            seller:users!book_requests_seller_id_fkey(username, email)
        )
        """
    ).eq("user_id", user_id).order("created_at", desc=True).execute()

    # Flatten the joins into the fields the frontend actually needs:
    # request_id (for confirm/reject), counterpart_name/email (for the
    # "contact" button), and price (for the amount line).
    shaped = []
    for n in res.data:
        req = n.get("book_requests")
        counterpart = None
        if req:
            counterpart = req["seller"] if req["buyer_id"] == user_id else req["buyer"]

        shaped.append({
            **{k: v for k, v in n.items() if k != "book_requests"},
            "request_id": req["id"] if req else n.get("request_id"),
            "price": n["books"]["price"] if n.get("books") else None,
            "counterpart_name": counterpart["username"] if counterpart else None,
            "counterpart_email": counterpart["email"] if counterpart else None,
        })

    return {"notifications": shaped}


# 2. გამყიდველი ადასტურებს, რომ თანხა მოვიდა (Confirm)
@router.post("/{request_id}/confirm")
def confirm_payment(request_id: int, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    seller_id = current_user["id"]

    req_res = supabase.table("book_requests").select("*, books(*), users!book_requests_buyer_id_fkey(email)").eq("id", request_id).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="მოთხოვნა ვერ მოიძებნა.")

    request_data = req_res.data[0]

    if request_data["seller_id"] != seller_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამის უფლება.")

    book_id = request_data["book_id"]
    buyer_id = request_data["buyer_id"]
    buyer_email = request_data["users"]["email"]
    book_title = request_data["books"]["title"]

    supabase.table("books").update({"status": "sold", "sold_at": datetime.now(timezone.utc).isoformat()}).eq("id", book_id).execute()
    supabase.table("book_requests").update({"status": "completed"}).eq("id", request_id).execute()
    supabase.table("notifications").delete().eq("user_id", seller_id).eq("book_id", book_id).eq("type", "payment_check").execute()

    supabase.table("notifications").insert({
        "user_id": buyer_id,
        "book_id": book_id,
        "request_id": request_id,
        "message": f"თქვენ წარმატებით იყიდეთ წიგნი '{book_title}'!",
        "type": "purchase_success"
    }).execute()

    seller_info = current_user
    background_tasks.add_task(
        send_purchase_success,
        buyer_email=buyer_email,
        book_title=book_title,
        seller_name=seller_info.get("username", "გამყიდველი"),
        seller_email=seller_info.get("email"),
        seller_phones=seller_info.get("phone_numbers", [])
    )

    supabase.table("book_requests").update({"status": "cancelled"}).eq("book_id", book_id).eq("status", "waiting").execute()

    return {"status": "success", "message": "გაყიდვა დადასტურებულია!"}


# 3. გამყიდველი უარყოფს, რომ თანხა მოვიდა (Reject)
@router.post("/{request_id}/reject")
def reject_payment(request_id: int, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    seller_id = current_user["id"]

    req_res = supabase.table("book_requests").select("*, books(title, price), users!book_requests_buyer_id_fkey(email)").eq("id", request_id).execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="მოთხოვნა ვერ მოიძებნა.")

    request_data = req_res.data[0]

    if request_data["seller_id"] != seller_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამის უფლება.")

    book_id = request_data["book_id"]
    buyer_id = request_data["buyer_id"]
    buyer_email = request_data["users"]["email"]
    book_title = request_data["books"]["title"]

    supabase.table("book_requests").update({"status": "rejected"}).eq("id", request_id).execute()
    supabase.table("notifications").delete().eq("user_id", seller_id).eq("book_id", book_id).eq("type", "payment_check").execute()

    supabase.table("notifications").insert({
        "user_id": buyer_id,
        "book_id": book_id,
        "request_id": request_id,
        "message": f"თქვენ ვერ მოახერხეთ წიგნის '{book_title}' ყიდვა.",
        "type": "purchase_failed"
    }).execute()

    background_tasks.add_task(
        send_purchase_failed,
        buyer_email=buyer_email,
        book_title=book_title,
        book_id=book_id,
        seller_email=current_user.get("email"),
        seller_phones=current_user.get("phone_numbers", [])
    )

    waiting_req = supabase.table("book_requests").select("*").eq("book_id", book_id).eq("status", "waiting").order("id").limit(1).execute()

    if waiting_req.data:
        next_req = waiting_req.data[0]
        next_req_id = next_req["id"]
        next_buyer_id = next_req["buyer_id"]

        new_expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

        supabase.table("book_requests").update({
            "status": "active_timer",
            "expires_at": new_expires_at,
            "notified_at": None
        }).eq("id", next_req_id).execute()

        next_buyer_res = supabase.table("users").select("email").eq("id", next_buyer_id).single().execute()

        if next_buyer_res.data:
            next_buyer_email = next_buyer_res.data["email"]
            book_price = request_data["books"]["price"]

            books_data = [{"title": book_title, "price": book_price, "link": f"https://yourdomain.com/book/{book_id}"}]

            background_tasks.add_task(
                send_purchase_instructions,
                buyer_email=next_buyer_email,
                seller_name=current_user.get("username", "გამყიდველი"),
                seller_email=current_user.get("email"),
                seller_phones=current_user.get("phone_numbers", []),
                seller_accounts=current_user.get("bank_accounts", []),
                books_data=books_data,
                total_price=book_price,
                location=current_user.get("location", "შეთანხმებით")
            )
    else:
        supabase.table("books").update({"status": "active"}).eq("id", book_id).execute()

    return {"status": "success", "message": "მოთხოვნა გაუქმებულია. რიგი გადავიდა შემდეგ მსურველზე."}

@router.post("/group/{group_id}/confirm")
def confirm_group_payment(group_id: int, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    seller_id = current_user["id"]

    reqs_res = supabase.table("book_requests").select(
        "*, books(*), users!book_requests_buyer_id_fkey(email)"
    ).eq("group_id", group_id).eq("status", "checking_payment").execute()

    if not reqs_res.data:
        raise HTTPException(status_code=404, detail="აქტიური ჯგუფური მოთხოვნა ვერ მოიძებნა.")

    requests_data = reqs_res.data

    if any(r["seller_id"] != seller_id for r in requests_data):
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამის უფლება.")

    buyer_id = requests_data[0]["buyer_id"]
    buyer_email = requests_data[0]["users"]["email"]
    book_ids = [r["book_id"] for r in requests_data]
    request_ids = [r["id"] for r in requests_data]
    books_data = [{"title": r["books"]["title"], "price": r["books"]["price"]} for r in requests_data]
    total_price = sum(float(b["price"]) for b in books_data)

    supabase.table("books").update({"status": "sold", "sold_at": datetime.now(timezone.utc).isoformat()}).in_("id", book_ids).execute()
    supabase.table("book_requests").update({"status": "completed"}).in_("id", request_ids).execute()
    supabase.table("notifications").delete().eq("group_id", group_id).eq("type", "payment_check").execute()

    titles_summary = ", ".join(b["title"] for b in books_data)
    supabase.table("notifications").insert({
        "user_id": buyer_id,
        "book_id": book_ids[0],
        "group_id": group_id,
        "message": f"თქვენ წარმატებით იყიდეთ {len(books_data)} წიგნი: {titles_summary}!",
        "type": "purchase_success"
    }).execute()

    background_tasks.add_task(
        send_purchase_success_bulk,
        buyer_email=buyer_email,
        books_data=books_data,
        total_price=total_price,
        seller_name=current_user.get("username", "გამყიდველი"),
        seller_email=current_user.get("email"),
        seller_phones=current_user.get("phone_numbers", []),
    )

    for b_id in book_ids:
        supabase.table("book_requests").update({"status": "cancelled"}).eq("book_id", b_id).eq("status", "waiting").execute()

    return {"status": "success", "message": f"{len(books_data)} წიგნის გაყიდვა დადასტურებულია!"}


@router.post("/group/{group_id}/reject")
def reject_group_payment(group_id: int, background_tasks: BackgroundTasks, current_user=Depends(get_current_user)):
    seller_id = current_user["id"]

    reqs_res = supabase.table("book_requests").select(
        "*, books(title, price), users!book_requests_buyer_id_fkey(email)"
    ).eq("group_id", group_id).eq("status", "checking_payment").execute()

    if not reqs_res.data:
        raise HTTPException(status_code=404, detail="აქტიური ჯგუფური მოთხოვნა ვერ მოიძებნა.")

    requests_data = reqs_res.data

    if any(r["seller_id"] != seller_id for r in requests_data):
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამის უფლება.")

    buyer_id = requests_data[0]["buyer_id"]
    buyer_email = requests_data[0]["users"]["email"]
    request_ids = [r["id"] for r in requests_data]
    books_data = [{"title": r["books"]["title"], "link": f"https://yourdomain.com/book/{r['book_id']}"} for r in requests_data]

    supabase.table("book_requests").update({"status": "rejected"}).in_("id", request_ids).execute()
    supabase.table("notifications").delete().eq("group_id", group_id).eq("type", "payment_check").execute()

    titles_summary = ", ".join(b["title"] for b in books_data)
    supabase.table("notifications").insert({
        "user_id": buyer_id,
        "book_id": requests_data[0]["book_id"],
        "group_id": group_id,
        "message": f"თქვენ ვერ მოახერხეთ {len(books_data)} წიგნის ყიდვა: {titles_summary}.",
        "type": "purchase_failed"
    }).execute()

    background_tasks.add_task(
        send_purchase_failed_bulk,
        buyer_email=buyer_email,
        books_data=books_data,
        seller_email=current_user.get("email"),
        seller_phones=current_user.get("phone_numbers", []),
    )

    # თითოეულ წიგნს თავისი დამოუკიდებელი რიგი აქვს — ცალ-ცალკე ვამოწმებთ, ვინ არის შემდეგი
    for r in requests_data:
        book_id = r["book_id"]
        book_title = r["books"]["title"]
        book_price = r["books"]["price"]

        waiting_req = supabase.table("book_requests").select("*").eq("book_id", book_id).eq("status", "waiting").order("id").limit(1).execute()

        if waiting_req.data:
            next_req = waiting_req.data[0]
            new_expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()

            supabase.table("book_requests").update({
                "status": "active_timer",
                "expires_at": new_expires_at,
            }).eq("id", next_req["id"]).execute()

            next_buyer_res = supabase.table("users").select("email").eq("id", next_req["buyer_id"]).single().execute()

            if next_buyer_res.data:
                background_tasks.add_task(
                    send_purchase_instructions,
                    buyer_email=next_buyer_res.data["email"],
                    seller_name=current_user.get("username", "გამყიდველი"),
                    seller_email=current_user.get("email"),
                    seller_phones=current_user.get("phone_numbers", []),
                    seller_accounts=current_user.get("bank_accounts", []),
                    books_data=[{"title": book_title, "price": book_price, "link": f"https://yourdomain.com/book/{book_id}"}],
                    total_price=book_price,
                    location=current_user.get("location", "შეთანხმებით")
                )
        else:
            supabase.table("books").update({"status": "active"}).eq("id", book_id).execute()

    return {"status": "success", "message": "ჯგუფური მოთხოვნა გაუქმებულია. შესაბამისი რიგები განახლდა."}

@router.get("/notifications")
def get_notifications(current_user=Depends(get_current_user)):
    user_id = current_user["id"]

    res = supabase.table("notifications").select(
        """
        *,
        books(title, photos_urls, price),
        book_requests(
            id, buyer_id, seller_id, status, expires_at, group_id,
            buyer:users!book_requests_buyer_id_fkey(username, email),
            seller:users!book_requests_seller_id_fkey(username, email)
        )
        """
    ).eq("user_id", user_id).order("created_at", desc=True).execute()

    group_ids = {n["group_id"] for n in res.data if n.get("group_id")}
    group_books_map = {}
    if group_ids:
        group_reqs = supabase.table("book_requests").select(
            "group_id, book_id, status, books(title, price)"
        ).in_("group_id", list(group_ids)).execute()
        for r in group_reqs.data:
            group_books_map.setdefault(r["group_id"], []).append({
                "book_id": r["book_id"],
                "title": r["books"]["title"] if r["books"] else None,
                "price": r["books"]["price"] if r["books"] else None,
                "status": r["status"],
            })

    status_filter_map = {
        "payment_check": "checking_payment",
        "purchase_success": "completed",
        "purchase_failed": "rejected",
    }

    shaped = []
    for n in res.data:
        req = n.get("book_requests")
        counterpart = None
        if req:
            counterpart = req["seller"] if req["buyer_id"] == user_id else req["buyer"]

        group_id = n.get("group_id")

        if group_id and group_id in group_books_map:
            all_books = group_books_map[group_id]
            target_status = status_filter_map.get(n.get("type"))
            relevant = [b for b in all_books if b["status"] == target_status] or all_books
            books_list = [{"book_id": b["book_id"], "title": b["title"], "price": b["price"]} for b in relevant]
            total_price = sum(float(b["price"]) for b in relevant if b["price"] is not None)
        else:
            books_list = [{
                "book_id": n.get("book_id"),
                "title": n["books"]["title"] if n.get("books") else None,
                "price": n["books"]["price"] if n.get("books") else None,
            }]
            total_price = n["books"]["price"] if n.get("books") else None

        shaped.append({
            **{k: v for k, v in n.items() if k != "book_requests"},
            "request_id": req["id"] if req else n.get("request_id"),
            "group_id": group_id,
            "books": books_list,
            "total_price": total_price,
            "counterpart_name": counterpart["username"] if counterpart else None,
            "counterpart_email": counterpart["email"] if counterpart else None,
        })

    return {"notifications": shaped}

@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, current_user = Depends(get_current_user)):
    try:
        supabase.table("notifications").delete().eq("id", notification_id).eq("user_id", current_user["id"]).execute()
        return {"status": "success", "message": "შეტყობინება წაიშალა"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))