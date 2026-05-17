"""Маппинг черновика и инициатора → DocxRequest для POST /api/generate-docx."""

from typing import Any, Dict, List, Optional, Tuple

from models import DBProject, DBUser

VALID_CATEGORIES = frozenset(
    {"Благоустройство", "Дороги", "Освещение", "Спорт", "Культура", "Экология"}
)

_CATEGORY_ALIASES = {
    "благоустройство": "Благоустройство",
    "дороги": "Дороги",
    "освещение": "Освещение",
    "спорт": "Спорт",
    "культура": "Культура",
    "экология": "Экология",
}


def _money_str(value: float) -> str:
    return f"{float(value):.1f}"


def _resolve_category(raw: Optional[str]) -> str:
    if not raw or not str(raw).strip():
        return "Благоустройство"
    text = str(raw).strip()
    if text in VALID_CATEGORIES:
        return text
    lowered = text.lower()
    if lowered in _CATEGORY_ALIASES:
        return _CATEGORY_ALIASES[lowered]
    for cat in VALID_CATEGORIES:
        if cat.lower() in lowered or lowered in cat.lower():
            return cat
    return "Благоустройство"


def _calc_total_budget(draft: DBProject) -> float:
    if draft.budget and float(draft.budget) > 0:
        return float(draft.budget)
    resources = draft.resources or []
    total = 0.0
    for item in resources:
        if not isinstance(item, dict):
            continue
        qty = float(item.get("quantity") or 0)
        price = float(item.get("basePrice") or item.get("estimatedCost") or 0)
        total += qty * price
    return total


def _estimate_beneficiaries(total: float) -> Tuple[str, str]:
    """Грубая оценка, пока нет отдельных полей в форме."""
    if total <= 0:
        return "300", "100"
    est = max(100, int(total / 5000))
    children = max(30, int(est * 0.35))
    return str(est), str(children)


def map_draft_to_docx_request(draft: DBProject, user: DBUser) -> Dict[str, str]:
    total = _calc_total_budget(draft)
    # Соответствует шагу 3 UI: 95% субсидия, 5% взнос инициатора
    municipal = total * 0.95
    public = total * 0.05
    beneficiaries, children = _estimate_beneficiaries(total)

    address = (draft.location or "").strip()
    if not address and draft.coordinates:
        coords = draft.coordinates
        if isinstance(coords, dict):
            lat = coords.get("lat")
            lng = coords.get("lng")
            if lat is not None and lng is not None:
                address = f"координаты: {lat}, {lng}"

    return {
        "project_title": (draft.title or "Без названия").strip(),
        "project_address": address or "Адрес не указан",
        "initiator_fio": (user.name or "Инициатор").strip(),
        "initiator_phone": (user.phone or "+7 (000) 000-00-00").strip(),
        "initiator_email": (user.email or "no-reply@example.ru").strip(),
        "project_category": _resolve_category(draft.type),
        "idea": (draft.description or "").strip(),
        "total_price": _money_str(total),
        "municipal_fund": _money_str(municipal),
        "municipal_fund_percents": "95.0",
        "public_funds": _money_str(public),
        "public_funds_percents": "5.0",
        "legal_entitites_funds": "0.0",
        "legal_entities_funds_percents": "0.0",
        "number_of_beneficiaries": beneficiaries,
        "childrens_in_beneficiaries": children,
    }


def validate_docx_request(payload: Dict[str, str]) -> List[str]:
    """Список ошибок валидации перед вызовом AI-сервиса."""
    errors: List[str] = []
    if len(payload.get("idea", "")) < 5:
        errors.append("Слишком короткое описание идеи (минимум 5 символов)")
    if not payload.get("project_title"):
        errors.append("Не указано название проекта")
    if payload.get("project_address") in ("", "Адрес не указан"):
        errors.append("Укажите адрес проекта на шаге с картой")
    if float(payload.get("total_price", "0")) <= 0:
        errors.append("Бюджет проекта должен быть больше нуля (шаг «Финансы»)")
    return errors
