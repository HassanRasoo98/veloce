from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel

PipelineStage = Literal["new", "under_review", "proposal_sent", "won", "archived"]


class StageEvent(Document):
    brief_id: PydanticObjectId
    from_stage: PipelineStage | None = None
    to_stage: PipelineStage
    at: datetime
    actor_user_id: str | None = None
    actor_name: str

    class Settings:
        name = "stageevents"
        indexes = [
            IndexModel([("brief_id", ASCENDING), ("at", DESCENDING)]),
        ]
