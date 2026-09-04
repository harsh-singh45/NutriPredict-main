import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, predictions, users

# Without this, INFO-level logs (including the console email sender's
# "here's the password reset link" output) are silently dropped — Python's
# root logger defaults to WARNING. This is what makes the reset link
# actually visible in the terminal running `uvicorn` during local dev.
logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for NutriPredict — AI-powered nutrition outcome prediction.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(predictions.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["health"])
def health_check() -> dict:
    """Liveness/readiness probe — doesn't touch the DB on purpose, keep it fast."""
    return {"status": "ok"}
