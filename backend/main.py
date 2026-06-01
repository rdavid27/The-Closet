from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import supabase

app = FastAPI()

# CORS — allows your phone/emulator to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    try:
        # Tries to fetch one row from profiles to confirm DB connection
        supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}