import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from database import supabase
from datetime import datetime, timedelta

# ლოკალური კეში
_cache = {
    "matrix": None,   # აქ შევინახავთ Books x Users მატრიცას
    "sim_df": None,   # Item-Item მსგავსება
    "last_updated": None
}
CACHE_TTL_MINUTES = 60 

def _get_similarity_matrix():
    global _cache
    now = datetime.now()
    
    # დაემატა _cache["matrix"] is not None შემოწმება!
    if _cache["sim_df"] is not None and _cache["matrix"] is not None and _cache["last_updated"]:
        if now - _cache["last_updated"] < timedelta(minutes=CACHE_TTL_MINUTES):
            return _cache["sim_df"]
            
    print("🔄 [COLLAB CACHE]: Miss/Expired. Recalculating matrix from DB...")
    ratings_res = supabase.table("book_ratings").select("user_email, book_id, is_like").execute()
    bookmarks_res = supabase.table("book_bookmarks").select("user_email, book_id").execute()
    
    df_ratings = pd.DataFrame(ratings_res.data)
    df_bookmarks = pd.DataFrame(bookmarks_res.data)
    
    if not df_ratings.empty:
        df_ratings['score'] = df_ratings['is_like'].apply(lambda x: 1 if x else -1)
    if not df_bookmarks.empty:
        df_bookmarks['score'] = 0.5
        
    if df_ratings.empty and df_bookmarks.empty:
        return pd.DataFrame()
        
    full_df = pd.concat([df_ratings[['user_email', 'book_id', 'score']] if not df_ratings.empty else pd.DataFrame(), 
                         df_bookmarks[['user_email', 'book_id', 'score']] if not df_bookmarks.empty else pd.DataFrame()])
    
    matrix = full_df.pivot_table(index='book_id', columns='user_email', values='score').fillna(0)
    sim_scores = cosine_similarity(matrix)
    sim_df = pd.DataFrame(sim_scores, index=matrix.index, columns=matrix.index)
    
    _cache["matrix"] = matrix
    _cache["sim_df"] = sim_df
    _cache["last_updated"] = now
    
    print(f"📊 [COLLAB]: Matrix built. Shape: {matrix.shape[0]} books x {matrix.shape[1]} users.")
    return sim_df

def get_item_based_recommendations(target_book_id, limit=5):
    print(f"\n[DEBUG] Starting Collab for ID: {target_book_id}")
    
    sim_df = _get_similarity_matrix()
    
    if sim_df.empty:
        print("[DEBUG] Similarity Matrix is EMPTY.")
        return []
        
    if target_book_id not in sim_df.index:
        print(f"[DEBUG] ID {target_book_id} NOT FOUND in matrix index. Available indices: {sim_df.index.tolist()[:5]}...")
        return []

    # ვნახოთ რას იღებს
    sim_series = sim_df[target_book_id].sort_values(ascending=False)
    print(f"[DEBUG] Similarity series for {target_book_id}: {sim_series.head(5).to_dict()}")
    
    # ვფილტრავთ
    sim_series = sim_series[sim_series.index != target_book_id][:limit]
    similar_ids = sim_series.index.tolist()
    print(f"[DEBUG] Similar IDs found after filtering: {similar_ids}")
    
    if not similar_ids:
        print("[DEBUG] No similar books found (maybe all sims are 0 or list is empty).")
        return []
    
    # ვამოწმებთ სუპაბეიზის მოთხოვნას
    print(f"📡 [DEBUG] Fetching details for IDs from Supabase: {similar_ids}")
    
    books_res = supabase.table("books").select("*").in_("id", similar_ids).eq("status", "active").eq("is_approved", True).execute()
    
    # აქ ხშირად იჭედება ხოლმე (თუ წიგნები ბაზაშია, მაგრამ 'status' active არ არის)
    print(f"[DEBUG] Supabase returned {len(books_res.data)} books.")
    
    book_dict = {b["id"]: b for b in books_res.data}
    
    if not book_dict:
        print("[DEBUG] Supabase returned data, but none matched 'active' and 'is_approved' filters!")
        
    return [book_dict[bid] for bid in similar_ids if bid in book_dict]

# 2. User-Based
def get_user_based_recommendations(user_email, limit=5):
    _get_similarity_matrix() # ვრწმუნდებით რომ კეში ჩატვირთულია
    matrix = _cache.get("matrix")
    
    if matrix is None or matrix.empty or user_email not in matrix.columns:
        print(f"🤷‍♂️ [USER COLLAB]: User {user_email} not in matrix. Skipping.")
        return []
        
    # 1. ვპოულობთ მსგავს იუზერებს (ვატრიალებთ მატრიცას: Users x Books)
    user_sim = cosine_similarity(matrix.T)
    user_sim_df = pd.DataFrame(user_sim, index=matrix.columns, columns=matrix.columns)
    
    # ვიღებთ ტოპ 3 ყველაზე მსგავს იუზერს
    similar_users = user_sim_df[user_email].drop(labels=[user_email], errors='ignore').sort_values(ascending=False)
    similar_users = similar_users[similar_users > 0].head(3).index.tolist()
    
    if not similar_users:
        return []
        
    # 2. ვიღებთ ამ იუზერის წაკითხულ წიგნებს, რომ გამოვრიცხოთ
    user_books = matrix[user_email]
    unseen_books = user_books[user_books == 0].index.tolist() 
    
    # 3. ვნახოთ მსგავსმა იუზერებმა რა ქულები დაუწერეს ამ წაუკითხავ წიგნებს
    similar_users_ratings = matrix.loc[unseen_books, similar_users]
    recommended_book_ids = similar_users_ratings.sum(axis=1).sort_values(ascending=False)
    recommended_book_ids = recommended_book_ids[recommended_book_ids > 0].head(limit).index.tolist()
    
    if not recommended_book_ids:
        return []
        
    books_res = supabase.table("books").select("*").in_("id", recommended_book_ids).eq("status", "active").eq("is_approved", True).execute()
    book_dict = {b["id"]: b for b in books_res.data}
    
    print("\n" + "┌" + "─" * 58 + "┐")
    print(f"│ 👥 USER-BASED COLLAB (Look-alike audience for Feed) ".ljust(59) + "│")
    print("├" + "─" * 58 + "┤")
    for bid in recommended_book_ids:
        if bid in book_dict:
            title = book_dict[bid].get('title', 'Unknown')[:40]
            print(f"│  • {title.ljust(42)} | Match  │")
    print("└" + "─" * 58 + "┘")
    
    return [book_dict[bid] for bid in recommended_book_ids if bid in book_dict]