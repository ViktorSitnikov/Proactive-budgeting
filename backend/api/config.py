import os

from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
load_dotenv(dotenv_path=os.path.join(BASE_DIR, ".env"), override=True, encoding="utf-8")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 14)))

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:18081").rstrip("/")
AI_REQUEST_TIMEOUT_SEC = float(os.getenv("AI_REQUEST_TIMEOUT_SEC", "120"))
AI_BACKGROUND_TIMEOUT_SEC = float(os.getenv("AI_BACKGROUND_TIMEOUT_SEC", "180"))

# Микросервис «Analyse Photo And Smeta» (multipart /api/analyse-and-smeta)
SMETA_SERVICE_BASE_URL = os.getenv("SMETA_SERVICE_BASE_URL", "http://127.0.0.1:8005").rstrip("/")
SMETA_SERVICE_TIMEOUT_SEC = float(os.getenv("SMETA_SERVICE_TIMEOUT_SEC", "480"))

# Генерация DOCX заявки (микросервис на :8000, тот же что check-idea по умолчанию)
DOC_SERVICE_BASE_URL = os.getenv("DOC_SERVICE_BASE_URL", os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8000")).rstrip("/")
DOC_GENERATE_PATH = os.getenv("DOC_GENERATE_PATH", "/api/generate-docx")
DOC_SERVICE_TIMEOUT_SEC = float(
    os.getenv("DOC_SERVICE_TIMEOUT_SEC", os.getenv("AI_DOCX_TIMEOUT", "600"))
)
