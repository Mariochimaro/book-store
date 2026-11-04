import re
from deep_translator import GoogleTranslator
from database import supabase

def detect_language(text: str) -> str:
    """ადგენს ტექსტის ენას (ქართული, რუსული, ინგლისური)"""
    if re.search(r'[\u10A0-\u10FF]', text):
        lang = 'ka'
    elif re.search(r'[\u0400-\u04FF]', text):
        lang = 'ru'
    else:
        lang = 'en'
    
    print(f"🔍 [detect_language] ტექსტი: '{text}' | ენა: {lang}")
    return lang

def create_english_slug(text: str) -> str:
    """ქმნის სუფთა ინგლისურ სლაგს (მხოლოდ a-z, 0-9 და -)"""
    clean = text.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
    final_slug = slug or "unknown-book"
    print(f"🔤 [create_english_slug] წყარო: '{text}' | ინგლისური სლაგი: '{final_slug}'", flush=True)
    return final_slug

def create_localized_slug(text: str) -> str:
    """ქმნის ენობრივ სლაგს (ინარჩუნებს ქართულ/უნიკოდ ასოებს)"""
    clean = text.lower().strip()
    slug = re.sub(r'[^\w\s-]+', '', clean)
    slug = re.sub(r'[\s_]+', '-', slug).strip('-')
    final_slug = slug or "book"
    print(f"🌐 [create_localized_slug] წყარო: '{text}' | ენობრივი სლაგი: '{final_slug}'", flush=True)
    return final_slug

def get_or_create_cluster(title: str) -> int:
    """
    პოულობს ან ქმნის კლასტერს:
    1. book_clusters-ში ყოველთვის ინახება ინგლისური სლაგი.
    2. book_cluster_slugs-ში ინახება ენობრივი ვერსიები.
    """
    print(f"\n--- 🚀 ვიწყებთ კლასტერიზაციას სათაურისთვის: '{title}' ---")
    
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
            cluster_id = existing_loc.data[0]["cluster_id"]
            print(f"✅ [DB] ნაპოვნია არსებული ენობრივი სლაგი ('{loc_slug}'). კლასტერის ID: {cluster_id}", flush=True)
            return cluster_id
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
            print(f"🌍 [Translate] ნათარგმნი სათაური: '{translated_title}'", flush=True)
        except Exception as e:
            print(f"⚠️ თარგმანის შეცდომა ({e}), ვიყენებთ ორიგინალს.", flush=True)
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
            print(f"✅ [DB] მთავარი ინგლისური კლასტერი უკვე არსებობს. ID: {cluster_id} (სლაგი: '{en_slug}')", flush=True)
        else:
            new_cluster = {
                "canonical_title": canonical_title,
                "slug": en_slug
            }
            inserted = supabase.table("book_clusters").insert(new_cluster).execute()
            if inserted.data:
                cluster_id = inserted.data[0]["id"]
                print(f"✨ [DB] შევქმენი ახალი მთავარი კლასტერი! ID: {cluster_id} | სათაური: '{canonical_title}' | სლაგი: '{en_slug}'", flush=True)

    except Exception as db_err:
        print(f"⚠️ book_clusters-ის შეცდომა: {db_err}", flush=True)
        fallback = supabase.table("book_clusters").select("id").eq("slug", en_slug).execute()
        if fallback.data:
            cluster_id = fallback.data[0]["id"]
            print(f"🔄 [DB Fallback] კლასტერი მოიძებნა ფოლბექით. ID: {cluster_id}", flush=True)

    if not cluster_id:
        raise Exception("კლასტერის ID-ს გენერირება ვერ მოხერხდა.")

    # -------------------------------------------------------------
    # 4. ვამატებთ ენობრივ ჩანაწერს book_cluster_slugs-ში
    # -------------------------------------------------------------
    try:
        existing_entry = supabase.table("book_cluster_slugs") \
            .select("id") \
            .eq("cluster_id", cluster_id) \
            .eq("language", lang) \
            .execute()

        if not existing_entry.data:
            new_slug_entry = {
                "cluster_id": cluster_id,
                "language": lang,
                "slug": loc_slug
            }
            supabase.table("book_cluster_slugs").insert(new_slug_entry).execute()
            print(f"➕ [DB] დავამატე ახალი ენობრივი სლაგი book_cluster_slugs-ში (ენა: {lang}, სლაგი: '{loc_slug}')", flush=True)
        else:
            print(f"ℹ️ [DB] ენობრივი სლაგი ამ ენისთვის ('{lang}') უკვე არსებობს ბაზაში.", flush=True)
            
    except Exception as loc_err:
        print(f"⚠️ book_cluster_slugs-ში ჩაწერის შეცდომა: {loc_err}")

    print(f"🎯 საბოლოო დამუშავებული კლასტერის ID: {cluster_id}\n")
    return cluster_id