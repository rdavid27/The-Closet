from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import base64
from services.image_service import remove_background, upload_to_storage, save_wardrobe_item
from database import supabase

router = APIRouter()

PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000"
MIN_FILE_SIZE = 200 * 1024  # 200kb in bytes

@router.post("/upload", status_code=201)
async def upload_item(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    should_process = len(image_bytes) > MIN_FILE_SIZE
    
    clean_bytes = None
    if should_process:
        clean_bytes = await remove_background(image_bytes)
    
    if clean_bytes is None:
        clean_bytes = image_bytes
        file_ext = "webp"
    else:
        file_ext = "png"

    try:
        image_url = upload_to_storage(clean_bytes, PLACEHOLDER_USER_ID, file_ext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
    
    try:
        item = save_wardrobe_item(PLACEHOLDER_USER_ID, image_url)
        return JSONResponse(status_code=201, content=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")


class Base64Upload(BaseModel):
    image: str
    mime_type: str

@router.post("/upload-base64", status_code=201)
async def upload_item_base64(payload: Base64Upload):
    try:
        image_bytes = base64.b64decode(payload.image)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image")

    should_process = len(image_bytes) > MIN_FILE_SIZE

    clean_bytes = None
    if should_process:
        clean_bytes = await remove_background(image_bytes)

    if clean_bytes is None:
        clean_bytes = image_bytes
        file_ext = "jpeg"
    else:
        file_ext = "png"

    try:
        image_url = upload_to_storage(clean_bytes, PLACEHOLDER_USER_ID, file_ext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    try:
        item = save_wardrobe_item(PLACEHOLDER_USER_ID, image_url)
        return JSONResponse(status_code=201, content=item)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")
    
@router.get("/items", status_code=200)
async def get_items(page: int = 1, limit: int = 20):
    offset = (page - 1) * limit
    
    try:
        result = supabase.table("wardrobe_items")\
            .select("*")\
            .eq("user_id", PLACEHOLDER_USER_ID)\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return {
            "items": result.data,
            "page": page,
            "limit": limit,
            "has_more": len(result.data) == limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))