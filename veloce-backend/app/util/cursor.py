import base64
import json
from datetime import datetime, timezone

from beanie import PydanticObjectId


def encode_cursor(submitted_at: datetime, doc_id: PydanticObjectId) -> str:
    if submitted_at.tzinfo is None:
        submitted_at = submitted_at.replace(tzinfo=timezone.utc)
    payload = {
        "t": submitted_at.astimezone(timezone.utc).isoformat(),
        "id": str(doc_id),
    }
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, PydanticObjectId]:
    pad = "=" * (-len(cursor) % 4)
    raw = base64.urlsafe_b64decode(cursor + pad)
    d = json.loads(raw.decode())
    t = datetime.fromisoformat(d["t"].replace("Z", "+00:00"))
    if t.tzinfo is None:
        t = t.replace(tzinfo=timezone.utc)
    return t.astimezone(timezone.utc), PydanticObjectId(d["id"])
