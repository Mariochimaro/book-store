import difflib
from difflib import SequenceMatcher
import re
from database import supabase

def format_public_book(book_data: dict) -> dict:
    """
    აშორებს წიგნის ლექსიკონს ისეთ ველებს, რომელთა დანახვაც იუზერისთვის არ არის საჭირო.
    """
    hidden_fields = [
        "is_approved", "created_at", "sold_at", "cluster_id", 
        "views", "rejection_reason", "deleted_at"
    ]
    # ვაბრუნებთ ახალ ლექსიკონს მხოლოდ იმ ველებით, რომლებიც არ არის hidden_fields-ში
    return {k: v for k, v in book_data.items() if k not in hidden_fields}

def lat_to_geo(text: str) -> str:
    #ორ-ასოიანი ბგერების ჩანაცვლება
    digraphs = {
        "ch": "ჩ", "sh": "შ", "zh": "ჟ", "ts": "ც", "dz": "ძ", "kh": "ხ",
        "gh": "ღ", "ph": "ფ", "th": "თ", "tc": "ც"
    }
    for eng, geo in digraphs.items():
        text = text.replace(eng, geo)
        
    #ერთ-ასოიანი ბგერების ჩანაცვლება
    chars = {
        'a': 'ა', 'b': 'ბ', 'g': 'გ', 'd': 'დ', 'e': 'ე', 'v': 'ვ',
        'z': 'ზ', 't': 'ტ', 'i': 'ი', 'k': 'კ', 'l': 'ლ', 'm': 'მ',
        'n': 'ნ', 'o': 'ო', 'p': 'პ', 'j': 'ჯ', 'r': 'რ', 's': 'ს',
        'u': 'უ', 'f': 'ფ', 'q': 'ქ', 'y': 'ყ', 'c': 'ც', 'w': 'წ', 'x': 'ხ', 'h': 'ჰ'
    }
    for eng, geo in chars.items():
        text = text.replace(eng, geo)
        
    return text

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", str(text).lower().strip())

def search_match(query: str, value: str, threshold: float = 0.45) -> bool:
    if not query or not value:
        return False
        
    query = normalize(query)
    value = normalize(value)

    if query in value or SequenceMatcher(None, query, value).ratio() >= threshold:
        return True
        
    #bechdebis -> ბეჩდების
    geo_query = lat_to_geo(query)
    if geo_query != query:
        if geo_query in value or SequenceMatcher(None, geo_query, value).ratio() >= threshold:
            return True

    return False

def sort_books_by_genres(books_list: list, query_genres_str: str) -> list:
    if not query_genres_str:
        return books_list

    # მომხმარებლის მიერ შემოყვანილ ტექსტს ვყოფთ ცალკეულ ჟანრებად
    # მაგ: "გოთიკური, მისტიკა" -> ["გოთიკური", "მისტიკა"]
    selected_genres = [g.strip() for g in query_genres_str.split(",") if g.strip()]
    
    scored_books = []
    
    for book in books_list:
        match_count = 0
        book_genres = book.get("genres", [])
        
        # 1. ვითვლით რამდენი ჟანრი დაემთხვა 
        for s_genre in selected_genres:
            if any(search_match(s_genre, b_genre) for b_genre in book_genres):
                match_count += 1
        
        # თუ არცერთი ჟანრი არ დაემთხვა, ამ წიგნს საერთოდ არ ვუცვლით პოზიციას უხეშად, ან ვაძლევთ 0 ქულას
        if match_count == 0:
            continue
            
        # 2. სულ ბოლოს ისინი, რომლებიც სხვა ჟანრებთანაა გარეული
        # ამისათვის ქულას ვაკლებთ ზედმეტი ჟანრების რაოდენობის მცირე პროცენტს (მაგალითად 0.01)
        # ასე 3 დამთხვევიანი წიგნი 2 ჟანრით უფრო წინ იქნება, ვიდრე 3 დამთხვევიანი წიგნი 5 ჟანრით.
        total_book_genres_count = len(book_genres)
        final_score = match_count - (total_book_genres_count * 0.01)
        
        scored_books.append((book, final_score))
        
    # ვასორტირებთ ქულის მიხედვით (დიდიდან პატარისკენ)
    scored_books.sort(key=lambda x: x[1], reverse=True)
    
    return [b[0] for b in scored_books]

def text_similarity(str1: str, str2: str) -> float:
    """აბრუნებს მსგავსებას 0.0-დან 1.0-მდე"""
    if not str1 or not str2:
        return 0.0
    return difflib.SequenceMatcher(None, str1, str2).ratio()

def get_or_create_cluster(title: str) -> int:
    # 1. ვიღებთ ყველა არსებულ კლასტერს
    response = supabase.table("book_clusters").select("*").execute()
    clusters = response.data
    
    normalized_title = normalize(title)
    best_match_id = None
    highest_score = 0.0
    
    # 0.85 არის საკმაოდ მაღალი ზღვარი (85% დამთხვევა). 
    # თუ გინდა უფრო მკაცრი იყოს, აწიე 0.9-მდე.
    threshold = 0.85 
    
    # 2. ვეძებთ საუკეთესო დამთხვევას
    for cluster in clusters:
        cluster_title = normalize(cluster["canonical_title"])
        # ვიყენებთ SequenceMatcher-ს მსგავსების დასათვლელად
        score = SequenceMatcher(None, normalized_title, cluster_title).ratio()
        
        if score > highest_score:
            highest_score = score
            best_match_id = cluster["id"]
            
    # 3. თუ ვიპოვეთ კმაყოფილების ზღვარზე მაღალი მსგავსება, ვაბრუნებთ ID-ს
    if highest_score >= threshold:
        return best_match_id
        
    # 4. თუ ვერ ვიპოვეთ, ვქმნით ახალ კლასტერს
    # slug-ისთვის ვწმენდთ სათაურს სპეც-სიმბოლოებისგან
    slug = re.sub(r'[^a-z0-9\u10d0-\u10ff]+', '-', normalized_title)
    
    new_cluster = supabase.table("book_clusters").insert({
        "canonical_title": title,
        "slug": slug
    }).execute()
    
    return new_cluster.data[0]["id"]