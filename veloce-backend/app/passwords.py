import bcrypt


def hash_password(password: str) -> str:
    pw = password[:72].encode("utf-8")
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain[:72].encode("utf-8"),
            hashed.encode("ascii"),
        )
    except (ValueError, TypeError):
        return False
