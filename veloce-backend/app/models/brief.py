from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel

PipelineStage = Literal["new", "under_review", "proposal_sent", "won", "archived"]
BudgetTier = Literal["under_10k", "10k_25k", "25k_50k", "50k_100k", "100k_plus"]
TimelineUrgency = Literal["flexible", "standard", "urgent", "critical"]


class Brief(Document):
    title: str
    description_rich: str
    budget_tier: BudgetTier
    timeline_urgency: TimelineUrgency
    contact_name: str
    contact_email: str
    contact_phone: str | None = None
    stage: PipelineStage = "new"
    submitted_at: datetime

    class Settings:
        name = "briefs"
        indexes = [
            IndexModel([("stage", ASCENDING), ("submitted_at", DESCENDING)]),
            IndexModel([("submitted_at", DESCENDING)]),
        ]
