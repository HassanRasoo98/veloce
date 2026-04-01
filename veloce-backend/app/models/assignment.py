from datetime import datetime

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel


class Assignment(Document):
    brief_id: PydanticObjectId
    assigned_to_id: str
    assigned_to_name: str
    assigned_by_id: str
    assigned_by_name: str
    at: datetime

    class Settings:
        name = "assignments"
        indexes = [
            IndexModel([("brief_id", ASCENDING), ("at", DESCENDING)]),
            IndexModel([("assigned_to_id", ASCENDING)]),
        ]
