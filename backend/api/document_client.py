"""HTTP-клиент к микросервису генерации DOCX (AI-сервис :8000)."""

from typing import Any, Dict, Optional, Tuple

import httpx

from api.config import DOC_GENERATE_PATH, DOC_SERVICE_BASE_URL, DOC_SERVICE_TIMEOUT_SEC


def _timeout() -> httpx.Timeout:
    return httpx.Timeout(
        connect=30.0,
        read=DOC_SERVICE_TIMEOUT_SEC,
        write=120.0,
        pool=10.0,
    )


async def post_generate_docx(payload: Dict[str, str]) -> httpx.Response:
    """POST /api/generate-docx — ответ: бинарный .docx."""
    url = f"{DOC_SERVICE_BASE_URL}{DOC_GENERATE_PATH}"
    async with httpx.AsyncClient(trust_env=False) as client:
        return await client.post(url, json=payload, timeout=_timeout())


def is_docx_response(resp: httpx.Response) -> bool:
    ct = (resp.headers.get("content-type") or "").lower()
    return (
        "officedocument" in ct
        or "octet-stream" in ct
        or resp.content[:2] == b"PK"  # ZIP/DOCX magic
    )


def parse_docx_error(resp: httpx.Response) -> str:
    try:
        data = resp.json()
        if isinstance(data, dict):
            detail = data.get("detail")
            if isinstance(detail, list):
                return "; ".join(
                    str(item.get("msg", item)) if isinstance(item, dict) else str(item)
                    for item in detail
                )
            if detail is not None:
                return str(detail)
    except Exception:
        pass
    text = (resp.text or "").strip()
    return text[:500] if text else f"HTTP {resp.status_code}"


def build_fallback_html(payload: Dict[str, Any], resources: Optional[list] = None) -> str:
    title = payload.get("project_title") or payload.get("title") or "Без названия"
    idea = payload.get("idea") or payload.get("description") or ""
    location = payload.get("project_address") or payload.get("location") or "Не указано"
    category = payload.get("project_category") or payload.get("type") or ""
    total = payload.get("total_price") or payload.get("budget")
    items = resources if resources is not None else payload.get("resources") or []
    rows = ""
    for r in items:
        if not isinstance(r, dict):
            continue
        name = r.get("resource") or r.get("name") or "Позиция"
        qty = r.get("quantity", 0)
        unit = r.get("unit") or "шт."
        price = float(r.get("basePrice") or r.get("estimatedCost") or 0)
        rows += f"<tr><td>{name}</td><td>{qty} {unit}</td><td>{float(price) * float(qty):,.0f} ₽</td></tr>"
    smeta_block = ""
    if rows:
        smeta_block = f"""
  <h2>Смета</h2>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Позиция</th><th>Количество</th><th>Сумма</th></tr></thead>
    <tbody>{rows}</tbody>
  </table>"""
    budget_line = ""
    if total is not None:
        try:
            budget_line = f"<p><strong>Общий бюджет:</strong> {float(total):,.0f} ₽</p>"
        except (TypeError, ValueError):
            budget_line = f"<p><strong>Общий бюджет:</strong> {total}</p>"
    cat_line = f"<p><strong>Категория:</strong> {category}</p>" if category else ""
    return f"""
<article>
  <h1>Проектная заявка: {title}</h1>
  {cat_line}
  <h2>Описание</h2>
  <p>{str(idea).replace(chr(10), '<br/>')}</p>
  <h2>Местоположение</h2>
  <p>{location}</p>
  {budget_line}
  {smeta_block}
  <p><em>Полный текст разделов сформирован в DOCX (LLM + RAG). Скачайте файл или откройте «Редактировать».</em></p>
</article>
""".strip()
