from database import supabase

def get_popular_books(limit=10):
    print(f"🔥 [POPULARITY]: Fetching top {limit} trending books from global RPC...")
    params = {
        "limit_val": limit,
        "view_weight": 0.5,      
        "bookmark_weight": 2.0,  
        "rating_weight": 3.0     
    }
    response = supabase.rpc("get_trending_books", params).execute()
    return response.data

def get_popular_clusters(limit=7):
    print(f"🔥 [POPULARITY]: Fetching top {limit} trending clusters from Supabase RPC...")
    params = {
        "limit_val": limit,
        "view_weight": 0.5,      
        "bookmark_weight": 2.0,  
        "rating_weight": 3.0     
    }
    response = supabase.rpc("get_trending_clusters", params).execute()
    return response.data or []