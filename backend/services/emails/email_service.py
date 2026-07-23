import resend
import os
from config import RESEND_API_KEY
import requests

resend.api_key = RESEND_API_KEY

# დამხმარე ფუნქცია Google Chat-ის ლინკისთვის
def get_contact_link(email: str) -> str:
    if email and email.strip().lower().endswith("@gmail.com"):
        return f"https://chat.google.com/dm/{email.strip()}"
    return f"mailto:{email}"

def _send_resend_email(params: dict):
    try:
        resp = requests.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            json=params,  # <-- json=, არა data= — უზრუნველყოფს სწორ utf-8 კოდირებას
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Failed to send email: {e}")
        return None

def send_purchase_instructions(
    buyer_email: str, 
    seller_name: str, 
    seller_email: str,
    seller_phones: list,
    seller_accounts: list,
    books_data: list, 
    total_price: float,
    location: str
):
    
    # 1. HTML შიგთავსი
    books_html = "<ul>"
    for book in books_data:
        books_html += f"<li><a href='{book.get('link', '#')}'>{book['title']}</a> - {book['price']} ₾</li>"
    books_html += "</ul>"

    accounts_html = "<ul>"
    for acc in seller_accounts:
        bank_name = acc.get("bank_name", "უცნობი ბანკი")
        account_number = acc.get("account_number", "ნომერი არ არის")
        
        accounts_html += f"<li><b>{bank_name}:</b> {account_number}</li>"
    accounts_html += "</ul>"
    
    # გამყიდველის კონტაქტები 
    phones_html = ", ".join(seller_phones) if seller_phones else "არ არის მითითებული"
  
    # Google Chat-ის ინტეგრაცია
    seller_contact_url = get_contact_link(seller_email)

    html_content = f"""
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2>ყიდვის მოთხოვნა წარმატებით გაიგზავნა!</h2>
        <p>თქვენ გააგზავნეთ მოთხოვნა შემდეგი წიგნების ყიდვაზე (გამყიდველი: <b>{seller_name}</b>):</p>
        {books_html}
        <p><b>ჯამური თანხა:</b> {total_price:.2f} ₾</p>
        <p><b>მიტანის/გადაცემის ლოკაცია:</b> {location}</p>
        <div style="background-color: #f9f9f9; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
            <h3>⚠️ დროის შეზღუდვა</h3>
            <p>საჭიროა გადარიცხოთ თანხა ქვემოთ მითითებულ ანგარიშებზე 15 წუთის განმავლობაში.</p>
        </div>
        <h3>რეკვიზიტები გადარიცხვისთვის:</h3>
        {accounts_html}

        <hr>
        <h3>გამყიდველთან საკონტაქტო ინფორმაცია:</h3>
        <p><b>კონტაქტი:</b> <a href="{seller_contact_url}">{seller_email}</a></p>
        <p><b>ნომერი:</b> {phones_html}</p>
    </div>
    """

    # 2. ვამოწმებთ დეველოპმენტს
    if os.getenv("ENVIRONMENT") == "development":
        print(f"\n{'='*20} FAKE EMAIL {'='*20}")
        print(f"TO: {buyer_email}")
        print(f"CONTENT: {html_content}")
        print(f"{'='*50}\n")
        return {"id": "fake_id"}

    # 3. რეალური გაგზავნა (აქამდე კოდი ტესტში აღარც მივა)
    params = {
        "from": "BookStore <onboarding@resend.dev>",
        "to": [buyer_email],
        "subject": "⚠️ დროული გადარიცხვის ინსტრუქცია - BookStore",
        "html": html_content
    }

    try:
        response = _send_resend_email(params)
        return response
    except Exception as e:
        print(f"Failed to send email: {e}")
        return None

def send_purchase_success(buyer_email: str, book_title: str, seller_name: str, seller_email: str, seller_phones: list):
    """ეგზავნება მყიდველს, როცა გამყიდველი დაადასტურებს თანხის მიღებას"""
    
    phones_html = ", ".join(seller_phones) if seller_phones else "არ არის მითითებული"

    # მყიდველს ვუგზავნით გამყიდველის საკონტაქტო ლინკს
    seller_contact_url = get_contact_link(seller_email)

    html_content = f"""
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4CAF50;">🎉 წიგნი წარმატებით იყიდეთ!</h2>
        <p>გამყიდველმა დაადასტურა თანხის მიღება წიგნზე: <b>{book_title}</b>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h4 style="margin-top: 0;">დაუკავშირდით გამყიდველს წიგნის გადასაცემად:</h4>
            <p><b>სახელი:</b> {seller_name}</p>
            <p><b>კონტაქტი:</b> <a href="{seller_contact_url}">{seller_email}</a></p>
            <p><b>ტელეფონი:</b> {phones_html}</p>
        </div>
        
        <p style="font-size: 0.9em; color: #666;">მადლობა, რომ სარგებლობთ BookStore-ით!</p>
    </div>
    """

    if os.getenv("ENVIRONMENT") == "development":
        print(f"\n{'='*20} FAKE EMAIL: SUCCESS PURCHASE {'='*20}")
        print(f"TO: {buyer_email}")
        print(f"CONTENT: {html_content}")
        print(f"{'='*60}\n")
        return {"id": "fake_success_id"}

    params = {
        "from": "BookStore <onboarding@resend.dev>",
        "to": [buyer_email],
        "subject": "🎉 წარმატებული ყიდვა! - BookStore",
        "html": html_content
    }

    try:
        return _send_resend_email(params)
    except Exception as e:
        print(f"Failed to send success email: {e}")
        return None


def send_purchase_failed(buyer_email: str, book_title: str, book_id: int, seller_email: str, seller_phones: list):
    """ეგზავნება მყიდველს, როცა დრო ამოიწურება ან გამყიდველი იტყვის, რომ თანხა არ მოსულა"""
    
    phones_html = ", ".join(seller_phones) if seller_phones else "არ არის მითითებული"
    book_link = f"https://yourdomain.com/book/{book_id}"

    # თუ შეცდომაა, მყიდველი მაინც გამყიდველს უნდა დაუკავშირდეს გასარკვევად
    seller_contact_url = get_contact_link(seller_email)

    html_content = f"""
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #f44336;">❌ მოთხოვნა გაუქმდა</h2>
        <p>სამწუხაროდ, თქვენი მოთხოვნა წიგნზე <b>{book_title}</b> გაუქმდა (დროის ამოწურვის ან გადაურიცხაობის გამო).</p>
        
        <p>თუ გსურთ ყიდვის თავიდან მოთხოვნა, გადადით ლინკზე: <a href="{book_link}">წიგნის გვერდი</a></p>
        
        <div style="background-color: #fff8f8; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d32f2f;">⚠️ შეცდომაა და თანხა უკვე გადარიცხეთ?</h4>
            <p>დაუყოვნებლივ დაუკავშირდით გამყიდველს სიტუაციის გასარკვევად:</p>
            <p><b>კონტაქტი:</b> <a href="{seller_contact_url}">{seller_email}</a></p>
            <p><b>ტელეფონი:</b> {phones_html}</p>
        </div>
    </div>
    """

    if os.getenv("ENVIRONMENT") == "development":
        print(f"\n{'='*20} FAKE EMAIL: PURCHASE FAILED {'='*20}")
        print(f"TO: {buyer_email}")
        print(f"CONTENT: {html_content}")
        print(f"{'='*60}\n")
        return {"id": "fake_failed_id"}

    params = {
        "from": "BookStore <onboarding@resend.dev>",
        "to": [buyer_email],
        "subject": "❌ ყიდვის მოთხოვნა გაუქმდა - BookStore",
        "html": html_content
    }

    try:
        return _send_resend_email(params)
    except Exception as e:
        print(f"Failed to send failed email: {e}")
        return None

def send_purchase_success_bulk(buyer_email, books_data, total_price, seller_name, seller_email, seller_phones):
    phones_html = ", ".join(seller_phones) if seller_phones else "არ არის მითითებული"
    seller_contact_url = get_contact_link(seller_email)

    books_html = "<ul>"
    for b in books_data:
        books_html += f"<li>{b['title']} - {b['price']} ₾</li>"
    books_html += "</ul>"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4CAF50;">🎉 წიგნები წარმატებით იყიდეთ!</h2>
        <p>გამყიდველმა დაადასტურა თანხის მიღება შემდეგ წიგნებზე:</p>
        {books_html}
        <p><b>ჯამური თანხა:</b> {total_price:.2f} ₾</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <h4 style="margin-top: 0;">დაუკავშირდით გამყიდველს წიგნების გადასაცემად:</h4>
            <p><b>სახელი:</b> {seller_name}</p>
            <p><b>კონტაქტი:</b> <a href="{seller_contact_url}">{seller_email}</a></p>
            <p><b>ტელეფონი:</b> {phones_html}</p>
        </div>

        <p style="font-size: 0.9em; color: #666;">მადლობა, რომ სარგებლობთ BookStore-ით!</p>
    </div>
    """

    if os.getenv("ENVIRONMENT") == "development":
        print(f"\n{'='*20} FAKE EMAIL: SUCCESS PURCHASE (BULK) {'='*20}")
        print(f"TO: {buyer_email}")
        print(f"CONTENT: {html_content}")
        print(f"{'='*60}\n")
        return {"id": "fake_success_bulk_id"}

    params = {
        "from": "BookStore <onboarding@resend.dev>",
        "to": [buyer_email],
        "subject": "🎉 წარმატებული ყიდვა! - BookStore",
        "html": html_content
    }
    try:
        return _send_resend_email(params)
    except Exception as e:
        print(f"Failed to send bulk success email: {e}")
        return None


def send_purchase_failed_bulk(buyer_email, books_data, seller_email, seller_phones):
    phones_html = ", ".join(seller_phones) if seller_phones else "არ არის მითითებული"
    seller_contact_url = get_contact_link(seller_email)

    books_html = "<ul>"
    for b in books_data:
        books_html += f"<li><a href='{b.get('link', '#')}'>{b['title']}</a></li>"
    books_html += "</ul>"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #f44336;">❌ მოთხოვნა გაუქმდა</h2>
        <p>სამწუხაროდ, თქვენი მოთხოვნა შემდეგ წიგნებზე გაუქმდა (დროის ამოწურვის ან გადაურიცხაობის გამო):</p>
        {books_html}

        <div style="background-color: #fff8f8; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d32f2f;">⚠️ შეცდომაა და თანხა უკვე გადარიცხეთ?</h4>
            <p>დაუყოვნებლივ დაუკავშირდით გამყიდველს სიტუაციის გასარკვევად:</p>
            <p><b>კონტაქტი:</b> <a href="{seller_contact_url}">{seller_email}</a></p>
            <p><b>ტელეფონი:</b> {phones_html}</p>
        </div>
    </div>
    """

    if os.getenv("ENVIRONMENT") == "development":
        print(f"\n{'='*20} FAKE EMAIL: PURCHASE FAILED (BULK) {'='*20}")
        print(f"TO: {buyer_email}")
        print(f"CONTENT: {html_content}")
        print(f"{'='*60}\n")
        return {"id": "fake_failed_bulk_id"}

    params = {
        "from": "BookStore <onboarding@resend.dev>",
        "to": [buyer_email],
        "subject": "❌ ყიდვის მოთხოვნა გაუქმდა - BookStore",
        "html": html_content
    }
    try:
        return _send_resend_email(params)
    except Exception as e:
        print(f"Failed to send bulk failed email: {e}")
        return None