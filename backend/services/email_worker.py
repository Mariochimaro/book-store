import time
import threading
from database import supabase
from services.email_service import send_purchase_instructions

def email_worker():
    print("Email Worker checking for pending emails...")
    try:
        # ვპოულობთ გაუგზავნელ მეილებს
        pending_emails = supabase.table("email_queue").select("*").eq("processed", False).execute()
        
        for item in pending_emails.data:
            buyer_id = item["buyer_id"]
            book_id = item["book_id"]
            
            buyer = supabase.table("users").select("email").eq("id", buyer_id).single().execute()
            book = supabase.table("books").select("*, users!books_seller_id_fkey(*)").eq("id", book_id).single().execute()
            
            if buyer.data and book.data:
                # აქ გამოიძახება send_purchase_instructions
                # და თუ ENVIRONMENT=development-ია, კონსოლში დაიბეჭდება
                send_purchase_instructions(
                    buyer_email=buyer.data["email"],
                    seller_name=book.data["users"]["username"],
                    seller_email=book.data["users"]["email"],
                    seller_phones=book.data["users"].get("phone_numbers", []),
                    seller_accounts=book.data["users"].get("bank_accounts", []),
                    books_data=[{"title": book.data["title"], "price": book.data["price"], "link": "#"}],
                    total_price=book.data["price"],
                    location=buyer.data.get("location", "თბილისი")
                )
                
                supabase.table("email_queue").update({"processed": True}).eq("id", item["id"]).execute()
                print(f"Email processed for book {book_id}")

    except Exception as e:
        print(f"Error in email worker: {e}")
        
# ამ ფუნქციას გავუშვებთ ცალკე thread-ში
def start_email_worker():
    thread = threading.Thread(target=email_worker, daemon=True)
    thread.start()
