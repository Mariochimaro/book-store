from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books, admin, user, cart, requests, feed
from database import supabase
from contextlib import asynccontextmanager
from scheduler import start_scheduler
from services.emails.email_worker import start_email_worker
from services.emails.timer_worker import start_timer_worker

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
    
    # 1. ვამოწმებთ, ხომ არ არის IP შავ სიაში (Damage Control)
    if client_ip in BLOCKED_IPS:
        return JSONResponse(
            status_code=403, 
            content={"detail": "თქვენი IP მისამართი დაბლოკილია კიბერ-უსაფრთხოების სისტემის მიერ."}
        )
    
    # 2. ვატარებთ მოთხოვნას
    response = await call_next(request)
    
    # 3. გამოვრიცხოთ "ხმაურიანი" ენდპოინტები ლოგებიდან
    ignored_paths = ["/rate", "/bookmark"]
    is_ignored = any(path.endswith(p) for p in ignored_paths)
    
    # 4. ვწერთ ლოგებს მხოლოდ საჭირო მოთხოვნებზე
    if method in ["POST", "PUT", "DELETE"] or path.startswith("/admin"):
        if not is_ignored:  # თუ არ არის იგნორირებულ სიაში
            try:
                log_data = {
                    "action": f"{method} {path}", 
                    "ip_address": client_ip,
                    "status_code": response.status_code
                }
                # ვცადოთ მასივის სახით გადაწოდება
                supabase.table("audit_logs").insert([log_data]).execute()
            except Exception as e:
                print(f"Audit Log-ის ჩაწერა ვერ მოხერხდა: {e}")
    
    return response
