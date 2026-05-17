import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import database
from api.routers.admin import router as admin_router
from api.routers.ai import router as ai_router
from api.routers.auth import router as auth_router
from api.routers.documents import router as documents_router
from api.routers.drafts import router as drafts_router
from api.routers.npos import router as npos_router
from api.routers.projects import router as projects_router
from api.routers.resources import router as resources_router
from api.routers.smeta import router as smeta_router
from api.routers.upload import router as upload_router
from api.websockets import router as websocket_router


app = FastAPI(title="Городская Инициатива API")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    database.init_db()


app.include_router(upload_router)
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(drafts_router)
app.include_router(documents_router)
app.include_router(projects_router)
app.include_router(npos_router)
app.include_router(resources_router)
app.include_router(admin_router)
app.include_router(smeta_router)
app.include_router(websocket_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
