from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.ai_analysis import AiAnalysis
from app.models.assignment import Assignment
from app.models.brief import Brief
from app.models.stage_event import StageEvent
from app.schemas.briefs import IntakeCreate
from app.services.openai_analyze import analyze_brief
from app.util.serialize import analysis_to_out, brief_to_out


async def create_brief_from_intake(
    data: IntakeCreate,
    *,
    actor_label: str,
) -> tuple[Brief, AiAnalysis | None, str | None]:
    now = datetime.now(timezone.utc)
    brief = Brief(
        title=data.title,
        description_rich=data.descriptionRich,
        budget_tier=data.budgetTier,
        timeline_urgency=data.timelineUrgency,
        contact_name=data.contactName,
        contact_email=str(data.contactEmail),
        contact_phone=data.contactPhone,
        stage="new",
        submitted_at=now,
    )
    await brief.insert()

    parsed, err = await analyze_brief(
        title=data.title,
        description_rich=data.descriptionRich,
        budget_tier=data.budgetTier,
        timeline_urgency=data.timelineUrgency,
    )

    analysis: AiAnalysis | None = None
    analysis_error: str | None = err
    if parsed:
        analysis = AiAnalysis(
            brief_id=brief.id,  # type: ignore[arg-type]
            features=parsed.features,
            category=parsed.category,
            effort_hours_min=parsed.effort_hours_min,
            effort_hours_max=parsed.effort_hours_max,
            tech_stack=parsed.tech_stack,
            complexity=parsed.complexity,
        )
        await analysis.insert()
        analysis_error = None

    event = StageEvent(
        brief_id=brief.id,  # type: ignore[arg-type]
        from_stage=None,
        to_stage="new",
        at=now,
        actor_user_id=None,
        actor_name=actor_label,
    )
    await event.insert()

    return brief, analysis, analysis_error


def brief_create_response(brief: Brief, analysis: AiAnalysis | None, analysis_error: str | None):
    from app.schemas.intake_response import CreateBriefResponse

    return CreateBriefResponse(
        brief=brief_to_out(brief),
        analysis=analysis_to_out(analysis) if analysis else None,
        analysisError=analysis_error,
    )


async def reviewer_brief_ids(user_id: str) -> list[PydanticObjectId]:
    assigns = await Assignment.find(Assignment.assigned_to_id == user_id).to_list()
    return list({a.brief_id for a in assigns})
