from pydantic import BaseModel

from app.schemas.briefs import AiAnalysisOut, BriefOut


class CreateBriefResponse(BaseModel):
    brief: BriefOut
    analysis: AiAnalysisOut | None = None
    analysisError: str | None = None
