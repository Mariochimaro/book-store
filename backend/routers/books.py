import uuid
from fastapi import  APIRouter, HTTPException, status, File, UploadFile, Form, Depends
from typing import Optional
from database import supabase
from routers.auth import get_current_user, require_admin, ensure_profile_complete
from utils import search_match, sort_books_by_genres
import difflib
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(
    prefix="/books",
    tags=["Books"]
)

class BookEdit(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    genres: Optional[List[str]] = None

# 1. წიგნების სიის წამოღება
@router.get("")
def get_books(
    genre: Optional[str] = None, 
    max_price: Optional[float] = None, 
    language: Optional[str] = None, 
    condition: Optional[str] = None, 
    q: Optional[str] = None
):
    query = supabase.table("books").select("""
        *,
        seller:users(id, username, location)
    """).eq("status", "active")
    
    if max_price:
        query = query.lte("price", max_price)

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
        .eq("status", "active")
        .execute()
    )
    genre_set = set()
    for book in response.data:
        for genre in (book.get("genres") or []):
            if genre and genre.strip():
                genre_set.add(genre.strip())

    return sorted(genre_set)

# 2. კონკრეტული ერთი წიგნის დეტალები
@router.get("/{book_id}")
def get_book_by_id(book_id: int):
    response = supabase.table("books").select("""
        *,
        seller:users(id, username, location)
    """).eq("id", book_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="წიგნი მოცემული ID-ით ვერ მოიძებნა!"
        )
        
    return response.data[0]


# 3. წიგნის ატვირთვა (Async დამატებული ფაილებისთვის)
@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_book(
    title: str = Form(..., description="წიგნის სათაური"),
    genres: str = Form(..., description="ჟანრები, მძიმით გამოყოფილი, მაგ: 'Fantasy,Adventure'"),
    language: str = Form(..., description="ენა: მაგ. 'geo' ან 'eng'"),
    price: float = Form(..., description="ფასი ლარებში"),
    condition: str = Form(..., description="მდგომარეობა: 'new', 'good', 'average', 'damaged'"),
    description: str = Form(..., description="წიგნის აღწერა"),
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

    # --- მონაცემების მომზადება ბაზისთვის ---
    new_book = {
        "title": title,
        "genres": genres_list,
        "language": language,
        "price": price,
        "condition": condition,
        "description": description,
        "photos_urls": uploaded_photos_urls,   # ჩვენი ახალი სვეტი ფოტოების სიისთვის!
        "book_video_url": uploaded_video_url, # ვიდეოს ლინკი
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
    

def text_similarity(str1: str, str2: str) -> float:
    """აბრუნებს მსგავსებას 0.0-დან 1.0-მდე"""
    if not str1 or not str2:
        return 0.0
    return difflib.SequenceMatcher(None, str1, str2).ratio()

@router.put("/{book_id}/edit")
def edit_my_book(book_id: int, edit_data: BookEdit, current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. მოგვაქვს არსებული წიგნი
    response = supabase.table("books").select("*").eq("id", book_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა.")
    
    old_book = response.data[0]
    
    # 2. ვამოწმებთ ავტორს
    if old_book["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="უფლება არ გაქვთ.")

    update_dict = {}
    needs_admin_review = False

    # 3. ფასის შეცვლა (არ საჭიროებს ადმინს შენი ლოგიკით)
    if edit_data.price is not None and edit_data.price != old_book["price"]:
        update_dict["price"] = edit_data.price

    # 4. ჟანრის შეცვლა (საჭიროებს ადმინს)
    if edit_data.genres is not None and set(edit_data.genres) != set(old_book["genres"]):
        update_dict["genres"] = edit_data.genres
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

    # 6. სტატუსის განახლება თუ ადმინის გადახედვა სჭირდება
    if needs_admin_review:
        update_dict["status"] = "pending"
        update_dict["is_approved"] = False
        message = "ცვლილებები მნიშვნელოვანია და გაიგზავნა ადმინთან დასადასტურებლად."
    else:
        message = "ცვლილებები ავტომატურად აისახა (ტიპოები/ფასი)."

    # 7. ბაზაში გაგზავნა (თუ რამე შეიცვალა საერთოდ)
    if update_dict:
        try:
            supabase.table("books").update(update_dict).eq("id", book_id).execute()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"განახლების შეცდომა: {str(e)}")
    else:
        message = "ცვლილებები არ მოიძებნა."

    return {"status": "success", "message": message, "needs_review": needs_admin_review}

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
        "status": "pending",        # ადმინმა უნდა შეამოწმოს ახალი ფოტოები
        "is_approved": False
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
    
@router.delete("/{book_id}/delete")
def delete_my_book(book_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # 1. ვამოწმებთ, ეკუთვნის თუ არა ეს წიგნი ამ იუზერს
    book = supabase.table("books").select("seller_id").eq("id", book_id).execute()
    if not book.data:
        raise HTTPException(status_code=404, detail="წიგნი ვერ მოიძებნა.")
        
    if book.data[0]["seller_id"] != user_id:
        raise HTTPException(status_code=403, detail="თქვენ არ გაქვთ ამ წიგნის წაშლის უფლება.")

    try:
        supabase.table("books").delete().eq("id", book_id).execute()
        return {"status": "success", "message": "წიგნი წაიშალა."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))