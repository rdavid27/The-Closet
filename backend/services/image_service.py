import httpx
import uuid
import os
from dotenv import load_dotenv
from database import supabase

load_dotenv()

REMOVE_BG_API_KEY = os.getenv("REMOVE_BG_API_KEY")
STORAGE_BUCKET = "closet-assets"

async def remove_background(image_bytes: bytes) -> bytes:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.remove.bg/v1.0/removebg",
                headers={"X-Api-Key": REMOVE_BG_API_KEY},
                files={"image_file": ("image.webp", image_bytes, "image/webp")},
                data={"size": "auto"},
                timeout=30.0
            )
            if response.status_code == 200:
                return response.content
            else:
                return None
    except Exception:
        return None


def upload_to_storage(image_bytes: bytes, user_id: str, file_ext: str = "png") -> str:
    file_name = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    
    supabase.storage.from_(STORAGE_BUCKET).upload(
        path=file_name,
        file=image_bytes,
        file_options={"content-type": f"image/{file_ext}"}
    )
    
    url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(file_name)
    return url


def save_wardrobe_item(user_id: str, image_url: str) -> dict:
    item = {
        "user_id": user_id,
        "image_url": image_url,
        "category": "top",
        "color": ["neutral"],
        "tags": ["untagged"],
        "processing_status": "pending"
    }
    
    result = supabase.table("wardrobe_items").insert(item).execute()
    return result.data[0] if result.data else None