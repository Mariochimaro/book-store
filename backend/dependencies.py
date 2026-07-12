import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import supabase
from typing import Optional
from config import SECRET_KEY
from routers.auth import ALGORITHM

security = HTTPBearer()

# 1: მკაცრი ფილტრი (აქტიური იუზერებისთვის, ბლოკავს ბანდადებულებს)
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="არავალიდური ტოკენი")

        user = supabase.table("users") \
            .select("id, username, email, is_admin, is_banned, location, phone_numbers") \
            .eq("id", user_id) \
            .execute()
            
        if not user.data:
            raise HTTPException(status_code=401, detail="მომხმარებელი ვერ მოიძებნა")

        user_dict = user.data[0]

        if user_dict.get("is_banned"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="თქვენი ანგარიში დაბლოკილია უსაფრთხოების სისტემის მიერ!"
            )

        return user_dict

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="ტოკენს ვადა გაუვიდა")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="არასწორი ტოკენი")


# 2: ოპციონალური ფილტრი ფიდისთვის (არ აგდებს ერორს, თუ ტოკენი არ არის ან არავალიდურია)
def get_optional_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            return None

        user = supabase.table("users") \
            .select("id, username, email, is_admin, is_banned, location") \
            .eq("id", user_id) \
            .execute()
            
        if not user.data:
            return None

        user_dict = user.data[0]
        
        # თუ იუზერი ბანდადებულია, ფიდზეც არ შევუშვათ მისი პერსონალიზაცია
        if user_dict.get("is_banned"):
            return None

        return user_dict
    except Exception:
        # ნებისმიერი JWT შეცდომისას უბრალოდ None-ს ვაბრუნებთ (ანონიმური იუზერი)
        return None


# 3: ადმინის შემოწმება
def require_admin(current_user = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="წვდომა უარყოფილია: ეს ქმედება მხოლოდ ადმინისტრატორისთვისაა ნებადართული!"
        )
    return current_user