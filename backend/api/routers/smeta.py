"""Прокси к микросервису сметы (multipart → multipart)."""

import logging
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from api.auth import get_current_user
from api.config import SMETA_SERVICE_BASE_URL
from api.smeta_client import get_health, post_analyse_and_smeta, post_analyse_and_smeta_single, try_parse_json
from models import DBUser


router = APIRouter(tags=["smeta"])
logger = logging.getLogger(__name__)


def _raise_from_upstream(resp: httpx.Response) -> None:
    if resp.is_success:
        return
    body = try_parse_json(resp)
    if isinstance(body, dict) and "detail" in body and len(body) == 1:
        detail = body["detail"]
    else:
        detail = body
    raise HTTPException(status_code=resp.status_code, detail=detail)


@router.get("/api/analyse-smeta/health")
async def smeta_service_health():
    """Прокси GET /api/health микросервиса сметы (без авторизации)."""
    try:
        resp = await get_health()
    except httpx.RequestError as exc:
        logger.warning(
            "Smeta health: upstream unreachable base=%s err=%r",
            SMETA_SERVICE_BASE_URL,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Smeta service unreachable ({SMETA_SERVICE_BASE_URL}): {exc!r}",
        ) from exc
    if resp.status_code != 200:
        _raise_from_upstream(resp)
    return JSONResponse(content=try_parse_json(resp), status_code=200)


@router.post("/api/analyse-and-smeta")
async def analyse_and_smeta(
    idea: str = Form(..., description="Текст идеи / описание"),
    polygon: str = Form(..., description='JSON строка GeoJSON Polygon, type "Polygon"'),
    photos: Optional[List[UploadFile]] = File(None, description="Фото территории (до лимитов микросервиса)"),
    _user: DBUser = Depends(get_current_user),
):
    """
    Прокси POST /api/analyse-and-smeta микросервиса.
    Ответ как у микросервиса (в т.ч. частичный успех: warnings, пустая smeta).
    """
    uploads = photos if photos else []
    photo_parts: list[tuple[Optional[str], bytes, str]] = []
    for f in uploads:
        raw = await f.read()
        photo_parts.append((f.filename, raw, f.content_type or "application/octet-stream"))

    try:
        resp = await post_analyse_and_smeta(idea, polygon, photo_parts)
    except httpx.RequestError as exc:
        logger.warning(
            "Smeta analyse-and-smeta: upstream failed base=%s err=%r",
            SMETA_SERVICE_BASE_URL,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Smeta service unavailable ({SMETA_SERVICE_BASE_URL}): {exc!r}",
        ) from exc

    if resp.status_code != 200:
        _raise_from_upstream(resp)
    return JSONResponse(content=try_parse_json(resp), status_code=200)


@router.post("/api/analyse-and-smeta-single")
async def analyse_and_smeta_single(
    idea: str = Form(...),
    polygon: str = Form(...),
    photo: UploadFile = File(..., description="Одно фото"),
    _user: DBUser = Depends(get_current_user),
):
    """Прокси POST /api/analyse-and-smeta-single."""
    content = await photo.read()
    try:
        resp = await post_analyse_and_smeta_single(
            idea,
            polygon,
            photo.filename,
            content,
            photo.content_type or "application/octet-stream",
        )
    except httpx.RequestError as exc:
        logger.warning(
            "Smeta analyse-and-smeta-single: upstream failed base=%s err=%r",
            SMETA_SERVICE_BASE_URL,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Smeta service unavailable ({SMETA_SERVICE_BASE_URL}): {exc!r}",
        ) from exc

    if resp.status_code != 200:
        _raise_from_upstream(resp)
    return JSONResponse(content=try_parse_json(resp), status_code=200)
