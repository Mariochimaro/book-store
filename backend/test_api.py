import pytest
from fastapi.testclient import TestClient
from main import app  # დარწმუნდი, რომ main-ში გაქვს FastAPI() ობიექტი

client = TestClient(app)

# სატესტო მონაცემები
TEST_USER = {
    "username": "testuser",
    "email": "test@api.com",
    "password": "securepassword123"
}

@pytest.fixture(scope="module")
def auth_token():
    # 1. რეგისტრაცია
    client.post("/auth/register", json=TEST_USER)
    
    # 2. ლოგინი და ტოკენის აღება
    response = client.post("/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    token = response.json()["access_token"]
    
    yield token  # აქ ეშვება ტესტები
    
    # 3. დასუფთავება: იუზერის წაშლა (Soft delete + ბაზის გასუფთავება)
    headers = {"Authorization": f"Bearer {token}"}
    client.delete("/user/delete-account?confirm=true", headers=headers)

def test_auth_flow(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Get Me
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == TEST_USER["email"]

def test_onboarding(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "location": "Tbilisi",
        "phone_numbers": ["555000000"],
        "account_numbers": ["GE00000"],
        "birth_year": 1995
    }
    response = client.post("/user/onboarding", json=payload, headers=headers)
    assert response.status_code == 200

def test_books_lifecycle(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # ვატანთ როგორც სატესტო ფოტოს, ასევე სატესტო ვიდეოს (fake bytes)
    files = {
        "photo1": ("test_cover.jpg", b"fake-image-bytes", "image/jpeg"),
        "video": ("test_preview.mp4", b"fake-video-bytes", "video/mp4")
    }
    
    data = {
        "title": "Test Book with Video",
        "genres": "Sci-Fi,Action",
        "language": "eng",
        "price": 35.50,
        "condition": "good",
        "description": "This book has an amazing video preview!"
    }
    
    # 1. ატვირთვის ტესტი
    response = client.post("/books/upload", data=data, files=files, headers=headers)
    assert response.status_code == 201, f"ატვირთვა ჩავარდა: {response.json()}"
    
    book_data = response.json()["book"]
    book_id = book_data["id"]
    
    # ვამოწმებთ, რომ ბაზამ ვიდეოს URL-იც დააბრუნა
    assert book_data["book_video_url"] is not None
    assert "book-videos" in book_data["book_video_url"]

    # 2. ედითი (JSON მსგავსების შემოწმება - 90%-იანი წესი)
    edit_payload = {"title": "Slightly Edited Title"}
    edit_response = client.put(f"/books/{book_id}/edit", json=edit_payload, headers=headers)
    assert edit_response.status_code == 200

    # 3. წაშლის ტესტი
    delete_response = client.delete(f"/books/{book_id}/delete", headers=headers)
    assert delete_response.status_code == 200, f"წიგნის წაშლის შეცდომა: {delete_response.json()}"

def test_admin_access(auth_token):
    # აქ დაგჭირდება ადმინის ტოკენი, ან დაუშვი გამონაკლისი შენს კოდში სატესტო მიზნებისთვის
    # თუ `require_admin` ფილტრი ადმინს ამოწმებს, აქ ტესტი ჩავარდება, 
    # თუ არ გაქვს ადმინის ტოკენი - რაც სწორია!
    response = client.get("/admin/security-alerts", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 403 # წვდომა არ უნდა ჰქონდეს