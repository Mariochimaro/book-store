import re
from deep_translator import GoogleTranslator
from database import supabase

def get_or_create_cluster(title: str) -> int:
    """
    იღებს წიგნის სათაურს ნებისმიერ ენაზე, თარგმნის ინგლისურად,
    ქმნის უნიკალურ slug-ს და აბრუნებს კლასტერის ID-ს.
    """
    try:
        # 1. ავტომატურად ვთარგმნით ინგლისურზე (ნებისმიერი ენიდან)
        translated_title = GoogleTranslator(source='auto', target='en').translate(title)
        
        # თუ თარგმანი ცარიელია, ფოლბექად ორიგინალი გამოვიყენოთ
        if not translated_title:
            translated_title = title
            
    except Exception as e:
        print(f"თარგმანის შეცდომა: {e}, ვიყენებთ ორიგინალ სათაურს.")
        translated_title = title

    # 2. ვასუფთავებთ ტექსტს slug-ისთვის (პატარა ასოები, მხოლოდ ციფრები/ასოები და დეფისები)
    # მაგ: "The Master and Margarita!" -> "the-master-and-margarita"
    clean_text = translated_title.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', clean_text).strip('-')
    
    # უსაფრთხოებისთვის, თუ slug ცარიელი გამოვიდა (მაგ. მხოლოდ სიმბოლოები ეწერა)
    if not slug:
        slug = "unknown-book-" + re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

    canonical_title = translated_title.title() # ლამაზი სათაური კლასტერისთვის

    try:
        # 3. ვეძებთ ბაზაში, ხომ არ არსებობს უკვე ეს კლასტერი
        existing_cluster = supabase.table("book_clusters") \
            .select("id") \
            .eq("slug", slug) \
            .execute()

        if existing_cluster.data:
            return existing_cluster.data[0]["id"]

        # 4. თუ არ არსებობს, ვქმნით ახალს
        new_cluster = {
            "canonical_title": canonical_title,
            "slug": slug
        }
        
        inserted_cluster = supabase.table("book_clusters").insert(new_cluster).execute()
        return inserted_cluster.data[0]["id"]

    except Exception as db_err:
        print(f"ბაზის შეცდომა კლასტერზე: {db_err}")
        # თუ უნიკალურობის დარღვევა მოხდა პარალელური მოთხოვნისას, თავიდან ვეძებთ
        fallback = supabase.table("book_clusters").select("id").eq("slug", slug).execute()
        if fallback.data:
            return fallback.data[0]["id"]
        raise db_err
