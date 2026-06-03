from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from api.v1.closet import router as closet_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(closet_router, prefix="/api/v1/closet")

@app.get("/health")
def health_check():
    try:
        supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}