from database import supabase

def get_content_based_related_books(target_book_id, limit=5):
    # 1. ამოვიღოთ სამიზნე წიგნის ჟანრები და ავტორი
    res = supabase.table("books").select("genres, author").eq("id", target_book_id).single().execute()
    if not res.data:
        return []
        
    target = res.data
    target_genres = target.get("genres", [])
    target_author = target.get("author")

    # 2. მოვძებნოთ მსგავსი წიგნები
    # პრიორიტეტი: იგივე ავტორი ან საერთო ჟანრი
    
    # Supabase-ში OR ოპერატორის სრულყოფილად გაწერა რთულია, ამიტომ გავაკეთოთ ასე:
    # ამოვიღოთ 20-მდე კანდიდატი, რომელიც ან ავტორია ან ჟანრი ემთხვევა
    # და მერე Python-ით დავალაგოთ
    
    query = supabase.table("books").select("*").neq("id", target_book_id).eq("status", "active")
    
    # აქ ვიყენებთ .overlaps()-ს (თუ genres მასივია)
    if target_genres:
        query = query.overlaps("genres", target_genres)
    
    res = query.limit(20).execute()
    books = res.data
    
    # 3. დავალაგოთ (Scoring):
    # თუ ავტორი ემთხვევა - მივცეთ მეტი ქულა, თუ მხოლოდ ჟანრი - ნაკლები
    scored_books = []
    for book in books:
        score = 0
        if book.get("author") == target_author:
            score += 10 # ავტორის ბუსტი
        
        # ჟანრების დამთხვევის რაოდენობა
        common_genres = set(book.get("genres", [])) & set(target_genres)
        score += len(common_genres) * 2
        
        scored_books.append({"book": book, "score": score})
    
    # დავასორტიროთ ქულების მიხედვით
    scored_books.sort(key=lambda x: x["score"], reverse=True)
    
    # დავაბრუნოთ წიგნები
    return [item["book"] for item in scored_books[:limit]]