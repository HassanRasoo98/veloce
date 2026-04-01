import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import auth as auth_router
from app.routers import briefs as briefs_router
from app.routers import users as users_router
from app.routers import webhooks as webhooks_router

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Veloce API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router.router, prefix="/api/users", tags=["users"])
app.include_router(briefs_router.router, prefix="/api/briefs", tags=["briefs"])
app.include_router(webhooks_router.router, prefix="/api/webhooks", tags=["webhooks"])


@app.get("/health")
async def health():
    return {"status": "ok"}
