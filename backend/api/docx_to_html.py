"""Конвертация DOCX → HTML для предпросмотра и редактора."""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def convert_docx_bytes_to_html(content: bytes) -> Optional[str]:
    if not content or content[:2] != b"PK":
        return None
    try:
        import mammoth

        result = mammoth.convert_to_html(io.BytesIO(content))
        html = (result.value or "").strip()
        if not html:
            return None
        messages = [str(m) for m in (result.messages or [])]
        if messages:
            logger.debug("mammoth messages: %s", messages[:5])
        tag = "div"
        return f"<{tag} class=\"docx-preview\">{html}</{tag}>"
    except ImportError:
        logger.warning("mammoth не установлен — pip install mammoth")
        return None
    except Exception as exc:
        logger.warning("docx→html failed: %r", exc)
        return None
