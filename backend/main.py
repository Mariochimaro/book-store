from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books, admin, user, cart
from database import supabase

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["5/second"])

app = FastAPI(title="Book Store API")

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

# in-memory შავი სია სისწრაფისთვის. 
# იდეალურ შემთხვევაში ეს სიაც ბაზიდან უნდა მოდიოდეს, მაგრამ ჯერ ესეც საკმარისია.
BLOCKED_IPS = {"192.168.1.100"} # მაგალითისთვის

@app.get("/")
def root():
    return {"message": "შენ მოხვდი Book Store API-ში. გადადი /docs -ზე გასატესტად."}

@app.middleware("http")
async def log_requests_and_security(request: Request, call_next):
    client_ip = request.client.host
    path = request.url.path
    method = request.method
    
    # 1. ამოწმებ, ხომ არ არის IP შავ სიაში (Damage Control)
    if client_ip in BLOCKED_IPS:
        return JSONResponse(
            status_code=403, 
            content={"detail": "თქვენი IP მისამართი დაბლოკილია კიბერ-უსაფრთხოების სისტემის მიერ."}
        )
    
    # 2. ვატარებთ მოთხოვნას (აქ slowapi-ც შეამოწმებს თავის 5/second ლიმიტს)
    response = await call_next(request)
    
    # 3. ვწერთ ლოგებს მხოლოდ POST, PUT, DELETE მოთხოვნებზე, ან ადმინის პანელზე
    # ეს დაგიზოგავს ბაზის რესურსს!
    if method in ["POST", "PUT", "DELETE"] or path.startswith("/admin"):
        try:
            log_data = {
                "action": f"{method} {path}", 
                "ip_address": client_ip,
                # "status_code": response.status_code # სურვილისამებრ, ამის დამატებაც შეგიძლია
            }
            # Supabase-ში ჩაწერა
            supabase.table("audit_logs").insert(log_data).execute()
        except Exception as e:
            print(f"Audit Log-ის ჩაწერა ვერ მოხერხდა: {e}")
    
    return response