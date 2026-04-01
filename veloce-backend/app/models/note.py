from datetime import datetime

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, DESCENDING, IndexModel


class Note(Document):
    brief_id: PydanticObjectId
    parent_id: str | None = None
    author_user_id: str
    author_name: str
    body: str
    at: datetime

    class Settings:
        name = "notes"
        indexes = [
            IndexModel([("brief_id", ASCENDING), ("at", DESCENDING)]),
        ]
