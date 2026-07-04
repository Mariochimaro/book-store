from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from database import supabase
from routers.auth import get_current_user

router = APIRouter(
    prefix="/cart",
    tags=["Shopping Cart"]
)

# --- PYDANTIC მოდელები ---
class CartItemAdd(BaseModel):
    book_id: int

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
def buy_book(book_id: int, current_user=Depends(get_current_user)):
    # 1. ვიღებთ წიგნს ბაზიდან
    book_res = supabase.table("books").select("*").eq("id", book_id).single().execute()
    book = book_res.data
    
    if not book:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")

    # 2. აქ არის შენი დამცავი ბარიერი (Backend validation)
    # ეს ამოწმებს, წიგნი გაყიდულია, წაშლილია თუ სხვის მიერ პენდინგშია
    if book["status"] != "active":
        raise HTTPException(
            status_code=400, 
            detail=f"სამწუხაროდ, ეს წიგნი ამჟამად მიუწვდომელია (სტატუსი: {book['status']})"
        )
    
    # 3. თუ აქამდე მოვიდა, ე.ი. წიგნი აქტიურია და ვუშვებთ ყიდვის პროცესს
    # აქ უკვე შეგიძლია სტატუსი გადაუყვანო "pending"-ზე
    supabase.table("books").update({"status": "pending"}).eq("id", book_id).execute()
    
    return {"status": "success", "message": "ყიდვის მოთხოვნა გაგზავნილია!"}