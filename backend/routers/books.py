import uuid
from fastapi import  APIRouter, BackgroundTasks, HTTPException, status, File, UploadFile, Form, Depends
from typing import Optional
from database import supabase
from routers.auth import get_current_user, require_admin, ensure_profile_complete
from dependencies import get_optional_current_user
from utils import search_match, sort_books_by_genres, text_similarity, get_or_create_cluster
from services.recommendations.manager import get_best_recommendations
import services.recommendations.affinity as affinity
from services.recommendations.content_related import get_content_based_related_books
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(
    prefix="/books",
    tags=["Books"]
)

class BookEdit(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    genres: Optional[List[str]] = None
    publication_year: Optional[int] = None
    condition: Optional[str] = None

class RatingAction(BaseModel):
    action: str # "like", "dislike", ან "remove"

# 1. წიგნების სიის წამოღება
@router.get("")
def get_books(
    genre: Optional[str] = None, 
    max_price: Optional[float] = None, 
    language: Optional[str] = None, 
    condition: Optional[str] = None, 
    q: Optional[str] = None,
    cluster_id: Optional[int] = None,   # ← ახალი პარამეტრი
):
    query = supabase.table("books").select("""
        *,
        seller:users(id, username, location)
    """).in_("status", ["active", "reserved"])
    
    if max_price:
        query = query.lte("price", max_price)

    if cluster_id is not None:              # ← server-side ფილტრი
        query = query.eq("cluster_id", cluster_id)

    response = query.execute()
    db_books = response.data

    filtered_books = db_books

    if language:
        filtered_books = [b for b in filtered_books if search_match(language, b["language"])]

    if condition:
        filtered_books = [b for b in filtered_books if search_match(condition, b["condition"])]

    if q:
        filtered_books = [
            b for b in filtered_books 
            if search_match(q, b["title"]) or search_match(q, b["description"])
        ]

    if genre:
        filtered_books = sort_books_by_genres(filtered_books, genre)

    return filtered_books

@router.get("/genres")
def get_all_genres():
    """ყველა უნიკალური ჟანრი active წიგნებიდან — FilterPanel-ისთვის"""
    response = (
        supabase.table("books")
        .select("genres")
        .in_("status", ["active", "reserved"])
        .execute()
    )
    genre_set = set()
    for book in response.data:
        for genre in (book.get("genres") or []):
            if genre and genre.strip():
                genre_set.add(genre.strip())

    return sorted(genre_set)

# 2. კონკრეტული ერთი წიგნის დეტალები
def update_book_views(book_id: int, new_views: int):
    try:
        supabase.table("books").update({"views": new_views}).eq("id", book_id).execute()
    except Exception as e:
        print(f"ნახვების განახლება ვერ მოხერხდა: {e}")

@router.get("/{book_id}")
def get_book_by_id(book_id: int, 
                   background_tasks: BackgroundTasks,
                   current_user: Optional[dict] = Depends(get_optional_current_user)):
    # დამატებულია selling_method seller ობიექტში
    response = supabase.table("books").select("""
        *,
        seller:users(id, username, location, selling_method)
    """).eq("id", book_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="წიგნი მოცემული ID-ით ვერ მოიძებნა!"
        )
        
    book = response.data[0]
    
    current_views = book.get("views") or 0
    new_views = current_views + 1
    
    background_tasks.add_task(update_book_views, book_id, new_views)
    
    if current_user:
        background_tasks.add_task(affinity.update_user_affinity, current_user["id"], book, "view")

    book["views"] = new_views
        
    return book

@router.get("/{book_id}/related")
async def get_related_books(book_id: int):
    # 1. ვცდილობთ კოლაბორაციით (ქცევაზე დაფუძნებული)
    related = get_best_recommendations(user_id=None, user_has_history=False, target_book_id=book_id)
    filtered_related = [b for b in related if b["id"] != book_id]
    
    # 2. FALLBACK: თუ კოლაბორაციამ ცარიელი სია დააბრუნა, ვრთავთ Content-Based ძრავს
    if not filtered_related:
        print(f"🧩 [FALLBACK] Collab failed for {book_id}. Using Genre/Author-based search.")
        filtered_related = get_content_based_related_books(book_id, limit=5)
    
    return {"related_books": filtered_related}

# 3. წიგნის ატვირთვა (Async დამატებული ფაილებისთვის)
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_book(
    title: str = Form(..., description="წიგნის სათაური"),
    genres: str = Form(..., description="ჟანრები, მძიმით გამოყოფილი, მაგ: 'Fantasy,Adventure'"),
    language: str = Form(..., description="ენა: მაგ. 'geo' ან 'eng'"),
    price: float = Form(..., description="ფასი ლარებში"),
    publication_year: int = Form(..., description="წიგნის გამოშვების წელი"),
    condition: str = Form(..., description="მდგომარეობა: 'new', 'good', 'average', 'damaged'"),
    description: str = Form(..., description="წიგნის აღწერა"),
    listing_type: str = Form("second-hand", description="ტიპი: 'second-hand' ან 'first-hand'"), 
    stock_quantity: int = Form(1, description="მარაგში არსებული რაოდენობა"),
    photo1: UploadFile = File(..., description="ფოტო (5MB-მდე)"),
    photo2: Optional[UploadFile] = File(None),
    photo3: Optional[UploadFile] = File(None),
    photo4: Optional[UploadFile] = File(None),
    photo5: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None, description="ვიდეო (მაქს. 50MB)"),
    current_user = Depends(get_current_user) # ვიღებთ სისტემაში მყოფ იუზერს ტოკენიდან
):
    photos = [p for p in [photo1, photo2, photo3, photo4, photo5] if p is not None]
    
    ensure_profile_complete(current_user)
    supabase_user_id = current_user["id"]

    # --- ვალიდაციები ---
    if len(photos) > 5:
        raise HTTPException(status_code=400, detail="მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!")
    
    for photo in photos:
        file_size = len(await photo.read())
        await photo.seek(0)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"ფოტოს ({photo.filename}) ზომა აჭარბებს 5MB-ს!")

    if video:
        video_size = len(await video.read())
        await video.seek(0)
        if video_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="ვიდეოს ზომა არ უნდა აღემატებოდეს 50MB-ს!")

    # --- ფოტოების ატვირთვა Supabase Storage-ში ---
    uploaded_photos_urls = []
    for photo in photos:
        try:
            file_ext = photo.filename.split(".")[-1]
            unique_name = f"{uuid.uuid4()}.{file_ext}"
            file_bytes = await photo.read()
            
            # ვტვირთავთ book-images ბაკეტში
            supabase.storage.from_("book-images").upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": photo.content_type}
            )
            # ვიღებთ ლინკს
            public_url = supabase.storage.from_("book-images").get_public_url(unique_name)
            uploaded_photos_urls.append(public_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ფოტოს ატვირთვისას მოხდა შეცდომა: {str(e)}")

    # --- ვიდეოს ატვირთვა (თუ არსებობს) ---
    uploaded_video_url = None
    if video:
        try:
            file_ext = video.filename.split(".")[-1]
            unique_name = f"{uuid.uuid4()}.{file_ext}"
            file_bytes = await video.read()
            
            # ვტვირთავთ book-videos ბაკეტში
            supabase.storage.from_("book-videos").upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": video.content_type}
            )
            uploaded_video_url = supabase.storage.from_("book-videos").get_public_url(unique_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ვიდეოს ატვირთვისას მოხდა შეცდომა: {str(e)}")

    # --- ჟანრების სტრინგის მასივად ქცევა ---
    genres_list = [g.strip() for g in genres.split(",")]

    # --- კლასტერის განსაზღვრა/შექმნა ---
    # ამას ვაკეთებთ ატვირთვის მომენტში
    cluster_id = get_or_create_cluster(title)

    # --- მონაცემების მომზადება ბაზისთვის ---
    new_book = {
        "title": title,
        "cluster_id": cluster_id,
        "genres": genres_list,
        "language": language,
        "price": price,
        "publication_year": publication_year,
        "condition": condition,
        "description": description,
        "listing_type": listing_type,
        "stock_quantity": stock_quantity,
        "photos_urls": uploaded_photos_urls,
        "book_video_url": uploaded_video_url,
        "seller_id": supabase_user_id,
        "status": "pending",
        "is_approved": False
    }
    
    # --- ბაზაში ჩაწერა ---
    try:
        response = supabase.table("books").insert(new_book).execute()
        return {
            "status": "success",
            "message": "წიგნი წარმატებით აიტვირთა და ელოდება ადმინის დასტურს!",
            "book": response.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ბაზაში შენახვა ვერ მოხერხდა: {str(e)}")
    
@router.put("/{book_id}/edit")
def edit_my_book(book_id: int, edit_data: BookEdit, current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. მოგვაქვს არსებული წიგნი
    response = supabase.table("books").select("*").eq("id", book_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა.")
    
    old_book = response.data[0]
    was_rejected = old_book.get("status") == "rejected"

    # 2. ვამოწმებთ ავტორს
    if old_book["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="უფლება არ გაქვთ.")

    update_dict = {}
    needs_admin_review = False

    # 3. ფასის შეცვლა (არ საჭიროებს ადმინს)
    if edit_data.price is not None and edit_data.price != old_book["price"]:
        update_dict["price"] = edit_data.price

    # 3.1 გამოშვების წლის შეცვლა (არ საჭიროებს ადმინს)
    if edit_data.publication_year is not None and edit_data.publication_year != old_book["publication_year"]:
        update_dict["publication_year"] = edit_data.publication_year

    # 4. ჟანრის შეცვლა (საჭიროებს ადმინს)
    if edit_data.genres is not None and set(edit_data.genres) != set(old_book["genres"]):
        update_dict["genres"] = edit_data.genres
        needs_admin_review = True

    # 4.1 მდგომარეობის შეცვლა (საჭიროებს ადმინს)
    if edit_data.condition is not None and edit_data.condition != old_book["condition"]:
        update_dict["condition"] = edit_data.condition
        needs_admin_review = True

    # 5. სახელის და აღწერის შემოწმება (90% წესი)
    if edit_data.title and edit_data.title != old_book["title"]:
        similarity = text_similarity(old_book["title"], edit_data.title)
        if similarity < 0.90:
            needs_admin_review = True
        update_dict["title"] = edit_data.title

    if edit_data.description and edit_data.description != old_book["description"]:
        similarity = text_similarity(old_book["description"], edit_data.description)
        if similarity < 0.90:
            needs_admin_review = True
        update_dict["description"] = edit_data.description

    # 6. სტატუსის განახლება
    sent_to_review = needs_admin_review or was_rejected

    if sent_to_review:
        update_dict["status"] = "pending"
        update_dict["is_approved"] = False
        update_dict["rejection_reason"] = None
        message = (
            "ცვლილებები მნიშვნელოვანია და გაიგზავნა ადმინთან დასადასტურებლად."
            if needs_admin_review else
            "წიგნი ხელახლა გაიგზავნა ადმინთან განსახილველად."
        )
    else:
        message = "ცვლილებები ავტომატურად აისახა (ტიპოები/ფასი/გამოშვების წელი)."

    # 7. ბაზაში გაგზავნა
    if update_dict:
        try:
            supabase.table("books").update(update_dict).eq("id", book_id).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"განახლების შეცდომა: {str(e)}")
    else:
        message = "ცვლილებები არ მოიძებნა."

    return {"status": "success", "message": message, "needs_review": sent_to_review}

@router.put("/{book_id}/edit-photos")
async def edit_book_photos(
    book_id: int,
    photo1: UploadFile = File(..., description="მთავარი ფოტო (აუცილებელი)"),
    photo2: Optional[UploadFile] = File(None),
    photo3: Optional[UploadFile] = File(None),
    photo4: Optional[UploadFile] = File(None),
    photo5: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # 1. მოგვაქვს წიგნი და ვამოწმებთ ავტორობას
    book_res = supabase.table("books").select("*").eq("id", book_id).execute()
    if not book_res.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
        
    old_book = book_res.data[0]
    if old_book["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამ წიგნის რედაქტირების უფლება.")

    photos = [p for p in [photo1, photo2, photo3, photo4, photo5] if p is not None]
    
    # --- ვალიდაციები ---
    if len(photos) > 5:
        raise HTTPException(status_code=400, detail="მაქსიმუმ 5 ფოტოს ატვირთვაა შესაძლებელი!")
    
    for photo in photos:
        file_size = len(await photo.read())
        await photo.seek(0)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"ფოტოს ({photo.filename}) ზომა აჭარბებს 5MB-ს!")

    # --- ახალი ფოტოების ატვირთვა Supabase-ში ---
    new_photos_urls = []
    for photo in photos:
        try:
            file_ext = photo.filename.split(".")[-1]
            unique_name = f"{uuid.uuid4()}.{file_ext}"
            file_bytes = await photo.read()
            
            supabase.storage.from_("book-images").upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": photo.content_type}
            )
            public_url = supabase.storage.from_("book-images").get_public_url(unique_name)
            new_photos_urls.append(public_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ფოტოს ატვირთვისას მოხდა შეცდომა: {str(e)}")

    # 2. წიგნის განახლება ბაზაში (სტატუსის pending-ზე გადაყვანა)
    update_data = {
        "photos_urls": new_photos_urls,
        "status": "pending",
        "is_approved": False,
        "rejection_reason": None
    }
 
    try:
        supabase.table("books").update(update_data).eq("id", book_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ბაზის განახლების შეცდომა: {str(e)}")

    return {
        "status": "success", 
        "message": "ფოტოები წარმატებით შეიცვალა. წიგნი გაიგზავნა ადმინთან გადასახედად.",
        "new_photos": new_photos_urls
    }

@router.put("/{book_id}/edit-video")
async def edit_book_video(
    book_id: int,
    video: UploadFile = File(..., description="ახალი ვიდეო (მაქს. 50MB)"),
    current_user = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # 1. მოგვაქვს წიგნი და ვამოწმებთ ავტორობას
    book_res = supabase.table("books").select("*").eq("id", book_id).execute()
    if not book_res.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
        
    old_book = book_res.data[0]
    if old_book["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამ წიგნის რედაქტირების უფლება.")

    # --- ვალიდაცია ---
    video_size = len(await video.read())
    await video.seek(0)
    if video_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="ვიდეოს ზომა არ უნდა აღემატებოდეს 50MB-ს!")

    # --- ახალი ვიდეოს ატვირთვა Supabase Storage-ში ---
    try:
        file_ext = video.filename.split(".")[-1]
        unique_name = f"{uuid.uuid4()}.{file_ext}"
        file_bytes = await video.read()
        
        # ვტვირთავთ შესაბამის ბაკეტში (book-videos)
        supabase.storage.from_("book-videos").upload(
            path=unique_name,
            file=file_bytes,
            file_options={"content-type": video.content_type}
        )
        uploaded_video_url = supabase.storage.from_("book-videos").get_public_url(unique_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ვიდეოს ატვირთვისას მოხდა შეცდომა: {str(e)}")

    # 2. წიგნის განახლება ბაზაში და სტატუსის ჩამოყრა (რადგან მედია ფაილია, სჭირდება ადმინის რევიუ)
    update_data = {
        "photos_urls": new_photos_urls,
        "status": "pending",
        "is_approved": False,
        "rejection_reason": None
    }

    try:
        supabase.table("books").update(update_data).eq("id", book_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ბაზის განახლების შეცდომა: {str(e)}")

    return {
        "status": "success", 
        "message": "ვიდეო წარმატებით შეიცვალა. წიგნი გაიგზავნა ადმინთან გადასახედად.",
        "new_video_url": uploaded_video_url
    }   

@router.delete("/{book_id}/delete")
def delete_my_book(book_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. ვამოწმებთ, ეკუთვნის თუ არა ეს წიგნი ამ იუზერს
    book = supabase.table("books").select("seller_id", "deleted_at").eq("id", book_id).execute()
    if not book.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა.")
        
    if book.data[0]["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამ წიგნის წაშლის უფლება.")

    if book.data[0].get("deleted_at") is not None:
        raise HTTPException(status_code=400, detail="წიგნი უკვე გადაყვანილია წაშლილებში.")

    try:
        # Soft Delete: ჩავუწეროთ deleted_at და სტატუსი
        now_str = datetime.now(timezone.utc).isoformat()
        
        supabase.table("books").update({
            "deleted_at": now_str,
            "status": "deleted"
        }).eq("id", book_id).execute()

        return {"status": "success", "message": "წიგნი გადავიდა წაშლილებში. ბაზიდან საბოლოოდ წაიშლება 4 დღეში."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/{book_id}/bookmark")
async def toggle_bookmark(
    book_id: int, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)):

    user_email = current_user["email"]
    user_id = current_user["id"]

    # გვჭირდება წიგნის მონაცემები affinity-ის დასათვლელად
    book_res = supabase.table("books").select("title, genres").eq("id", book_id).execute()
    if not book_res.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
    book_data = book_res.data[0]

    # ვამოწმებთ, უკვე ხომ არ აქვს შენახული
    check = supabase.table("book_bookmarks").select("id").eq("user_email", user_email).eq("book_id", book_id).execute()

    if check.data:
        # თუ მოიძებნა, მოვხსნით (Unbookmark)
        supabase.table("book_bookmarks").delete().eq("id", check.data[0]["id"]).execute()
        # ვამატებთ ფონურ დავალებას ქულის შესამცირებლად
        background_tasks.add_task(affinity.update_user_affinity, user_id, book_data, "unbookmark")
        return {"message": "წიგნი ამოიშალა შენახულებიდან", "bookmarked": False}
    else:
        # თუ არ მოიძებნა, ვამატებთ
        supabase.table("book_bookmarks").insert({"user_email": user_email, "book_id": book_id}).execute()
        # ვამატებთ ფონურ დავალებას ქულის გასაზრდელად
        background_tasks.add_task(affinity.update_user_affinity, user_id, book_data, "bookmark")
        return {"message": "წიგნი შენახულია", "bookmarked": True}
    
@router.post("/{book_id}/rate")
async def rate_book(
    book_id: int, 
    payload: RatingAction, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)):

    user_email = current_user["email"]
    user_id = current_user["id"]
    action = payload.action

    if action not in ["like", "dislike", "remove"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    # გვჭირდება წიგნის მონაცემები affinity-ის დასათვლელად
    book_res = supabase.table("books").select("title, genres").eq("id", book_id).execute()
    if not book_res.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა")
    book_data = book_res.data[0]

    # ჯერ ვამოწმებთ, აქვს თუ არა უკვე შეფასებული
    check = supabase.table("book_ratings").select("id").eq("user_email", user_email).eq("book_id", book_id).execute()
    existing_rating = check.data[0] if check.data else None

    if action == "remove":
        if existing_rating:
            supabase.table("book_ratings").delete().eq("id", existing_rating["id"]).execute()
            # ვაკლებთ ქულას რადგან წაშალა შეფასება (იყო ლაიქი ან დისლაიქი, აღარაა)
            background_tasks.add_task(affinity.update_user_affinity, user_id, book_data, "remove_rating")
        return {"message": "შეფასება წაიშალა"}

    is_like = True if action == "like" else False

    if existing_rating:
        # თუ მომხმარებელი Like-ს Dislike-ით ცვლის (ან პირიქით)
        if existing_rating["is_like"] != is_like:
            supabase.table("book_ratings").update({"is_like": is_like}).eq("id", existing_rating["id"]).execute()
            # ვაგზავნით ახალ ექშენს (აქ შეიძლება უფრო რთული ლოგიკა დაგჭირდეს, რომ 
            # ძველი Like-ის ქულა გამოაკლო და ახალი Dislike-ის დაამატო, მაგრამ სიმარტივისთვის
            # პირდაპირ ახალ ექშენს ვატანთ)
            background_tasks.add_task(affinity.update_user_affinity, user_id, book_data, action)
    else:
        # ვამატებთ ახალს
        supabase.table("book_ratings").insert({
            "user_email": user_email, 
            "book_id": book_id, 
            "is_like": is_like
        }).execute()
        # ვამატებთ ქულას
        background_tasks.add_task(affinity.update_user_affinity, user_id, book_data, action)

    return {"message": f"წიგნი შეფასებულია როგორც {action}"}

@router.get("/bookmarks/me")
async def get_my_bookmarks(current_user: dict = Depends(get_current_user)):
    """
    Returns the list of book_ids the current user has bookmarked.
    Used by the frontend to restore the bookmark icon state after a refresh.
    """
    user_email = current_user["email"]
    res = (
        supabase.table("book_bookmarks")
        .select("book_id")
        .eq("user_email", user_email)
        .execute()
    )
    book_ids = [row["book_id"] for row in res.data] if res.data else []
    return {"book_ids": book_ids}
 
 
@router.get("/ratings/me")
async def get_my_ratings(current_user: dict = Depends(get_current_user)):
    """
    Returns a map of book_id -> "like" | "dislike" for every book the
    current user has rated. Used by the frontend to restore the
    heart / thumbs-down state after a refresh.
    """
    user_email = current_user["email"]
    res = (
        supabase.table("book_ratings")
        .select("book_id, is_like")
        .eq("user_email", user_email)
        .execute()
    )
    ratings = {
        row["book_id"]: ("like" if row["is_like"] else "dislike")
        for row in (res.data or [])
    }
    return {"ratings": ratings}
 