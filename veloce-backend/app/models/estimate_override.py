from datetime import datetime

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, IndexModel


class EstimateOverride(Document):
    brief_id: PydanticObjectId
    min_hours: int
    max_hours: int
    reason: str
    at: datetime
    by_user_id: str
    by_name: str

    class Settings:
        name = "estimateoverrides"
        indexes = [
            IndexModel([("brief_id", ASCENDING)], unique=True),
        ]
