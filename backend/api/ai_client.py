"""HTTP-клиент к сервису проверки идеи (check-idea)."""

from typing import Any

import httpx

from api.config import AI_REQUEST_TIMEOUT_SEC, AI_SERVICE_URL


async def post_check_idea(idea: str) -> httpx.Response:
    url = f"{AI_SERVICE_URL}/api/check-idea"
    async with httpx.AsyncClient(trust_env=False) as client:
        return await client.post(
            url,
            json={"idea": idea},
            timeout=AI_REQUEST_TIMEOUT_SEC,
        )


def try_parse_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except Exception:
        return {"detail": response.text}
