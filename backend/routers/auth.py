from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from database import supabase
import traceback
from datetime import datetime, timedelta
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# JWT config
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# პაროლების დასაშიფრი კონტექსტი (bcrypt ალგორითმით)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic მოდელი რეგისტრაციის ფორმის ვალიდაციისთვის
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# დამხმარე ფუნქციები პაროლისთვის
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister):
    # 1. ვამოწმებთ, ხომ არ არსებობს უკვე იუზერი ამ მეილით
    existing_user = supabase.table("users").select("id").eq("email", user_data.email).execute()
    
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="მომხმარებელი ამ მეილით უკვე არსებობს!"
        )
        
    # 2. ვაჰეშებთ პაროლს
    hashed_password = get_password_hash(user_data.password)
    
    # 3. ვამზადებთ ახალ იუზერს ბაზაში ჩასაწერად
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hashed_password
    }
    
    # 4. ვწერთ მონაცემებს Supabase-ის 'users' ცხრილში
    try:
        response = supabase.table("users").insert(new_user).execute()
        created_user = response.data[0]

        return {
            "status": "success",
            "message": "რეგისტრაცია წარმატებულია!",
            "user": {
                "id": created_user["id"],
                "username": created_user["username"],
                "email": created_user["email"]
            }
        }
    
    except Exception as e:
        print("========== ERROR ==========")
        print(type(e))
        print(e)
        traceback.print_exc()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ბაზაში ჩაწერისას მოხდა შეცდომა: {str(e)}"
        )
    
@router.post("/login")
def login_user(user_data: UserLogin):

    user = supabase.table("users") \
        .select("*") \
        .eq("email", user_data.email) \
        .execute()

    if not user.data:
        raise HTTPException(
            status_code=400,
            detail="მომხმარებელი ვერ მოიძებნა"
        )

    db_user = user.data[0]

    if not verify_password(user_data.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=400,
            detail="არასწორი პაროლი"
        )

    token = create_access_token({
        "user_id": db_user["id"],
        "email": db_user["email"],
        "username": db_user["username"]
    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = supabase.table("users") \
            .select("id, username, email") \
            .eq("id", user_id) \
            .execute()

        if not user.data:
            raise HTTPException(status_code=401, detail="User not found")

        return user.data[0]

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user