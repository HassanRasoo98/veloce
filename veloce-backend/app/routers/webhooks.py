import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.config import settings
from app.schemas.briefs import IntakeCreate
from app.schemas.intake_response import CreateBriefResponse
from app.services.brief_pipeline import brief_create_response, create_brief_from_intake

logger = logging.getLogger(__name__)

router = APIRouter()


def _verify_hmac(raw_body: bytes, header_val: str) -> bool:
    digest = hmac.new(
        settings.webhook_hmac_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    expected = f"sha256={digest}"
    a = header_val.strip()
    return hmac.compare_digest(a, expected)


@router.post("/intake", response_model=CreateBriefResponse)
async def webhook_intake(request: Request) -> CreateBriefResponse:
    raw = await request.body()
    sig = request.headers.get("X-Signature") or request.headers.get("x-signature") or ""
    if not _verify_hmac(raw, sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature",
        )
    try:
        data = json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.warning("Webhook bad JSON: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON") from e
    try:
        intake = IntakeCreate.model_validate(data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    brief, analysis, err = await create_brief_from_intake(intake, actor_label="Webhook")
    return brief_create_response(brief, analysis, err)
