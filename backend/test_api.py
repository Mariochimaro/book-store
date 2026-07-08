import pytest
from fastapi.testclient import TestClient
from main import app
from database import supabase

client = TestClient(app)

# სატესტო მონაცემები
TEST_USER = {
    "username": "testuser",
    "email": "test@api.com",
    "password": "securepassword123"
}

# ბაზის ავტომატური წმენდა ახალი ტესტის დაწყებამდე
def clean_user_by_email(email: str):
    try:
        # 1. ვიგებთ იუზერის ID-ს იმეილით
        user_res = supabase.table("users").select("id").eq("email", email).execute()
        if user_res.data:
            user_id = user_res.data[0]["id"]
            
            # 2. იერარქიულად ვშლით ყველაფერს, რაც მასზე იყო მიბმული
            supabase.table("cart").delete().eq("user_id", user_id).execute()
            supabase.table("books").delete().eq("seller_id", user_id).execute()
            supabase.table("audit_logs").delete().eq("user_id", user_id).execute()
            
            # 3. ბოლოს ვშლით თავად იუზერს
            supabase.table("users").delete().eq("id", user_id).execute()
            print(f"\n[CLEANUP] სატესტო მომხმარებელი {email} წარმატებით წაიშალა ბაზიდან!")
    except Exception as e:
        print(f"\n[CLEANUP ERROR] შეცდომა {email}-ის წმენდისას: {e}")


@pytest.fixture(scope="module")
def auth_token():
    # 1. რეგისტრაციამდე გარანტირებულად ვასუფთავებთ ბაზას ძველი სატესტო იუზერისგან
    clean_user_by_email(TEST_USER["email"])
    
    # 2. რეგისტრაცია
    client.post("/auth/register", json=TEST_USER)
    
    # 3. ლოგინი და ტოკენის აღება
    response = client.post("/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    print(f"\nDEBUG: Login status code: {response.status_code}")
    print(f"DEBUG: Login response: {response.json()}") # აქ გამოჩნდება, რას აბრუნებს სერვერი
    token = response.json()["access_token"]
    
    try:
        yield token  # აქ ეშვება ძირითადი ტესტები
    finally:
        # 4. ტესტების მერეც ყოველი შემთხვევისთვის ვასუფთავებთ
        headers = {"Authorization": f"Bearer {token}"}
        client.delete("/user/delete-account?confirm=true", headers=headers)


def test_auth_flow(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == TEST_USER["email"]

def test_onboarding(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "location": "Tbilisi",
        "phone_numbers": ["555000000"],
        "bank_accounts": [{"bank_name": "TBC", "account_number": "GE00000"}],
        "birth_year": 1995,
        "selling_method": ["delivery", "meetup"]
    }
    response = client.post("/user/onboarding", json=payload, headers=headers)
    assert response.status_code == 200

def test_get_user_profile(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/user/profile", headers=headers)
    assert response.status_code == 200
    profile_data = response.json()
    
    assert profile_data["username"] == TEST_USER["username"]
    assert profile_data["location"] == "Tbilisi"
    assert "password" not in profile_data, "შეცდომა: პაროლი ბრუნდება ფრონტენდზე!"

def test_update_user_profile(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    update_payload = {
        "username": "updated_testuser",
        "location": "Batumi",
        "bank_accounts": [{"bank_name": "TBC", "account_number": "GE99999"}]
    }
    response = client.put("/user/profile", json=update_payload, headers=headers)
    assert response.status_code == 200
    
    updated_data = response.json()["user"]
    assert updated_data["username"] == "updated_testuser"
    assert updated_data["location"] == "Batumi"
    assert updated_data["birth_year"] == 1995

def test_books_lifecycle(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    files = {
        "photo1": ("test_cover.jpg", b"fake-image-bytes", "image/jpeg"),
        "video": ("test_preview.mp4", b"fake-video-bytes", "video/mp4")
    }
    data = {
        "title": "Test Book for Cart",
        "genres": "Sci-Fi",
        "language": "eng",
        "price": 15.00,
        "condition": "good",
        "description": "Testing cart logic"
    }
    
    response = client.post("/books/upload", data=data, files=files, headers=headers)
    assert response.status_code == 201
    book_id = response.json()["book"]["id"]
    
    try:
        cart_payload = {"book_id": book_id}
        cart_response = client.post("/cart/add", json=cart_payload, headers=headers)
        assert cart_response.status_code == 400
        assert "საკუთარი წიგნის" in cart_response.json()["detail"]
    finally:
        delete_response = client.delete(f"/books/{book_id}/delete", headers=headers)
        assert delete_response.status_code == 200


def test_admin_access(auth_token):
    response = client.get("/admin/security-alerts", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 403 


# იზოლირებული ტესტი იუზერის წაშლაზე (Soft Delete) და წიგნის სტატუსზე
def test_user_deletion_and_book_status():
    email = "isolated-del@api.com"
    # პირდაპირი წმენდა ტესტის დასაწყისში
    clean_user_by_email(email)
    
    unique_user = {"username": "isolated_user", "email": email, "password": "password123"}
    client.post("/auth/register", json=unique_user)
    token = client.post("/auth/login", json={"email": email, "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. აუცილებელია ონბორდინგი, თორემ ატვირთვაზე შეიძლება 403 დაგიბრუნოს
    client.post("/user/onboarding", json={
        "location": "Tbilisi", 
        "phone_numbers": ["123"], 
        "bank_accounts": [{"bank_name": "BOG", "account_number": "GE1"}], # <-- შეცვლილია
        "birth_year": 2000, 
        "selling_method": ["meetup"]
    }, headers=headers)
    
    book_id = None
    try:
        # 2. ატვირთვა
        book_data = {
            "title": "Deletion Test Book", "genres": "Drama", "language": "eng", 
            "price": 10.00, "condition": "good", "description": "Testing deletion"
        }
        files = {"photo1": ("test.jpg", b"fake", "image/jpeg")}
        book_res = client.post("/books/upload", data=book_data, files=files, headers=headers)
        assert book_res.status_code == 201
        book_id = book_res.json()["book"]["id"]
        
        # 3. წაშლა (soft)
        del_res = client.delete("/user/delete-account?confirm=true", headers=headers)
        assert del_res.status_code == 200
        
        # 4. შემოწმება
        check = client.get(f"/books/{book_id}")
        assert check.status_code == 200
        assert check.json()["status"] == "seller_deleted"
        
    finally:
        # ნებისმიერ შემთხვევაში წავშალოთ წიგნი და იუზერი (hard)
        if book_id:
            client.delete(f"/books/{book_id}/delete", headers=headers)
        clean_user_by_email(email)
