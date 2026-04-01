from typing import Literal

from beanie import Document, PydanticObjectId
from pymongo import ASCENDING, IndexModel

ProjectCategory = Literal["Web App", "Mobile", "AI/ML", "Automation", "Integration"]


class AiAnalysis(Document):
    brief_id: PydanticObjectId
    features: list[str]
    category: ProjectCategory
    effort_hours_min: int
    effort_hours_max: int
    tech_stack: list[str]
    complexity: Literal[1, 2, 3, 4, 5]

    class Settings:
        name = "aianalyses"
        indexes = [
            IndexModel([("brief_id", ASCENDING)], unique=True),
        ]
