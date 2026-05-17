"""Прокси генерации и сохранения проектного DOCX."""

import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.auth import get_current_user
from api.config import BASE_DIR, DOC_SERVICE_BASE_URL
from api.document_client import (
    build_fallback_html,
    is_docx_response,
    parse_docx_error,
    post_generate_docx,
)
from api.docx_to_html import convert_docx_bytes_to_html
from api.docx_mapper import map_draft_to_docx_request, validate_docx_request
from database import get_db
from models import DBProject, DBUser

logger = logging.getLogger(__name__)

router = APIRouter(tags=["documents"])

DOCUMENTS_DIR = os.path.join(BASE_DIR, "static", "documents")
os.makedirs(DOCUMENTS_DIR, exist_ok=True)


class DocumentHtmlUpdate(BaseModel):
    documentHtml: str


def _ensure_draft_owner(draft_id: str, user: DBUser, db: Session) -> DBProject:
    draft = (
        db.query(DBProject)
        .filter(DBProject.id == draft_id, DBProject.initiatorId == user.id, DBProject.status == "DRAFT")
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


def _save_docx_bytes(draft_id: str, content: bytes) -> str:
    filename = f"{draft_id}.docx"
    path = os.path.join(DOCUMENTS_DIR, filename)
    with open(path, "wb") as f:
        f.write(content)
    return f"/static/documents/{filename}"


def _docx_path_on_disk(rel_path: str) -> str:
    rel = rel_path.removeprefix("/static/")
    return os.path.join(BASE_DIR, "static", rel)


def _preview_from_docx_file(rel_path: str) -> Optional[str]:
    path = _docx_path_on_disk(rel_path)
    if not os.path.isfile(path):
        return None
    with open(path, "rb") as f:
        return convert_docx_bytes_to_html(f.read())


def _resolve_preview_html(
    draft: DBProject,
    payload: dict,
    docx_bytes: Optional[bytes] = None,
) -> str:
    if docx_bytes:
        converted = convert_docx_bytes_to_html(docx_bytes)
        if converted:
            return converted
    if draft.proposal_document_path:
        from_file = _preview_from_docx_file(draft.proposal_document_path)
        if from_file:
            return from_file
    return build_fallback_html(payload, resources=draft.resources or [])


@router.post("/api/projects/drafts/{draft_id}/generate-document")
async def generate_draft_document(
    draft_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = _ensure_draft_owner(draft_id, current_user, db)
    payload = map_draft_to_docx_request(draft, current_user)

    validation_errors = validate_docx_request(payload)
    if validation_errors:
        raise HTTPException(status_code=422, detail="; ".join(validation_errors))

    docx_path: Optional[str] = draft.proposal_document_path
    preview_html: str = draft.proposal_document_html or ""

    try:
        resp = await post_generate_docx(payload)
    except httpx.TimeoutException:
        logger.warning("Document service timeout base=%s", DOC_SERVICE_BASE_URL)
        raise HTTPException(
            status_code=504,
            detail="Генерация DOCX превысила лимит времени (2–10 мин). Попробуйте позже.",
        )
    except httpx.RequestError as exc:
        logger.warning("Document service unreachable base=%s err=%r", DOC_SERVICE_BASE_URL, exc)
        preview_html = preview_html or build_fallback_html(payload, resources=draft.resources or [])
        draft.proposal_document_html = preview_html
        db.commit()
        return {
            "previewHtml": preview_html,
            "downloadUrl": docx_path,
            "warnings": [
                f"Сервис DOCX недоступен ({DOC_SERVICE_BASE_URL}): {exc!r}. "
                "Убедитесь, что AI-сервис, Ollama и template.docx запущены."
            ],
        }

    if resp.status_code == 200 and is_docx_response(resp):
        if not resp.content:
            raise HTTPException(status_code=502, detail="AI-сервис вернул пустой DOCX")
        docx_path = _save_docx_bytes(draft_id, resp.content)
        preview_html = _resolve_preview_html(draft, payload, docx_bytes=resp.content)
        draft.proposal_document_html = preview_html
        draft.proposal_document_path = docx_path
        db.commit()
        logger.info("DOCX generated draft_id=%s size=%d", draft_id, len(resp.content))
        return {"previewHtml": preview_html, "downloadUrl": docx_path, "warnings": []}

    err_msg = parse_docx_error(resp)
    logger.warning("DOCX service error status=%s msg=%s", resp.status_code, err_msg)

    if resp.status_code == 404:
        raise HTTPException(
            status_code=502,
            detail="На AI-сервисе отсутствует template.docx. Разверните шаблон в рабочей директории сервиса.",
        )
    if resp.status_code == 422:
        raise HTTPException(status_code=422, detail=err_msg)
    if resp.status_code >= 500:
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка генерации DOCX (AI/Ollama/RAG): {err_msg}",
        )

    preview_html = preview_html or build_fallback_html(payload, resources=draft.resources or [])
    draft.proposal_document_html = preview_html
    db.commit()
    return {
        "previewHtml": preview_html,
        "downloadUrl": docx_path,
        "warnings": [f"Сервис DOCX вернул HTTP {resp.status_code}: {err_msg}"],
    }


@router.get("/api/projects/drafts/{draft_id}/document")
async def get_draft_document(
    draft_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = _ensure_draft_owner(draft_id, current_user, db)
    preview = draft.proposal_document_html or ""
    if draft.proposal_document_path and (
        not preview.strip() or "docx-preview" not in preview
    ):
        from_file = _preview_from_docx_file(draft.proposal_document_path)
        if from_file:
            preview = from_file
            draft.proposal_document_html = preview
            db.commit()
    return {
        "previewHtml": preview,
        "downloadUrl": draft.proposal_document_path,
    }


@router.post("/api/projects/drafts/{draft_id}/document/upload")
async def upload_draft_document(
    draft_id: str,
    file: UploadFile = File(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Загрузка отредактированного DOCX из браузерного редактора."""
    draft = _ensure_draft_owner(draft_id, current_user, db)
    content = await file.read()
    if not content or content[:2] != b"PK":
        raise HTTPException(status_code=400, detail="Ожидается файл .docx")

    docx_path = _save_docx_bytes(draft_id, content)
    payload = map_draft_to_docx_request(draft, current_user)
    preview_html = _resolve_preview_html(draft, payload, docx_bytes=content)
    draft.proposal_document_path = docx_path
    draft.proposal_document_html = preview_html
    db.commit()
    return {"previewHtml": preview_html, "downloadUrl": docx_path, "warnings": []}


@router.patch("/api/projects/drafts/{draft_id}/document")
async def update_draft_document(
    draft_id: str,
    body: DocumentHtmlUpdate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = _ensure_draft_owner(draft_id, current_user, db)
    draft.proposal_document_html = body.documentHtml
    db.commit()
    return {"previewHtml": draft.proposal_document_html, "downloadUrl": draft.proposal_document_path}


@router.get("/api/projects/drafts/{draft_id}/document/download")
async def download_draft_document(
    draft_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    draft = _ensure_draft_owner(draft_id, current_user, db)
    if not draft.proposal_document_path:
        raise HTTPException(status_code=404, detail="Document file not found")
    rel = draft.proposal_document_path.removeprefix("/static/")
    path = os.path.join(BASE_DIR, "static", rel)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Document file missing on disk")
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="Заявка_Инициативное_Бюджетирование.docx",
    )
