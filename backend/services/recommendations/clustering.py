import re
from deep_translator import GoogleTranslator
from database import supabase

def detect_language(text: str) -> str:
    """ადგენს ტექსტის ენას (ქართული, რუსული, ინგლისური)"""
    if re.search(r'[\u10A0-\u10FF]', text):
        return 'ka'
    elif re.search(r'[\u0400-\u04FF]', text):
        return 'ru'
    return 'en'

def create_english_slug(text: str) -> str:
    """ქმნის სუფთა ინგლისურ სლაგს (მხოლოდ a-z, 0-9 და -)"""
    clean = text.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
    return slug or "unknown-book"

def create_localized_slug(text: str) -> str:
    """ქმნის ენობრივ სლაგს (ინარჩუნებს ქართულ/უნიკოდ ასოებს)"""
    clean = text.lower().strip()
    slug = re.sub(r'[^\w\s-]+', '', clean)
    slug = re.sub(r'[\s_]+', '-', slug).strip('-')
    return slug or "book"

def get_or_create_cluster(title: str) -> int:
    """
    პოულობს ან ქმნის კლასტერს:
    1. book_clusters-ში ყოველთვის ინახება ინგლისური სლაგი.
    2. book_cluster_slugs-ში ინახება ენობრივი ვერსიები.
    """
    lang = detect_language(title)
    loc_slug = create_localized_slug(title)

    # -------------------------------------------------------------
    # 1. ჯერ ვამოწმებთ book_cluster_slugs-ში (სწრაფი ძებნა)
    # -------------------------------------------------------------
    try:
        existing_loc = supabase.table("book_cluster_slugs") \
            .select("cluster_id") \
            .eq("slug", loc_slug) \
            .execute()
        
        if existing_loc.data:
            return existing_loc.data[0]["cluster_id"]
    except Exception as e:
        print(f"⚠️ book_cluster_slugs-ში ძებნის შეცდომა: {e}")

    # -------------------------------------------------------------
    # 2. თუ ენობრივი სლაგით ვერ ვიპოვეთ, ვთარგმნით ინგლისურად
    # -------------------------------------------------------------
    if lang == 'en':
        translated_title = title
    else:
        try:
            translated_title = GoogleTranslator(source='auto', target='en').translate(title)
            if not translated_title:
                translated_title = title
        except Exception as e:
            print(f"⚠️ თარგმანის შეცდომა ({e}), ვიყენებთ ორიგინალს.")
            translated_title = title

    en_slug = create_english_slug(translated_title)
    canonical_title = translated_title.strip().title()

    cluster_id = None

    # -------------------------------------------------------------
    # 3. ვეძებთ ან ვქმნით მთავარ კლასტერს (book_clusters) ინგლისური სლაგით
    # -------------------------------------------------------------
    try:
        existing_cluster = supabase.table("book_clusters") \
            .select("id") \
            .eq("slug", en_slug) \
            .execute()

        if existing_cluster.data:
            cluster_id = existing_cluster.data[0]["id"]
        else:
            # თუ ინგლისური კლასტერი არ არსებობს, შევქმნათ
            new_cluster = {
                "canonical_title": canonical_title,
                "slug": en_slug
            }
            inserted = supabase.table("book_clusters").insert(new_cluster).execute()
            if inserted.data:
                cluster_id = inserted.data[0]["id"]

    except Exception as db_err:
        print(f"⚠️ book_clusters-ის შეცდომა: {db_err}")
        # თუ პარალელური მოთხოვნისას შეცდომა მოხდა, თავიდან გადავამოწმოთ
        fallback = supabase.table("book_clusters").select("id").eq("slug", en_slug).execute()
        if fallback.data:
            cluster_id = fallback.data[0]["id"]

    if not cluster_id:
        raise Exception("კლასტერის ID-ს გენერირება ვერ მოხერხდა.")

    # -------------------------------------------------------------
    # 4. ვამატებთ ენობრივ ჩანაწერს book_cluster_slugs-ში
    # -------------------------------------------------------------
    try:
        # შევამოწმოთ ხომ არ არსებობს უკვე (cluster_id, language) წყვილი
        existing_entry = supabase.table("book_cluster_slugs") \
            .select("id") \
            .eq("cluster_id", cluster_id) \
            .eq("language", lang) \
            .execute()

        if not existing_entry.data:
            new_slug_entry = {
                "cluster_id": cluster_id,
                "language": lang,
                "title": title,
                "slug": loc_slug
            }
            supabase.table("book_cluster_slugs").insert(new_slug_entry).execute()
    except Exception as loc_err:
        print(f"⚠️ book_cluster_slugs-ში ჩაწერის შეცდომა: {loc_err}")

    return cluster_id