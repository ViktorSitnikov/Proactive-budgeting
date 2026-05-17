"""HTTP-клиент к микросервису «Analyse Photo And Smeta» (multipart)."""

from typing import Any, Optional

import httpx

from api.config import SMETA_SERVICE_BASE_URL, SMETA_SERVICE_TIMEOUT_SEC


def _smeta_timeout() -> httpx.Timeout:
    return httpx.Timeout(
        connect=30.0,
        read=SMETA_SERVICE_TIMEOUT_SEC,
        write=120.0,
        pool=10.0,
    )


async def post_analyse_and_smeta(
    idea: str,
    polygon: str,
    photo_parts: list[tuple[Optional[str], bytes, str]],
) -> httpx.Response:
    """multipart/form-data: idea, polygon (текст), опционально photos[]."""
    url = f"{SMETA_SERVICE_BASE_URL}/api/analyse-and-smeta"
    files: list[tuple[str, tuple]] = [
        ("idea", (None, idea)),
        ("polygon", (None, polygon)),
    ]
    for filename, content, content_type in photo_parts:
        files.append(
            (
                "photos",
                (filename or "photo.jpg", content, content_type or "application/octet-stream"),
            )
        )
    async with httpx.AsyncClient(trust_env=False) as client:
        return await client.post(url, files=files, timeout=_smeta_timeout())


async def post_analyse_and_smeta_single(
    idea: str,
    polygon: str,
    filename: Optional[str],
    content: bytes,
    content_type: str,
) -> httpx.Response:
    url = f"{SMETA_SERVICE_BASE_URL}/api/analyse-and-smeta-single"
    files: list[tuple[str, tuple]] = [
        ("idea", (None, idea)),
        ("polygon", (None, polygon)),
        (
            "photo",
            (filename or "photo.jpg", content, content_type or "application/octet-stream"),
        ),
    ]
    async with httpx.AsyncClient(trust_env=False) as client:
        return await client.post(url, files=files, timeout=_smeta_timeout())


async def get_health() -> httpx.Response:
    url = f"{SMETA_SERVICE_BASE_URL}/api/health"
    async with httpx.AsyncClient(trust_env=False) as client:
        return await client.get(url, timeout=httpx.Timeout(10.0))


def try_parse_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except Exception:
        return {"detail": response.text}
