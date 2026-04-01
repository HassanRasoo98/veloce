from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("")
async def list_users(
    user: Annotated[User, Depends(get_current_user)],
    role: Literal["admin", "reviewer"] | None = Query(None),
):
    if role == "reviewer":
        users = await User.find(User.role == "reviewer").sort(+User.email).to_list()
        return [
            {"id": str(u.id), "email": u.email, "name": u.name, "role": u.role}
            for u in users
        ]
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only",
        )
    users = await User.find_all().sort(+User.email).to_list()
    return [
        {"id": str(u.id), "email": u.email, "name": u.name, "role": u.role}
        for u in users
    ]
