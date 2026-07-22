from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books, admin, user, cart, requests, feed
from database import supabase
from contextlib import asynccontextmanager
from scheduler import start_scheduler
from services.emails.email_worker import start_email_worker
from services.emails.timer_worker import start_timer_worker
import jwt
from config import SECRET_KEY
from routers.auth import ALGORITHM

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["5/second"])

# lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_email_worker() 
    start_timer_worker()

    scheduler = start_scheduler()

    yield

    scheduler.shutdown()

app = FastAPI(title="Book Store API", lifespan=lifespan)

# კონფიგურაციები და როუტერები app-ზე
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(admin.router)
app.include_router(user.router)
app.include_router(cart.router)
app.include_router(requests.router)
app.include_router(feed.router)

# in-memory შავი სია მაგალითისთვის
BLOCKED_IPS = {"192.168.1.100"}

@app.get("/")
def root():
    return {"message": "შენ მოხვდი Book Store API-ში. გადადი /docs -ზე გასატესტად."}

@app.middleware("http")
async def log_requests_and_security(request: Request, call_next):
    client_ip = request.client.host
    path = request.url.path
    method = request.method
    user_agent = request.headers.get("user-agent", "")
    
    # 1. IP შემოწმება (Damage Control)
    if client_ip in BLOCKED_IPS:
        return JSONResponse(
            status_code=403, 
            content={"detail": "თქვენი IP მისამართი დაბლოკილია კიბერ-უსაფრთხოების სისტემის მიერ."}
        )
    
    # ვცდილობთ ამოვიცნოთ იუზერი ტოკენიდან (Authorization header-იდან)
    user_id = None
    username = None
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # ვშიფრავთ ტოკენს, რომ გავიგოთ ვინ აგზავნის რექვესთს
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("user_id")
            username = payload.get("username")
        except:
            # თუ ტოკენი ვადაგასულია ან არასწორია, უბრალოდ ვაიგნორებთ ამ ეტაპზე 
            # (თვითონ როუტერი დაბლოკავს მაინც)
            pass
    
    # 2. ვატარებთ მოთხოვნას
    response = await call_next(request)
    
    # 3. გამოვრიცხოთ "ხმაურიანი" ენდპოინტები
    ignored_paths = ["/rate", "/bookmark"]
    is_ignored = any(path.endswith(p) for p in ignored_paths)
    
    # 4. ვწერთ ლოგებს
    if method in ["POST", "PUT", "DELETE"] or path.startswith("/admin"):
    # Login ლოგდება auth.py-ში თავისი დეტალებით, ამიტომ აქ აღარ გვინდა გავაორმაგოთ
        if path != "/auth/login" and not is_ignored:
            try:
                log_data = {
                    "user_id": user_id,
                    "username": username,
                    "ip_address": client_ip,
                    "status_code": response.status_code,
                    "method": method,
                    "path": path,
                    "user_agent": user_agent,
                    "metadata": {"action": f"{method} {path}"}
                }
                
                # ვწერთ მასივის სახით
                supabase.table("audit_logs").insert([log_data]).execute()
            except Exception as e:
                print(f"Audit Log-ის ჩაწერა ვერ მოხერხდა: {e}")
    
    return response
