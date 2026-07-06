from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from database import supabase
from routers.auth import get_current_user
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import BackgroundTasks
from services.email_service import send_purchase_instructions

router = APIRouter(
    prefix="/cart",
    tags=["Shopping Cart"]
)

# --- PYDANTIC მოდელები ---
class CartItemAdd(BaseModel):
    book_id: int

class BulkBuyRequest(BaseModel):
    book_ids: List[int]

# --- ენდპოინტები ---

# 1. კალათის შიგთავსის წამოღება (GET /cart)
@router.get("")
def get_cart(current_user=Depends(get_current_user)):
    # ვიღებთ კალათის აითემებს
    cart_items = supabase.table("cart").select("*, books(*)").eq("user_id", current_user["id"]).execute()
    
    processed_cart = []
    for item in cart_items.data:
        book = item["books"]
        
        # თუ წიგნი საერთოდ აღარ არსებობს ბაზაში, წავშალოთ კალათიდან
        if not book:
            supabase.table("cart").delete().eq("id", item["id"]).execute()
            continue
            
        # ლოგიკა სტატუსების მიხედვით
        book_status = book.get("status") # active, pending, sold, seller_deleted
        
        display_item = {
            "book_id": book["id"],
            "title": book["title"],
            "price": book["price"],
            "status": book_status,
            "can_purchase": book_status == "active",
            "message": None
        }
        
        if book_status == "seller_deleted":
            display_item["message"] = "გამყიდველი აღარ არის"
        elif book_status == "sold":
            display_item["message"] = "წიგნი უკვე გაყიდულია"
        elif book_status == "pending":
            display_item["message"] = "წიგნი რეზერვირებულია"
            
        processed_cart.append(display_item)
        
    return {"cart": processed_cart}

# 2. კალათაში წიგნის დამატება (POST /cart/add)
@router.post("/add")
def add_to_cart(payload: CartItemAdd, current_user=Depends(get_current_user)):  # <--- შეცვლილია აქ
    user_id = current_user["id"]
    book_id = payload.book_id  # <--- ამოვიღოთ იდენტიფიკატორი პეილოუდიდან
    
    # 1. შემოწმება: ხომ არ არსებობს უკვე ეს წიგნი ამ იუზერის კალათაში?
    existing = supabase.table("cart").select("*").eq("user_id", user_id).eq("book_id", book_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="ეს წიგნი უკვე დამატებულია კალათაში")
        
    # 2. შემოწმება: საკუთარ წიგნს ხომ არ ამატებს?
    book = supabase.table("books").select("seller_id").eq("id", book_id).single().execute()
    if book.data and book.data["seller_id"] == user_id:
        raise HTTPException(status_code=400, detail="საკუთარი წიგნის კალათაში დამატება არ შეგიძლიათ")
        
    # 3. დამატება
    supabase.table("cart").insert({"user_id": user_id, "book_id": book_id}).execute()
    return {"status": "success", "message": "წიგნი წარმატებით დაემატა კალათაში"}

# 3. კალათიდან წიგნის ამოშლა (DELETE /cart/remove/{id})
@router.delete("/remove/{cart_item_id}")
def remove_from_cart(cart_item_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    try:
        # უსაფრთხოების შემოწმება: ეკუთვნის თუ არა ეს კალათის აითემი ამ იუზერს
        item_check = supabase.table("cart").select("user_id").eq("id", cart_item_id).execute()
        
        if not item_check.data:
            raise HTTPException(status_code=404, detail="ჩანაწერი კალათაში ვერ მოიძებნა.")
            
        if item_check.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამ ჩანაწერის წაშლის უფლება.")
            
        # წაშლა
        supabase.table("cart").delete().eq("id", cart_item_id).execute()
        
        return {"status": "success", "message": "წიგნი ამოიშალა კალათიდან."}
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/buy/{book_id}")
def buy_book(
    book_id: int, 
    background_tasks: BackgroundTasks, 
    current_user=Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # 1. ვიღებთ წიგნს ბაზიდან
    book_res = supabase.table("books").select("*").eq("id", book_id).execute()
    
    if not book_res.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
        
    book = book_res.data[0]
    
    # 2. შემოწმება: საკუთარი წიგნის ყიდვას ხომ არ ცდილობს?
    if book["seller_id"] == user_id:
         raise HTTPException(status_code=400, detail="საკუთარი წიგნის ყიდვა შეუძლებელია.")

    # 3. შემოწმება: წიგნი უკვე გაყიდული ან წაშლილი ხომ არ არის?
    if book["status"] in ["sold", "seller_deleted"]:
        raise HTTPException(
            status_code=400, 
            detail="სამწუხაროდ, წიგნი აღარ არის ხელმისაწვდომი."
        )
        
    # 4. შემოწმება: ეს მყიდველი უკვე ხომ არ არის რიგში? (რათა ორჯერ არ დააჭიროს)
    existing_req = supabase.table("book_requests").select("*").eq("book_id", book_id).eq("buyer_id", user_id).execute()
    if existing_req.data:
        raise HTTPException(status_code=400, detail="თქვენ უკვე გაგზავნილი გაქვთ ყიდვის მოთხოვნა ამ წიგნზე.")

    # 5. ვამოწმებთ, არის თუ არა უკვე ვინმე აქტიურ ტაიმერზე (active_timer)
    active_req = supabase.table("book_requests").select("*").eq("book_id", book_id).eq("status", "active_timer").execute()
    
    # სცენარი A: არავინაა რიგში და წიგნი აქტიურია (პირველი მყიდველი)
    if not active_req.data and book["status"] == "active":
        # ვითვლით ახლანდელ დროს + 15 წუთი (UTC ფორმატში)
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        
        # ვამატებთ ჩანაწერს book_requests ცხრილში (პირველი მყიდველი)
        supabase.table("book_requests").insert({
            "book_id": book_id,
            "buyer_id": user_id,
            "seller_id": book["seller_id"],
            "status": "active_timer",
            "expires_at": expires_at
        }).execute()
        
        # წიგნის სტატუსს ვცვლით pending-ზე
        supabase.table("books").update({"status": "pending"}).eq("id", book_id).execute()
        
        # 1. ვიღებთ გამყიდველის ინფორმაციას
        seller_res = supabase.table("users").select("username, email, phone_numbers, bank_accounts, location").eq("id", book["seller_id"]).execute()
        seller_info = seller_res.data[0]
        
        # 2. ვაფორმირებთ წიგნის მონაცემებს
        books_data = [{"title": book["title"], "price": book["price"], "link": f"https://yourdomain.com/book/{book_id}"}]
        
        # 3. ფონურად ვაგზავნით მეილს მყიდველთან
        background_tasks.add_task(
            send_purchase_instructions,
            buyer_email=current_user["email"],
            seller_name=seller_info.get("username", "გამყიდველი"),
            seller_email=seller_info.get("email"),
            seller_phones=seller_info.get("phone_numbers", []),
            seller_accounts=seller_info.get("bank_accounts", []),
            books_data=books_data,
            total_price=book["price"],
            location=seller_info.get("location", "შეთანხმებით")
        )
        
        return {
            "status": "success", 
            "message": "თქვენი დრო დაიწყო! მეილზე გამოგზავნილია რეკვიზიტები. გთხოვთ, 15 წუთის განმავლობაში გადარიცხოთ თანხა.",
            "queue_status": "active_timer",
            "expires_at": expires_at
        }
        
    # სცენარი B: წიგნი pending-შია, ვიღაცას უკვე ჩართული აქვს 15 წუთი (შემდგომი მყიდველები)
    else:
        # ვამატებთ მომხმარებელს waiting რიგში
        supabase.table("book_requests").insert({
            "book_id": book_id,
            "buyer_id": user_id,
            "seller_id": book["seller_id"],
            "status": "waiting"
        }).execute()
        
        return {
            "status": "success", 
            "message": "თქვენ ჩადექით რიგში. თუ წინა მყიდველი არ გადარიცხავს თანხას, რიგი გადმოვა თქვენზე და შეგატყობინებთ მეილით.",
            "queue_status": "waiting"
        }

@router.post("/buy-bulk")
def buy_books_bulk(
    payload: BulkBuyRequest, 
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)):
    
    user_id = current_user["id"]
    book_ids = payload.book_ids
    
    if not book_ids:
        raise HTTPException(status_code=400, detail="გთხოვთ, აირჩიოთ მინიმუმ ერთი წიგნი.")

    # 1. წამოვიღოთ ეს წიგნები ბაზიდან
    books_res = supabase.table("books").select("*").in_("id", book_ids).execute()
    books = books_res.data
    
    if not books:
        raise HTTPException(status_code=404, detail="არჩეული წიგნები ვერ მოიძებნა.")

    # 2. შემოწმება: ყველა არჩეული წიგნი ნამდვილად ეკუთვნის თუ არა ერთ გამყიდველს?
    seller_ids = set(b["seller_id"] for b in books)
    if len(seller_ids) > 1:
        raise HTTPException(
            status_code=400, 
            detail="ერთდროულად მხოლოდ ერთი გამყიდველის წიგნების ყიდვაა შესაძლებელი."
        )
        
    seller_id = seller_ids.pop()

    # 3. შემოწმება: საკუთარ წიგნებს ხომ არ ყიდულობს?
    if seller_id == user_id:
        raise HTTPException(status_code=400, detail="საკუთარი წიგნების ყიდვა შეუძლებელია.")

    # აქ შევინახავთ სტატუსებს, რომ ბოლოს შევაჯამოთ
    active_purchases = []
    waiting_purchases = []
    unavailable_books = []

    # ტაიმერის გამოთვლა (15 წუთი)
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(minutes=15)).isoformat()

    # 4. ვამუშავებთ თითოეულ წიგნს ინდივიდუალურად (Loop)
    for book in books:
        b_id = book["id"]
        
        # თუ წიგნი უკვე გაიყიდა ან წაიშალა, ვაგდებთ მიუწვდომლებში
        if book["status"] in ["sold", "seller_deleted"]:
            unavailable_books.append(b_id)
            continue

        # ვამოწმებთ, ეს იუზერი უკვე ხომ არ დგას ამ წიგნის რიგში
        existing_req = supabase.table("book_requests").select("id").eq("book_id", b_id).eq("buyer_id", user_id).execute()
        if existing_req.data:
            continue  # უკვე გაგზავნილი აქვს მოთხოვნა ამ წიგნზე და ვაიგნორებთ

        # ვამოწმებთ, ვინმეს უკვე ხომ არ აქვს დაწყებული 15-წუთიანი ტაიმერი ამ წიგნზე
        active_req = supabase.table("book_requests").select("id").eq("book_id", b_id).eq("status", "active_timer").execute()

        # სცენარი A: არავინაა რიგში და წიგნი ხელმისაწვდომია
        if not active_req.data and book["status"] == "active":
            # 1. ემატება მოთხოვნებში (ტაიმერით)
            supabase.table("book_requests").insert({
                "book_id": b_id,
                "buyer_id": user_id,
                "seller_id": seller_id,
                "status": "active_timer",
                "expires_at": expires_at
            }).execute()
            
            # 2. წიგნის სტატუსი ხდება pending
            supabase.table("books").update({"status": "pending"}).eq("id", b_id).execute()
            
            active_purchases.append(book)
            
        # სცენარი B: სხვა ვიღაცას უკვე დაწყებული აქვს ტაიმერი (წიგნი pending-შია)
        else:
            # ეს მყიდველი უბრალოდ დგება რიგში
            supabase.table("book_requests").insert({
                "book_id": b_id,
                "buyer_id": user_id,
                "seller_id": seller_id,
                "status": "waiting"
            }).execute()
            
            waiting_purchases.append(book)

    # 5. მეილის გაგზავნის ლოგიკა
    if active_purchases:
        # 1. ვიღებთ გამყიდველის სრულ ინფორმაციას ბაზიდან
        seller_res = supabase.table("users").select("username, email, phone_numbers, bank_accounts, location").eq("id", seller_id).execute()
        seller_info = seller_res.data[0]
        
        # 2. ვამზადებთ წიგნების სიას და ჯამურ ფასს
        books_data = [{"title": b["title"], "price": b["price"], "link": f"https://yourdomain.com/book/{b['id']}"} for b in active_purchases]
        total_price = sum(b["price"] for b in active_purchases)
        
        # 3. ვაგზავნით მეილს ფონურ რეჟიმში (მომხმარებელი არ ელოდება მეილის გაგზავნას)
        background_tasks.add_task(
            send_purchase_instructions,
            buyer_email=current_user["email"],
            seller_name=seller_info.get("username", "გამყიდველი"),
            seller_email=seller_info.get("email"),
            seller_phones=seller_info.get("phone_numbers", []),
            seller_accounts=seller_info.get("bank_accounts", []),
            books_data=books_data,
            total_price=total_price,
            location=seller_info.get("location", "შეთანხმებით")
        )

    return {
        "status": "success",
        "message": "ჯგუფური მოთხოვნა დამუშავებულია.",
        "results": {
            "active_timer_books": [b["id"] for b in active_purchases],  # რაზეც დრო დაეწყო
            "waiting_books": [b["id"] for b in waiting_purchases],      # რაზეც რიგში ჩადგა
            "unavailable_books": unavailable_books                      # რაც უკვე გაყიდული დახვდა
        }
    }
