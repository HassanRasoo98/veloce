from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.models import (
    AiAnalysis,
    Assignment,
    Brief,
    EstimateOverride,
    Note,
    StageEvent,
    User,
)


async def init_db() -> None:
    client = AsyncIOMotorClient(settings.mongodb_uri)
    await init_beanie(
        database=client[settings.mongodb_db],
        document_models=[
            User,
            Brief,
            AiAnalysis,
            StageEvent,
            Note,
            Assignment,
            EstimateOverride,
        ],
    )
