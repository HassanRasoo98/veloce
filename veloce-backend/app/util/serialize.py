from app.models.ai_analysis import AiAnalysis
from app.models.assignment import Assignment
from app.models.brief import Brief
from app.models.estimate_override import EstimateOverride
from app.models.note import Note
from app.models.stage_event import StageEvent
from app.schemas.briefs import (
    AiAnalysisOut,
    AssignmentOut,
    BriefOut,
    EstimateOverrideOut,
    NoteOut,
    StageEventOut,
)
from app.util.timefmt import iso_z


def brief_to_out(b: Brief) -> BriefOut:
    return BriefOut(
        id=str(b.id),
        title=b.title,
        descriptionRich=b.description_rich,
        budgetTier=b.budget_tier,
        timelineUrgency=b.timeline_urgency,
        contactName=b.contact_name,
        contactEmail=b.contact_email,
        contactPhone=b.contact_phone,
        stage=b.stage,
        submittedAt=iso_z(b.submitted_at),
    )


def analysis_to_out(a: AiAnalysis) -> AiAnalysisOut:
    return AiAnalysisOut(
        briefId=str(a.brief_id),
        features=a.features,
        category=a.category,
        effortHoursMin=a.effort_hours_min,
        effortHoursMax=a.effort_hours_max,
        techStack=a.tech_stack,
        complexity=a.complexity,
    )


def stage_event_to_out(e: StageEvent) -> StageEventOut:
    return StageEventOut(
        id=str(e.id),
        briefId=str(e.brief_id),
        fromStage=e.from_stage,
        toStage=e.to_stage,
        at=iso_z(e.at),
        actorName=e.actor_name,
    )


def note_to_out(n: Note) -> NoteOut:
    return NoteOut(
        id=str(n.id),
        briefId=str(n.brief_id),
        parentId=n.parent_id,
        authorName=n.author_name,
        body=n.body,
        at=iso_z(n.at),
    )


def assignment_to_out(a: Assignment) -> AssignmentOut:
    return AssignmentOut(
        id=str(a.id),
        briefId=str(a.brief_id),
        assignedToId=a.assigned_to_id,
        assignedToName=a.assigned_to_name,
        assignedByName=a.assigned_by_name,
        at=iso_z(a.at),
    )


def override_to_out(o: EstimateOverride) -> EstimateOverrideOut:
    return EstimateOverrideOut(
        briefId=str(o.brief_id),
        minHours=o.min_hours,
        maxHours=o.max_hours,
        reason=o.reason,
        at=iso_z(o.at),
        byName=o.by_name,
    )
