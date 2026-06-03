from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.image_service import remove_background, upload_to_storage, save_wardrobe_item

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