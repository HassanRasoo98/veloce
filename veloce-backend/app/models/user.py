from typing import Literal

from beanie import Document
from pymongo import ASCENDING, IndexModel


class User(Document):
    email: str
    password_hash: str
    name: str
    role: Literal["admin", "reviewer"]

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
        ]
