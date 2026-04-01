from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    # str (not EmailStr): dev accounts use .local, which email-validator rejects as reserved.
    email: str = Field(min_length=1, max_length=320)
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
