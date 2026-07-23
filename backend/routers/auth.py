import re
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr, field_validator
from passlib.context import CryptContext
from database import supabase
import traceback
from datetime import datetime, timedelta
import bcrypt
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# JWT კონფიგურაცია
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 დღე

# პაროლების ჰეშირება
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic მოდელები
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        # 1. ვამოწმებთ, რომ სფეისების რაოდენობა არის 0, 1 ან 2
        if v.count(' ') > 2:
            raise ValueError('მომხმარებლის სახელი არ უნდა შეიცავდეს 2-ზე მეტ სფეისს.')
        
        # 2. ვამოწმებთ, რომ სტრიქონი შეიცავს მხოლოდ ასოებს, ციფრებს და სფეისებს
        # ^[a-zA-Z0-9 ]+$ ნიშნავს: მხოლოდ ეს სიმბოლოები დასაშვებია დასაწყისიდან ბოლომდე
        if not re.match(r"^[a-zA-Z0-9 ]+$", v):
            raise ValueError('მომხმარებლის სახელი უნდა შეიცავდეს მხოლოდ ასოებს, ციფრებს და სფეისებს.')
        
        # 3. დამატებითი შემოწმება: არ იწყებოდეს ან არ მთავრდებოდეს სფეისით (სურვილისამებრ)
        if v.startswith(' ') or v.endswith(' '):
            raise ValueError('მომხმარებლის სახელი არ უნდა იწყებოდეს ან მთავრდებოდეს სფეისით.')
            
        return v

    @field_validator('password')
    @classmethod
    def password_complexity(cls, v: str) -> str:
        # პაროლის სირთულის შემოწმება პირდაპირ მოდელში
        if len(v) < 8:
            raise ValueError("პაროლი უნდა შედგებოდეს მინიმუმ 8 სიმბოლოსგან.")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def get_password_hash(password: str) -> str:
    # პაროლს ვაქცევთ ბაიტებად (utf-8) და ვუმატებთ "salt"-ს
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 1. რეგისტრაცია
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegister):
    # Pydantic უკვე დარწმუნდა, რომ პაროლი აკმაყოფილებს სირთულის წესებს
    # და username არის ალფანუმერული.
 
    existing_user = supabase.table("users").select("id").eq("email", user_data.email).execute()
    if existing_user.data:
        raise HTTPException(status_code=400, detail="მომხმარებელი ამ მეილით უკვე არსებობს!")
 
    hashed_password = get_password_hash(user_data.password)
 
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password_hash": hashed_password
    }
 
    try:
        response = supabase.table("users").insert(new_user).execute()
        created_user = response.data[0]
 
        # რეგისტრაციისთანავე ვცემთ token-ს — frontend-ს აღარ სჭირდება
        # ცალკე POST /auth/login, რომ სესია დაიწყოს.
        token = create_access_token({
            "user_id": created_user["id"],
            "email": created_user["email"],
            "username": created_user["username"]
        })
 
        return {
            "status": "success",
            "message": "რეგისტრაცია წარმატებულია!",
            "access_token": token,
            "token_type": "bearer",
            "user": {"id": created_user["id"], "username": created_user["username"], "email": created_user["email"]}
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"ბაზაში ჩაწერისას მოხდა შეცდომა: {str(e)}")
    
# 2. სესიის დაწყება (LOGIN) + AUDIT LOG
@router.post("/login")
def login_user(user_data: UserLogin, request: Request):
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    user = supabase.table("users").select("*").eq("email", user_data.email).execute()
    if not user.data:
        # ლოგში ვამატებთ username, method, path და user_agent
        supabase.table("audit_logs").insert([{
            "ip_address": client_ip,
            "status_code": 400,
            "method": "POST",
            "path": "/auth/login",
            "user_agent": user_agent,
            "metadata": {"email": user_data.email, "action": "LOGIN_FAILED_NO_USER"}
        }]).execute()
        raise HTTPException(status_code=400, detail="მომხმარებელი ვერ მოიძებნა")

    db_user = user.data[0]

    if not verify_password(user_data.password, db_user["password_hash"]):
        supabase.table("audit_logs").insert([{
            "user_id": db_user["id"],
            "username": db_user["username"], # <-- ვამატებთ username-ს
            "ip_address": client_ip,
            "status_code": 400,
            "method": "POST",
            "path": "/auth/login",
            "user_agent": user_agent,
            "metadata": {"email": user_data.email, "action": "LOGIN_FAILED_WRONG_PWD"}
        }]).execute()
        raise HTTPException(status_code=400, detail="არასწორი პაროლი")

    token = create_access_token({
        "user_id": db_user["id"],
        "email": db_user["email"],
        "username": db_user["username"]
    })

    # წარმატებული შესვლა
    supabase.table("audit_logs").insert([{
        "user_id": db_user["id"],
        "username": db_user["username"], # <-- ვამატებთ username-ს
        "ip_address": client_ip,
        "status_code": 200,
        "method": "POST",
        "path": "/auth/login",
        "user_agent": user_agent,
        "metadata": {"email": user_data.email, "action": "USER_LOGIN_SUCCESS"}
    }]).execute()

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# 3. უსაფრთხოების ფილტრები (DEPENDENCIES)

security = HTTPBearer()

# ფილტრი ა: ამოწმებს ტოკენს და მომენტალურად ბლოკავს "ბანდადებულ" იუზერებს
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="არავალიდური ტოკენი")

        # 1. სელექტში დავამატეთ 'is_banned' სვეტიც
        user = supabase.table("users").select("id, username, email, is_admin, is_banned, location, phone_numbers, genres").eq("id", user_id).execute()
        if not user.data:
            raise HTTPException(status_code=401, detail="მომხმარებელი ვერ მოიძებნა")

        user_dict = user.data[0]

        # 2. Damage Control: ვამოწმებთ არის თუ არა იუზერი ბლოკირებული
        if user_dict.get("is_banned"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="თქვენი ანგარიში დაბლოკილია უსაფრთხოების სისტემის მიერ!"
            )

        return user_dict # აბრუნებს იუზერის ლექსიკონს

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="ტოკენს ვადა გაუვიდა")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="არასწორი ტოკენი")

# ფილტრი ბ: ამოწმებს ადმინის უფლებებს
def require_admin(current_user = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="წვდომა უარყოფილია: ეს ქმედება ნებადართულია მხოლოდ ადმინისტრატორისთვის!"
        )
    return current_user

def ensure_profile_complete(user_dict: dict):
    # ვამოწმებთ, არის თუ არა ველები ცარიელი ან None
    if not user_dict.get("location") or not user_dict.get("phone_numbers"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="გთხოვთ, შეავსოთ პროფილის დეტალები (მისამართი და ტელეფონის ნომერი) წიგნის ატვირთვამდე!"
        )
    return True

# 4. პროფილის ენდპოინტი
@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user