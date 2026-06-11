from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books # შემოგვაქვს ორივე როუტერი

app = FastAPI(title="Book Store API")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# აპლიკაციაში ვრთავთ ჩვენს მოდულებს
app.include_router(auth.router)
app.include_router(books.router)

@app.get("/")
def root():
    return {"message": "შენ მოხვდი Book Store API-ში. გადადი /docs -ზე გასატესტად."}