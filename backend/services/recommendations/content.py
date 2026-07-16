from database import supabase
from . import popularity

def get_personalized_books(user_id, limit=10):
    # წამოვიღოთ ტოპ ინტერესები
    affinities = supabase.table("user_affinities") \
        .select("feature_type, feature_value, affinity_score") \
        .eq("user_id", int(user_id)) \
        .order("affinity_score", desc=True) \
        .limit(15) \
        .execute()
    
    if not affinities.data:
        print(f"[FEED DEBUG]: No affinities found for User {user_id}. Returning popularity feed.")
        return popularity.get_popular_books(limit)
    
    genre_weights = {}
    lang_weights = {}
    author_weights = {}
    cluster_weights = {}
    
    for a in affinities.data:
        val = str(a["feature_value"]).lower().strip()
        score = float(a["affinity_score"])
        f_type = a["feature_type"]
        
        if f_type == "genre":
            genre_weights[val] = score
        elif f_type == "language":
            lang_weights[val] = score
        elif f_type == "author":
            author_weights[val] = score
        elif f_type == "cluster":
            cluster_weights[val] = score

    # ==================== ტერმინალის რეპორტი ====================
    print("\n" + "═" * 60)
    print(f"USER RECOMMENDATION PROFILE (User ID: {user_id})")
    print("═" * 60)
    print(f" Genres:    {', '.join([f'{k} ({v})' for k, v in genre_weights.items()]) if genre_weights else 'None'}")
    print(f" Authors:   {', '.join([f'{k} ({v})' for k, v in author_weights.items()]) if author_weights else 'None'}")
    print(f" Languages: {', '.join([f'{k} ({v})' for k, v in lang_weights.items()]) if lang_weights else 'None'}")
    print(f" Clusters:  {', '.join([f'{k} ({v})' for k, v in cluster_weights.items()]) if cluster_weights else 'None'}")
    print("═" * 60 + "\n")
    # ==========================================================

    # წამოვიღოთ აქტიური წიგნები
    all_books = supabase.table("books").select("*") \
        .eq("status", "active") \
        .eq("is_approved", True) \
        .execute().data
    
    if not all_books:
        return popularity.get_popular_books(limit)
        
    ranked_books = []
    for book in all_books:
        score = 0
        
        # 1. ჟანრები
        genres = book.get("genres") or []
        for g in genres:
            g_clean = str(g).lower().strip()
            if g_clean in genre_weights:
                score += genre_weights[g_clean]
        
        # 2. ენა
        book_lang = book.get("language")
        if book_lang:
            lang_clean = str(book_lang).lower().strip()
            if lang_clean in lang_weights:
                score += lang_weights[lang_clean]
                
        # 3. ავტორი
        book_author = book.get("author")
        if book_author:
            author_clean = str(book_author).lower().strip()
            if author_clean in author_weights:
                score += author_weights[author_clean]
                
        # 4. კლასტერი
        book_cluster = book.get("cluster_id")
        if book_cluster and str(book_cluster) in cluster_weights:
            score += cluster_weights[str(book_cluster)]

        ranked_books.append((book, score))
    
    # სორტირება ქულით და ნახვებით
    ranked_books.sort(key=lambda x: (x[1], x[0].get("views", 0)), reverse=True)
    
    return [item[0] for item in ranked_books[:limit]]