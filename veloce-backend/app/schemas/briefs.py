from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

BudgetTier = Literal["under_10k", "10k_25k", "25k_50k", "50k_100k", "100k_plus"]
TimelineUrgency = Literal["flexible", "standard", "urgent", "critical"]
PipelineStage = Literal["new", "under_review", "proposal_sent", "won", "archived"]
ProjectCategory = Literal["Web App", "Mobile", "AI/ML", "Automation", "Integration"]


class IntakeCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=3)
    descriptionRich: str = Field(min_length=20)
    budgetTier: BudgetTier
    timelineUrgency: TimelineUrgency
    contactName: str = Field(min_length=2)
    contactEmail: EmailStr
    contactPhone: str | None = None

    @field_validator("contactPhone", mode="before")
    @classmethod
    def empty_phone_none(cls, v: object) -> object:
        if v == "" or v is None:
            return None
        return v


class StagePatch(BaseModel):
    toStage: PipelineStage


class NoteCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    parentId: str | None = None
    body: str = Field(min_length=1)


class EstimateOverrideCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    minHours: int = Field(gt=0)
    maxHours: int = Field(gt=0)
    reason: str = Field(min_length=3)

    @model_validator(mode="after")
    def max_gte_min(self) -> EstimateOverrideCreate:
        if self.maxHours < self.minHours:
            raise ValueError("maxHours must be >= minHours")
        return self


class AssignCreate(BaseModel):
    assignedToUserId: str


class BriefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    descriptionRich: str
    budgetTier: BudgetTier
    timelineUrgency: TimelineUrgency
    contactName: str
    contactEmail: str
    contactPhone: str | None = None
    stage: PipelineStage
    submittedAt: str


class AiAnalysisOut(BaseModel):
    briefId: str
    features: list[str]
    category: ProjectCategory
    effortHoursMin: int
    effortHoursMax: int
    techStack: list[str]
    complexity: Literal[1, 2, 3, 4, 5]


class StageEventOut(BaseModel):
    id: str
    briefId: str
    fromStage: PipelineStage | None
    toStage: PipelineStage
    at: str
    actorName: str


class NoteOut(BaseModel):
    id: str
    briefId: str
    parentId: str | None
    authorName: str
    body: str
    at: str


class AssignmentOut(BaseModel):
    id: str
    briefId: str
    assignedToId: str
    assignedToName: str
    assignedByName: str
    at: str


class EstimateOverrideOut(BaseModel):
    briefId: str
    minHours: int
    maxHours: int
    reason: str
    at: str
    byName: str


class BriefDetailOut(BaseModel):
    brief: BriefOut
    analysis: AiAnalysisOut | None = None
    analysisError: str | None = None
    stageEvents: list[StageEventOut]
    notes: list[NoteOut]
    assignments: list[AssignmentOut]
    estimateOverride: EstimateOverrideOut | None = None


class BriefListResponse(BaseModel):
    items: list[BriefOut]
    nextCursor: str | None = None
