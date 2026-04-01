"""Create default admin and reviewer if missing. Run: PYTHONPATH=. python scripts/seed_users.py"""

import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.db import init_db  # noqa: E402
from app.models.user import User  # noqa: E402
from app.passwords import hash_password  # noqa: E402


async def main() -> None:
    await init_db()

    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@veloce.local").lower()
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "admin123")
    admin_name = os.getenv("SEED_ADMIN_NAME", "Admin User")

    rev_email = os.getenv("SEED_REVIEWER_EMAIL", "reviewer@veloce.local").lower()
    rev_pass = os.getenv("SEED_REVIEWER_PASSWORD", "reviewer123")
    rev_name = os.getenv("SEED_REVIEWER_NAME", "Reviewer User")

    if not await User.find_one(User.email == admin_email):
        await User(
            email=admin_email,
            password_hash=hash_password(admin_pass),
            name=admin_name,
            role="admin",
        ).insert()
        print(f"Created admin: {admin_email}")
    else:
        print(f"Admin exists: {admin_email}")

    if not await User.find_one(User.email == rev_email):
        await User(
            email=rev_email,
            password_hash=hash_password(rev_pass),
            name=rev_name,
            role="reviewer",
        ).insert()
        print(f"Created reviewer: {rev_email}")
    else:
        print(f"Reviewer exists: {rev_email}")


if __name__ == "__main__":
    asyncio.run(main())
