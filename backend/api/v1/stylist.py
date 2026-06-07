from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import supabase
import uuid

router = APIRouter()

PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000"

# Category pairing matrix
PAIRING_RULES = [
    {"requires": ["top", "bottom"], "occasion": "casual"},
    {"requires": ["top", "bottom", "shoes"], "occasion": "complete"},
    {"requires": ["top", "bottom", "accessory"], "occasion": "styled"},
    {"requires": ["dress"], "occasion": "casual"},
    {"requires": ["kurta", "bottom"], "occasion": "cultural"},
    {"requires": ["top", "bottom", "shoes", "accessory"], "occasion": "formal"},
]

class RemixRequest(BaseModel):
    item_ids: list[str]

def generate_outfits(items: list[dict]) -> list[dict]:
    """Generate all valid outfit combinations based on pairing rules."""
    
    # Group items by category
    by_category: dict[str, list[dict]] = {}
    for item in items:
        cat = item.get("category", "unknown")
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(item)
    
    outfits = []
    seen_combinations = set()

    for rule in PAIRING_RULES:
        required_cats = rule["requires"]
        
        # Check if we have at least one item in each required category
        if not all(cat in by_category for cat in required_cats):
            continue
        
        # Build one outfit per rule using the first available item in each category
        outfit_items = []
        for cat in required_cats:
            outfit_items.append(by_category[cat][0])
        
        # Deduplicate — skip if we've seen this exact combination
        combo_key = tuple(sorted(item["id"] for item in outfit_items))
        if combo_key in seen_combinations:
            continue
        seen_combinations.add(combo_key)

        outfits.append({
            "item_ids": [item["id"] for item in outfit_items],
            "image_urls": [item["image_url"] for item in outfit_items],
            "categories": required_cats,
            "occasion": rule["occasion"],
        })

    return outfits


@router.post("/remix", status_code=201)
async def remix(payload: RemixRequest):
    if len(payload.item_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 items are required to generate outfits"
        )

    # Fetch the actual items from the database
    try:
        result = supabase.table("wardrobe_items")\
            .select("*")\
            .in_("id", payload.item_ids)\
            .eq("user_id", PLACEHOLDER_USER_ID)\
            .execute()
        
        items = result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch items: {str(e)}")

    if not items:
        raise HTTPException(status_code=404, detail="No items found")

    # Generate outfit combinations
    outfits = generate_outfits(items)

    if not outfits:
        raise HTTPException(
            status_code=422,
            detail="Could not generate any outfits with the provided items. Try adding items from different categories."
        )

    # Save each outfit to the database
    saved_outfits = []
    for outfit in outfits:
        try:
            record = {
                "user_id": PLACEHOLDER_USER_ID,
                "item_ids": outfit["item_ids"],
                "occasion": outfit["occasion"],
            }
            saved = supabase.table("outfits").insert(record).execute()
            outfit["outfit_id"] = saved.data[0]["id"]
            saved_outfits.append(outfit)
        except Exception:
            # Don't fail the whole request if one outfit fails to save
            saved_outfits.append(outfit)

    return JSONResponse(status_code=201, content={
        "outfits": saved_outfits,
        "total": len(saved_outfits)
    })


@router.get("/outfits", status_code=200)
async def get_outfits():
    """Fetch previously saved outfits for the user."""
    try:
        result = supabase.table("outfits")\
            .select("*")\
            .eq("user_id", PLACEHOLDER_USER_ID)\
            .order("created_at", desc=True)\
            .execute()
        
        return {"outfits": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))