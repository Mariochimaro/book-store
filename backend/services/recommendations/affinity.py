from database import supabase

# background_tasks-ისთვის განკუთვნილი ფუნქცია
def update_user_affinity(user_id: int, book_data: dict, action: str):
    """
    ფონური დავალება მომხმარებლის ინტერესების (affinities) გასაახლებლად.
    """
    # ქულების სისტემა (Weights)
    action_weights = {
        "view": 0.5,
        "bookmark": 4.0,
        "unbookmark": -2.0,  # Bookmark-ის მოხსნა
        "like": 4.0,
        "dislike": -5.0,
        "remove_rating": -2.0, # შეფასების წაშლა
        "select_genre_preference": 8.0,     # ჟანრის პრეფერენციაში მონიშვნა
        "deselect_genre_preference": -8.0   # პრეფერენციიდან მოხსნა
    }
    
    weight = action_weights.get(action, 0)
    if weight == 0:
        return # უცნობი ექშენის შემთხვევაში არაფერს ვაკეთებთ

    # 1. ამოვიღოთ წიგნის მახასიათებლები, რაზეც უნდა გავზარდოთ/შევამციროთ ქულა
    features_to_update = []
    
    # სათაურის მიმართ ინტერესი (title_cluster-ის მაგივრად ჯერ პირდაპირ title-ს ვიყენებთ,
    # მოგვიანებით fuzzy logic-ით ჩავანაცვლებთ cluster-ით)
    if book_data.get("cluster_id"):
        features_to_update.append({"type": "cluster", "value": str(book_data["cluster_id"])})
    elif book_data.get("title"):
        features_to_update.append({"type": "title", "value": book_data["title"].lower().strip()})
            
    # ჟანრების მიმართ ინტერესი
    if book_data.get("genres"):
        for genre in book_data["genres"]:
            features_to_update.append({"type": "genre", "value": genre.lower().strip()})
            
    # თუ ავტორიც გვაქვს (სამომავლოდ)
    if book_data.get("author"):
         features_to_update.append({"type": "author", "value": book_data["author"].lower().strip()})

    if book_data.get("language"):
        features_to_update.append({
            "type": "language", 
            "value": book_data["language"].lower().strip()
        })

    # 2. გავანახლოთ თითოეული მახასიათებელი ბაზაში
    for feature in features_to_update:
        try:
            # ვიყენებთ Supabase-ის upsert ფუნქციონალს
            # ეს ეძებს ჩანაწერს (user_id, feature_type, feature_value) უნიკალური გასაღებით
            # თუ იპოვის, ააფდეითებს, თუ არადა ამატებს.
            
            # ჯერ ვამოწმებთ არსებობს თუ არა:
            res = supabase.table("user_affinities").select("affinity_score, id").eq("user_id", user_id).eq("feature_type", feature["type"]).eq("feature_value", feature["value"]).execute()
            
            if res.data:
                # განახლება
                existing_id = res.data[0]["id"]
                current_score = float(res.data[0]["affinity_score"])
                new_score = current_score + weight
                supabase.table("user_affinities").update({"affinity_score": new_score}).eq("id", existing_id).execute()
            else:
                # ახლის დამატება
                supabase.table("user_affinities").insert({
                    "user_id": user_id,
                    "feature_type": feature["type"],
                    "feature_value": feature["value"],
                    "affinity_score": weight
                }).execute()
        except Exception as e:
            print(f"Error updating affinity for user {user_id}, feature {feature}: {e}")
            # ფონური ამოცანაა, ამიტომ არ ვაქრაშებთ მთავარ API-ს
            continue