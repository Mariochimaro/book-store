from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase

security = HTTPBearer()

# 1: ამოწმებს საერთოდ შესულია თუ არა სისტემაში (Valid User)
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # ჯერ სესიაში ვსვამთ ტოკენს, რომ supabase-მა გაიგოს ვისზეა საუბარი
        supabase.auth.set_session(access_token=token, refresh_token=token)
        
        # ახლა უკვე ვითხოვთ იუზერს
        user_response = supabase.auth.get_user()
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="სესია არავალიდურია, გთხოვთ გაიაროთ ავტორიზაცია ხელახლა"
            )
        return user_response.user
    except Exception as e:
        # დებაგისთვის, რომ ტერმინალში ჩანდეს სხვა რამე თუ ფუჭდება
        print(f"Auth Error: {str(e)}") 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ტოკენი არასწორია ან ვადა გაუვიდა"
        )

# 2: ამოწმებს არის თუ არა მომხმარებელი ადმინი
def require_admin(current_user = Depends(get_current_user)):
    # current_user.email-ით ან id-ით ვამოწმებთ ჩვენს users ცხრილში არის თუ არა ადმინი
    try:
        response = supabase.table("users") \
            .select("is_admin") \
            .eq("email", current_user.email) \
            .execute()
        
        if not response.data or not response.data[0].get("is_admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="წვდომა უარყოფილია: ეს ქმედება მხოლოდ ადმინისტრატორისთვისაა ნებადართული!"
            )
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"უსაფრთხოების შემოწმების შეცდომა: {str(e)}")