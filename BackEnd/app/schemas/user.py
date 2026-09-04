import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    is_verified: bool
    created_at: datetime


class UserStats(BaseModel):
    total_predictions: int
    best_confidence: float = 0.0
    avg_metabolic_score: float = 0.0
