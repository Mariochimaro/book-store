from . import popularity
from .content import get_personalized_books
from .collaborative import get_item_based_recommendations, get_user_based_recommendations

# 👈 დავამატეთ user_email
def get_best_recommendations(user_id: int = None, user_email: str = None, user_has_history: bool = False, target_book_id: int = None):
    
    # ==================== CASE 1: COLD START (მხოლოდ მაშინ, თუ არც ისტორიაა და არც target_book) ====================
    if not user_has_history and not target_book_id:
        print("\n" + "* " * 25)
        print(f"❄️  [COLD START ACTIVATED]: No user history AND no target book provided.")
        print("❄️  Fallback Strategy: Serving global popular/trending books.")
        print("* " * 25 + "\n")
        return popularity.get_popular_books(limit=10)
    
    # ==================== CASE 2: HYBRID  ====================
    # თუ user_id არ არის, content_recs იქნება [] - რაც სწორია RELATED გვერდისთვის
    
    content_recs = get_personalized_books(user_id) if user_id else []
    
    # სმარტ გადართვა: თუ წიგნის ID გვაქვს -> Item-Based, თუ არა და იუზერი გვაქვს -> User-Based
    collab_recs = []
    collab_source_name = "Collaborative"
    
    if target_book_id:
        collab_recs = get_item_based_recommendations(target_book_id)
        collab_source_name = "Collab (Related Items)"
    elif user_email:
        collab_recs = get_user_based_recommendations(user_email)
        collab_source_name = "Collab (Similar Users)"
        
    book_scoring = {} 
    boosted_items = []
    
    for index, book in enumerate(collab_recs):
        b_id = book.get("id")
        if b_id is not None:
            collab_score = (5 - index) * 2.0
            book_scoring[b_id] = {"book": book, "score": collab_score, "source": collab_source_name}
            
    for index, book in enumerate(content_recs):
        b_id = book.get("id")
        if b_id is not None:
            content_score = (10 - index) * 1.5
            if b_id in book_scoring:
                book_scoring[b_id]["score"] += content_score
                book_scoring[b_id]["source"] = "HYBRID 🚀"
                boosted_items.append(f"{book.get('title', b_id)} (+{content_score} pts)")
            else:
                book_scoring[b_id] = {"book": book, "score": content_score, "source": "Content-Based"}
                
    combined_scored = list(book_scoring.values())
    combined_scored.sort(key=lambda x: (x["score"], x["book"].get("views", 0)), reverse=True)
    combined = [item["book"] for item in combined_scored]
    
    fillers_added = 0
    if len(combined) < 10:
        fillers = popularity.get_popular_books(limit=10)
        for f in fillers:
            f_id = f.get("id")
            if f_id is not None and f_id not in book_scoring:
                combined.append(f)
                book_scoring[f_id] = {"book": f, "score": 0, "source": "Popularity Filler"}
                fillers_added += 1
                if len(combined) >= 10: break
                    
    final_output = combined[:10]
    
    # რეპორტის ნაწილი (იგივე რჩება, უბრალოდ ვიზუალია)
    print("\n" + "* " * 30)
    mode = f"Related to {target_book_id}" if target_book_id else f"Feed for {user_email}"
    print(f"⚙️  HYBRID FUSION REPORT ({mode})")
    print("* " * 30)
    for idx, item in enumerate(final_output):
        b_id = item.get("id")
        meta = book_scoring.get(b_id, {"score": 0, "source": "Unknown"})
        print(f"   {idx+1}. [{meta['source'].ljust(22)}] {item.get('title', 'Unknown')[:26]} | Score: {meta['score']:.1f}")
    print("* " * 30 + "\n")
    print("─" * 60)
    print(f" 🔹 Content-Based pool size: {len(content_recs)} books (User ID: {user_id})")
    print(f" 🔹 Collab-Based pool size:  {len(collab_recs)} books")
    print(f" 🔹 Popularity Fillers added: {fillers_added}")
    print("─" * 60)
    
    return final_output