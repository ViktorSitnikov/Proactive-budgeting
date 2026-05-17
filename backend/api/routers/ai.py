import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.ai_client import post_check_idea, try_parse_json
from api.auth import get_current_user
from api.config import AI_SERVICE_URL
from models import DBUser


router = APIRouter()


class CheckIdeaRequest(BaseModel):
    idea: str


@router.post("/api/projects/check-idea")
async def check_idea(payload: CheckIdeaRequest, current_user: DBUser = Depends(get_current_user)):
    try:
        response = await post_check_idea(payload.idea)
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable ({AI_SERVICE_URL}): {exc!r}",
        ) from exc
    if response.status_code != 200:
        body = try_parse_json(response)
        detail = body.get("detail", body) if isinstance(body, dict) else body
        raise HTTPException(status_code=response.status_code, detail=detail)
    return try_parse_json(response)


@router.post("/api/ai/models/{model_id}/retrain")
async def retrain_model(model_id: str):
    return {"message": f"Model {model_id} retraining started"}
