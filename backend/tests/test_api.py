import pytest
from fastapi.testclient import TestClient
from main import app
from database import supabase
import uuid

client = TestClient(app)

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
            # ვშლით ახალ ცხრილებში დაგროვილ მონაცემებსაც
            supabase.table("book_bookmarks").delete().eq("user_email", email).execute()
            supabase.table("book_ratings").delete().eq("user_email", email).execute()
            supabase.table("user_affinities").delete().eq("user_id", user_id).execute()
            
            supabase.table("books").delete().eq("seller_id", user_id).execute()
            supabase.table("audit_logs").delete().eq("user_id", user_id).execute()
            
            # 3. ბოლოს ვშლით თავად იუზერს
            supabase.table("users").delete().eq("id", user_id).execute()
            print(f"\n[CLEANUP] სატესტო მომხმარებელი {email} წარმატებით წაიშალა ბაზიდან!")
    except Exception as e:
        print(f"\n[CLEANUP ERROR] შეცდომა {email}-ის წმენდისას: {e}")


@pytest.fixture(scope="module")
def auth_token():
    clean_user_by_email(TEST_USER["email"])
    
    reg_response = client.post("/auth/register", json=TEST_USER)
    assert reg_response.status_code in [200, 201], f"Registration failed: {reg_response.text}"

    client.post("/auth/register", json=TEST_USER)
    
    response = client.post("/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
    print(f"\nDEBUG: Login status code: {response.status_code}")
    print(f"DEBUG: Login response: {response.json()}") 
    token = response.json()["access_token"]
    
    try:
        yield token 
    finally:
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
        "bank_accounts": [{"bank_name": "TBC", "account_number": "GE010101010"}],
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
        "bank_accounts": [{"bank_name": "TBC", "account_number": "GE919191919"}]
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
        "publication_year": 2020,
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


def test_user_orders(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get("/user/orders", headers=headers)
    
    assert response.status_code == 200
    assert "orders" in response.json()
    assert isinstance(response.json()["orders"], list)


def test_book_interactions_and_seller_stats(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # 1. ავტვირთოთ წიგნი
    files = {"photo1": ("test_cover.jpg", b"fake-image-bytes", "image/jpeg")}
    data = {
        "title": "Interactive Test Book",
        "genres": "Fantasy",
        "language": "geo",
        "price": 25.00,
        "publication_year": 2021,
        "condition": "new",
        "description": "Testing interactions"
    }
    
    upload_res = client.post("/books/upload", data=data, files=files, headers=headers)
    assert upload_res.status_code == 201
    book_id = upload_res.json()["book"]["id"]
    
    try:
        # 2. ვნახოთ წიგნი
        view_res = client.get(f"/books/{book_id}", headers=headers)
        assert view_res.status_code == 200
        
        # 3. შევინახოთ (Bookmark)
        bookmark_res = client.post(f"/books/{book_id}/bookmark", headers=headers)
        assert bookmark_res.status_code == 200
        assert bookmark_res.json()["bookmarked"] is True
        
        bookmarks_list_res = client.get("/user/bookmarks", headers=headers)
        assert bookmarks_list_res.status_code == 200
        assert any(b["id"] == book_id for b in bookmarks_list_res.json()["bookmarks"])
        
        # 4. შევაფასოთ (Like)
        rate_res = client.post(f"/books/{book_id}/rate", json={"action": "like"}, headers=headers)
        assert rate_res.status_code == 200
        assert "like" in rate_res.json()["message"].lower()
        
        # 5. შევამოწმოთ გამყიდველის სტატისტიკა
        stats_res = client.get("/user/seller-stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()["stats"]
        
        assert "total_earned" in stats
        assert "pending_sales" in stats
        
    finally:
        client.delete(f"/books/{book_id}/delete", headers=headers)


def test_admin_access(auth_token):
    response = client.get("/admin/security-alerts", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 403 


# --- ახალი ტესტები: ველების რედაქტირება და ვიდეოს ჩანაცვლება ---

def test_edit_book_fields_and_video(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # 1. ავტვირთოთ სატესტო წიგნი პირველადი მონაცემებით
    files = {
        "photo1": ("test_cover.jpg", b"fake-image-bytes", "image/jpeg"),
        "video": ("test_preview.mp4", b"fake-video-bytes", "video/mp4")
    }
    data = {
        "title": "Editable Book Title",
        "genres": "Adventure",
        "language": "geo",
        "price": 20.00,
        "publication_year": 2015,
        "condition": "good",
        "description": "Original description for editing test"
    }
    
    upload_res = client.post("/books/upload", data=data, files=files, headers=headers)
    assert upload_res.status_code == 201
    book_id = upload_res.json()["book"]["id"]
    
    try:
        # 2. ვტესტავთ წლოვანების შეცვლას (არ უნდა მოითხოვოს ადმინის რევიუ)
        edit_year_payload = {
            "publication_year": 2018,
            "price": 22.00
        }
        res_year = client.put(f"/books/{book_id}/edit", json=edit_year_payload, headers=headers)
        assert res_year.status_code == 200
        assert res_year.json()["needs_review"] is False
        
        # 3. ვტესტავთ მდგომარეობის (condition) შეცვლას (უნდა მოითხოვოს ადმინის რევიუ)
        edit_condition_payload = {
            "condition": "damaged"
        }
        res_condition = client.put(f"/books/{book_id}/edit", json=edit_condition_payload, headers=headers)
        assert res_condition.status_code == 200
        assert res_condition.json()["needs_review"] is True

        # 4. ვტესტავთ ვიდეოს ჩანაცვლებას (edit-video)
        new_video_file = {
            "video": ("updated_preview.mp4", b"new-fake-video-bytes-up-to-50mb", "video/mp4")
        }
        res_video = client.put(f"/books/{book_id}/edit-video", files=new_video_file, headers=headers)
        assert res_video.status_code == 200
        assert "new_video_url" in res_video.json()
        assert res_video.json()["status"] == "success"

    finally:
        # წმენდა ტესტის დასრულებისას
        client.delete(f"/books/{book_id}/delete", headers=headers)


# იზოლირებული ტესტი იუზერის წაშლაზე (Soft Delete) და წიგნის სტატუსზე
def test_user_deletion_and_book_status():
    email = "isolated-del@api.com"
    clean_user_by_email(email)
    
    unique_user = {"username": "isolated user", "email": email, "password": "password123"}
    # 1. ვამოწმებთ რეგისტრაციას
    reg_res = client.post("/auth/register", json=unique_user)
    assert reg_res.status_code == 201, f"რეგისტრაცია ჩავარდა: {reg_res.json()}"
    
    # 2. ვამოწმებთ შესვლას
    login_res = client.post("/auth/login", json={"email": email, "password": "password123"})
    
    # თუ აქ ჩავარდება, ლოგებში დაგიწერს ზუსტად რატომ ვერ შევიდა
    assert login_res.status_code == 200, f"შესვლა ჩავარდა: {login_res.json()}"
    
    # 3. ვიღებთ ტოკენს
    token = login_res.json().get("access_token")
    assert token is not None, "ტოკენი არ დაბრუნდა!"
    # -------------------
    
    headers = {"Authorization": f"Bearer {token}"}
    
    client.post("/user/onboarding", json={
        "location": "Tbilisi", 
        "phone_numbers": ["523132213"], 
        "bank_accounts": [{"bank_name": "BOG", "account_number": "GE123456789"}], 
        "birth_year": 2000, 
        "selling_method": ["meetup"]
    }, headers=headers)
    
    book_id = None
    try:
        book_data = {
            "title": "Deletion Test Book", 
            "genres": "Drama", 
            "language": "eng", 
            "price": 10.00, 
            "publication_year": 2012,
            "condition": "good", 
            "description": "Testing deletion"
        }
        files = {"photo1": ("test.jpg", b"fake", "image/jpeg")}
        book_res = client.post("/books/upload", data=book_data, files=files, headers=headers)
        assert book_res.status_code == 201
        book_id = book_res.json()["book"]["id"]
        
        del_res = client.delete("/user/delete-account?confirm=true", headers=headers)
        assert del_res.status_code == 200
        
        check = client.get(f"/books/{book_id}")
        assert check.status_code == 200
        assert check.json()["status"] == "seller_deleted"
        
    finally:
        if book_id:
            client.delete(f"/books/{book_id}/delete", headers=headers)
        clean_user_by_email(email)
