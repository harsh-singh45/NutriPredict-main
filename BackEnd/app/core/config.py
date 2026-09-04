"""
Centralized application configuration.

Everything environment-specific (DB connection, secrets, which prediction
model is active) is read from environment variables here, and nowhere else
in the codebase. See .env.example for the full list of supported variables.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---
    ENV: str = "development"
    APP_NAME: str = "NutriPredict API"
    API_PREFIX: str = "/api/v1"

    # --- Database ---
    # Standard SQLAlchemy Postgres URL, e.g.
    # postgresql+psycopg2://user:password@localhost:5432/nutripredict
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/nutripredict"

    # --- Auth ---
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days, matches a "remember me" style demo login

    # --- CORS ---
    # Comma-separated list of allowed origins, e.g.
    # "http://localhost:5173,https://app.nutripredict.com"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5175,http://127.0.0.1:5173"

    # --- Frontend ---
    # Used to build links inside emails (e.g. the password reset link).
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Email ---
    # "console" (default — logs instead of sending, see services/email/)
    # "smtp" once services/email/smtp_sender.py is filled in and registered
    # SMTP_HOST: str = "smtp.gmail.com"
    # SMTP_PORT: int = 587
    # SMTP_USERNAME: str = ""
    # SMTP_PASSWORD: str = ""
    # EMAIL_BACKEND: str = "smtp"
    # EMAIL_FROM_ADDRESS: str = ""
    # --- Email ---
    EMAIL_BACKEND: str = "elastic"
    ELASTIC_EMAIL_API_KEY: str = ""
    EMAIL_FROM_ADDRESS: str = ""

    # --- Password reset ---
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Prediction engine ---
    # Selects which BasePredictionModel implementation is active.
    # Registered in app/services/prediction_engine/registry.py.
    PREDICTION_MODEL: str = "ml"

    # Paths to the trained model artifacts, bundled with the backend under
    # app/ml_assets/. Defaults are computed relative to this settings file
    # so the app works out of the box; override via env vars to point at a
    # different location in production (e.g. a volume mount).
    DIET_MODEL_PATH: str = str(Path(__file__).resolve().parent.parent / "ml_assets" / "diet_recommendation_model.pkl")
    METABOLIC_MODEL_PATH: str = str(
        Path(__file__).resolve().parent.parent / "ml_assets" / "metabolic_glucose_model.pkl"
    )
    FOOD_DATABASE_PATH: str = str(
        Path(__file__).resolve().parent.parent / "ml_assets" / "processed_food_nutrition.csv"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached so Settings() is only constructed once per process."""
    return Settings()


settings = get_settings()
