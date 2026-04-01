from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth_tokens import create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.passwords import verify_password
from app.schemas.auth import LoginRequest, LoginResponse, MeResponse

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    user = await User.find_one(User.email == str(body.email).strip().lower())
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(sub=str(user.id), role=user.role, name=user.name)
    return LoginResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
async def me(user: Annotated[User, Depends(get_current_user)]) -> MeResponse:
    return MeResponse(id=str(user.id), email=user.email, name=user.name, role=user.role)
