"""Конвертация DOCX → HTML для предпросмотра и редактора."""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def docx_bytes_to_html(content: bytes) -> Optional[str]:
    if not content or content[:2] != b"PK":
        return None
    try:
        import mammoth

        result = mammoth.convert_to_html(io.BytesIO(content))
        html = (result.value or "").strip()
        if html:
            return html
        if result.messages:
            logger.info("mammoth messages: %s", result.messages)
    except ImportError:
        logger.warning("mammoth не установлен — pip install mammoth")
    except Exception as exc:
        logger.warning("docx_bytes_to_html failed: %r", exc)
    return None
