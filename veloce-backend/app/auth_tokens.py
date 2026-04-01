from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings


def create_access_token(*, sub: str, role: str, name: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=settings.jwt_exp_days)
    payload = {"sub": sub, "role": role, "name": name, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
