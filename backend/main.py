from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

MOCK_BOOKS = [
    {
        "id": 1,
        "title": "ჰარი პოტერი",
        "genre": "Fantasy",
        "language": "ქართული",
        "price": 15.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "ახალი",
        "description": "ორიგინალი გამოცემა, იდეალურ მდგომარეობაში. მხოლოდ ერთხელაა წაკითხული.",
        "cover_url": "https://sulakauri.ge/uploads/2023/11/hari-poteri-da-philosophiuri-qva.webp"
    },
    {
        "id": 2,
        "title": "ბეჭდების მბრძანებელი",
        "genre": "Fantasy",
        "language": "ქართული",
        "price": 25.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "კარგი",
        "description": "მცირე ნაკაწრებით ყდაზე, მაგრამ შიგნიდან სუფთა ფურცლებით.",
        "cover_url": "https://www.lit.ge//shop/uploads/shop_product_image_176427.jpg"
    },
    {
        "id": 3,
        "title": "შერლოკ ჰოლმსი",
        "genre": "Detective",
        "language": "ქართული",
        "price": 12.0,
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "საშუალო",
        "description": "ძველი გამოცემა, ფურცლები ოდნავ გაყვითლებულია, რაც დამატებით ხიბლს აძლევს.",
        "cover_url": "https://sulakauri.ge/uploads/2023/11/sherlok-holmsis-thavgadasavali-dzveli.webp"
    },
    {
        "id": 4, 
        "title": "1984", 
        "genre": "Dystopia", 
        "language": "ინგლისური",
        "price": 22.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "ახალი",
        "description": "ჯორჯ ორუელის კლასიკური ანტიუტოპია.",
        "cover_url": "https://m.media-amazon.com/images/I/71wANojhEKL._AC_UF1000,1000_QL80_.jpg"
    },
    {
        "id": 5, 
        "title": "ვეფხისტყაოსანი", 
        "genre": "Poetry", 
        "language": "ქართული",
        "price": 35.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "ახალივით",
        "description": "სასკოლო გამოცემა, ილუსტრაციებით.",
        "cover_url": "https://i.ytimg.com/vi/Ei3mqO1g3P0/hqdefault.jpg"
    },
    {
        "id": 6, 
        "title": "პატარა უფლისწული", 
        "genre": "Philosophy", 
        "language": "ქართული",
        "price": 10.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "კარგი",
        "description": "წიგნი, რომელიც ყველა ასაკის ადამიანმა უნდა წაიკითხოს.",
        "cover_url": "https://lh4.googleusercontent.com/proxy/cO4jCtyA7vdRywxHCllE4asYCy930kb_Z9auGZmRRHBS4v7Mderz72ZThcgddfc3SnyO5nzWQW51koXN5BWmC7jvBCrZulNQbywLt3BYQVvagagWUuwT_TMHKHagK3OyMKMwGXqk1WVQoLkXoXNiAf5dTOlyZEhVZF3N-6Rb2756fJHg0LDz"
    },
    {
        "id": 7, 
        "title": "Sapiens", 
        "genre": "History", 
        "language": "ინგლისური",
        "price": 40.0, 
        "seller_id": 1,
        "seller_info": {"name": "მარი", "email": "mari@example.com", "phone": "+995555123456"},
        "condition": "ახალი",
        "description": "კაცობრიობის მოკლე ისტორია.",
        "cover_url": "https://www.bradshawfoundation.com/books/books/sapiens.jpg"
    }
]

@app.get("/")
def read_index():
    return FileResponse("index.html")

@app.get("/books")
def get_books(genre: Optional[str] = None, max_price: Optional[float] = None):
    filtered_books = MOCK_BOOKS
    if genre:
        filtered_books = [b for b in filtered_books if b["genre"].lower() == genre.lower()]
    if max_price:
        filtered_books = [b for b in filtered_books if b["price"] <= max_price]
    return filtered_books
