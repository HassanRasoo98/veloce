from typing import Annotated

from beanie import PydanticObjectId
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_current_user, require_admin
from app.models.ai_analysis import AiAnalysis
from app.models.assignment import Assignment
from app.models.brief import Brief
from app.models.estimate_override import EstimateOverride
from app.models.note import Note
from app.models.stage_event import StageEvent
from app.models.user import User
from app.schemas.briefs import (
    AssignCreate,
    BriefDetailOut,
    BriefListResponse,
    EstimateOverrideCreate,
    NoteCreate,
    StagePatch,
)
from app.schemas.intake_response import CreateBriefResponse
from app.services.brief_pipeline import (
    brief_create_response,
    create_brief_from_intake,
    reviewer_brief_ids,
)
from app.schemas.briefs import IntakeCreate
from app.util.cursor import decode_cursor, encode_cursor
from app.util.serialize import (
    analysis_to_out,
    assignment_to_out,
    brief_to_out,
    note_to_out,
    override_to_out,
    stage_event_to_out,
)

router = APIRouter()


async def _ensure_can_view(user: User, brief: Brief) -> None:
    if user.role == "admin":
        return
    allowed = await reviewer_brief_ids(str(user.id))
    if brief.id not in allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("", response_model=CreateBriefResponse)
async def create_brief_public(body: IntakeCreate) -> CreateBriefResponse:
    brief, analysis, err = await create_brief_from_intake(
        body, actor_label="Public intake"
    )
    return brief_create_response(brief, analysis, err)


@router.get("", response_model=BriefListResponse)
async def list_briefs(
    user: Annotated[User, Depends(get_current_user)],
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
) -> BriefListResponse:
    ands: list[dict] = []
    if user.role == "reviewer":
        ids = await reviewer_brief_ids(str(user.id))
        if not ids:
            return BriefListResponse(items=[], nextCursor=None)
        ands.append({"_id": {"$in": ids}})
    if cursor:
        t, oid = decode_cursor(cursor)
        ands.append(
            {
                "$or": [
                    {"submitted_at": {"$lt": t}},
                    {"$and": [{"submitted_at": t}, {"_id": {"$lt": oid}}]},
                ]
            }
        )
    match: dict = {"$and": ands} if len(ands) > 1 else (ands[0] if ands else {})
    q = Brief.find(match) if match else Brief.find_all()
    rows = await q.sort(-Brief.submitted_at, -Brief.id).limit(limit + 1).to_list()
    next_c: str | None = None
    if len(rows) > limit:
        rows = rows[:limit]
        last = rows[-1]
        next_c = encode_cursor(last.submitted_at, last.id)  # type: ignore[arg-type]
    return BriefListResponse(
        items=[brief_to_out(b) for b in rows],
        nextCursor=next_c,
    )


@router.get("/{brief_id}", response_model=BriefDetailOut)
async def get_brief(
    brief_id: str,
    user: Annotated[User, Depends(get_current_user)],
) -> BriefDetailOut:
    try:
        oid = PydanticObjectId(brief_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Not found") from e
    brief = await Brief.get(oid)
    if not brief:
        raise HTTPException(status_code=404, detail="Not found")
    await _ensure_can_view(user, brief)

    analysis = await AiAnalysis.find_one(AiAnalysis.brief_id == oid)
    events = (
        await StageEvent.find(StageEvent.brief_id == oid)
        .sort(-StageEvent.at)
        .to_list()
    )
    notes = (
        await Note.find(Note.brief_id == oid).sort(-Note.at).to_list()
    )
    assigns = (
        await Assignment.find(Assignment.brief_id == oid)
        .sort(-Assignment.at)
        .to_list()
    )
    override = await EstimateOverride.find_one(EstimateOverride.brief_id == oid)

    return BriefDetailOut(
        brief=brief_to_out(brief),
        analysis=analysis_to_out(analysis) if analysis else None,
        analysisError=None,
        stageEvents=[stage_event_to_out(e) for e in events],
        notes=[note_to_out(n) for n in notes],
        assignments=[assignment_to_out(a) for a in assigns],
        estimateOverride=override_to_out(override) if override else None,
    )


@router.patch("/{brief_id}/stage")
async def patch_stage(
    brief_id: str,
    body: StagePatch,
    user: Annotated[User, Depends(get_current_user)],
):
    try:
        oid = PydanticObjectId(brief_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Not found") from e
    brief = await Brief.get(oid)
    if not brief:
        raise HTTPException(status_code=404, detail="Not found")
    await _ensure_can_view(user, brief)
    if brief.stage == body.toStage:
        return {"ok": True, "brief": brief_to_out(brief)}
    from_stage = brief.stage
    brief.stage = body.toStage
    await brief.save()
    ev = StageEvent(
        brief_id=oid,
        from_stage=from_stage,
        to_stage=body.toStage,
        at=datetime.now(timezone.utc),
        actor_user_id=str(user.id),
        actor_name=user.name,
    )
    await ev.insert()
    return {"ok": True, "brief": brief_to_out(brief)}


@router.post("/{brief_id}/notes")
async def post_note(
    brief_id: str,
    body: NoteCreate,
    user: Annotated[User, Depends(get_current_user)],
):
    try:
        oid = PydanticObjectId(brief_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Not found") from e
    brief = await Brief.get(oid)
    if not brief:
        raise HTTPException(status_code=404, detail="Not found")
    await _ensure_can_view(user, brief)
    if body.parentId:
        try:
            pid = PydanticObjectId(body.parentId)
        except Exception as e:
            raise HTTPException(status_code=400, detail="Invalid parentId") from e
        parent = await Note.get(pid)
        if not parent or parent.brief_id != oid:
            raise HTTPException(status_code=400, detail="Invalid parent note")
    n = Note(
        brief_id=oid,
        parent_id=body.parentId,
        author_user_id=str(user.id),
        author_name=user.name,
        body=body.body,
        at=datetime.now(timezone.utc),
    )
    await n.insert()
    return note_to_out(n)


@router.post("/{brief_id}/estimate-override")
async def post_override(
    brief_id: str,
    body: EstimateOverrideCreate,
    user: Annotated[User, Depends(get_current_user)],
):
    try:
        oid = PydanticObjectId(brief_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Not found") from e
    brief = await Brief.get(oid)
    if not brief:
        raise HTTPException(status_code=404, detail="Not found")
    await _ensure_can_view(user, brief)
    existing = await EstimateOverride.find_one(EstimateOverride.brief_id == oid)
    if existing:
        existing.min_hours = body.minHours
        existing.max_hours = body.maxHours
        existing.reason = body.reason
        existing.at = datetime.now(timezone.utc)
        existing.by_user_id = str(user.id)
        existing.by_name = user.name
        await existing.save()
        return override_to_out(existing)
    o = EstimateOverride(
        brief_id=oid,
        min_hours=body.minHours,
        max_hours=body.maxHours,
        reason=body.reason,
        at=datetime.now(timezone.utc),
        by_user_id=str(user.id),
        by_name=user.name,
    )
    await o.insert()
    return override_to_out(o)


@router.post("/{brief_id}/assign")
async def post_assign(
    brief_id: str,
    body: AssignCreate,
    admin: Annotated[User, Depends(require_admin)],
):
    try:
        oid = PydanticObjectId(brief_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Not found") from e
    brief = await Brief.get(oid)
    if not brief:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        assignee_oid = PydanticObjectId(body.assignedToUserId)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user id") from e
    assignee = await User.get(assignee_oid)
    if not assignee or assignee.role != "reviewer":
        raise HTTPException(status_code=400, detail="Target must be a reviewer")
    a = Assignment(
        brief_id=oid,
        assigned_to_id=str(assignee.id),
        assigned_to_name=assignee.name,
        assigned_by_id=str(admin.id),
        assigned_by_name=admin.name,
        at=datetime.now(timezone.utc),
    )
    await a.insert()
    return assignment_to_out(a)
