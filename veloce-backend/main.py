"""
ASGI entry for Uvicorn.

  uvicorn main:app --reload --port 4000

Or from the veloce-backend directory:

  python main.py
"""

from app.main import app

__all__ = ["app"]


if __name__ == "__main__":
    import uvicorn

    from app.config import settings

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
    )
