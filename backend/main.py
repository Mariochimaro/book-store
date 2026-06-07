from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from utils import search_match

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

MOCK_BOOKS = [
    {
        "id": 1,
        "title": "ჰარი პოტერი",
        "genre": "Fantasy",
        "language": "Geo",
        "price": 15.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "new",
        "description": "ორიგინალი გამოცემა, იდეალურ მდგომარეობაში. მხოლოდ ერთხელაა წაკითხული.",
        "cover_url": "https://sulakauri.ge/uploads/2023/11/hari-poteri-da-philosophiuri-qva.webp",
        "status": "active"
    },
    {
        "id": 2,
        "title": "ბეჭდების მბრძანებელი",
        "genre": "Fantasy",
        "language": "Geo",
        "price": 25.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "good",
        "description": "მცირე ნაკაწრებით ყდაზე, მაგრამ შიგნიდან სუფთა ფურცლებით.",
        "cover_url": "https://www.lit.ge//shop/uploads/shop_product_image_176427.jpg",
        "status": "active"
    },
    {
        "id": 3,
        "title": "შერლოკ ჰოლმსი",
        "genre": "Detective",
        "language": "Geo",
        "price": 12.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "average",
        "description": "ძველი გამოცემა, ფურცლები ოდნავ გაყვითლებულია, რაც დამატებით ხიბლს აძლევს.",
        "cover_url": "https://sulakauri.ge/uploads/2023/11/sherlok-holmsis-thavgadasavali-dzveli.webp",
        "status": "active"
    },
    {
        "id": 4, 
        "title": "1984", 
        "genre": "Dystopia", 
        "language": "Eng",
        "price": 22.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "average",
        "description": "ჯორჯ ორუელის კლასიკური ანტიუტოპია.",
        "cover_url": "https://m.media-amazon.com/images/I/71wANojhEKL._AC_UF1000,1000_QL80_.jpg",
        "status": "active"
    },
    {
        "id": 5, 
        "title": "ვეფხისტყაოსანი", 
        "genre": "Poetry", 
        "language": "Geo",
        "price": 35.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "average",
        "description": "სასკოლო გამოცემა, ილუსტრაციებით.",
        "cover_url": "https://i.ytimg.com/vi/Ei3mqO1g3P0/hqdefault.jpg",
        "status": "active"
    },
    {
        "id": 6, 
        "title": "პატარა უფლისწული", 
        "genre": "Philosophy", 
        "language": "Geo",
        "price": 10.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "good",
        "description": "წიგნი, რომელიც ყველა ასაკის ადამიანმა უნდა წაიკითხოს.",
        "cover_url": "https://lh4.googleusercontent.com/proxy/cO4jCtyA7vdRywxHCllE4asYCy930kb_Z9auGZmRRHBS4v7Mderz72ZThcgddfc3SnyO5nzWQW51koXN5BWmC7jvBCrZulNQbywLt3BYQVvagagWUuwT_TMHKHagK3OyMKMwGXqk1WVQoLkXoXNiAf5dTOlyZEhVZF3N-6Rb2756fJHg0LDz",
        "status": "active"
    },
    {
        "id": 7, 
        "title": "Sapiens", 
        "genre": "History", 
        "language": "Eng",
        "price": 40.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "damaged",
        "description": "კაცობრიობის მოკლე ისტორია.",
        "cover_url": "https://www.bradshawfoundation.com/books/books/sapiens.jpg",
        "status": "active"
    }
]

@app.get("/")
def read_index():
    return FileResponse("index.html")

@app.get("/books")
def get_books(genre: Optional[str] = None, 
              max_price: Optional[float] = None, 
              language: Optional[str] = None, 
              condition: Optional[str] = None, q: Optional[str] = None):
    filtered_books = MOCK_BOOKS

    if genre:
        temp = []
        for b in filtered_books:
            if search_match(genre, b["genre"]):
                temp.append(b)
        filtered_books = temp
    if max_price:
        temp = []
        for b in filtered_books:
            if b["price"] <= max_price:
                temp.append(b)
        filtered_books = temp
    if language:
        temp = []
        for b in filtered_books:
            if search_match(language, b["language"]):
                temp.append(b)
        filtered_books = temp
    if condition:
        temp = []
        for b in filtered_books:
            if search_match(condition, b["condition"]):
                temp.append(b)
        filtered_books = temp

    if q:
        search_results = []
        for b in filtered_books:
            if search_match(q, b["title"]) or search_match(q, b["description"]):
                search_results.append(b)
        filtered_books = search_results

    return filtered_books