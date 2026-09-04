import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.prediction import PredictionRecord
from app.models.user import User
from app.schemas.prediction import PredictionOutput, ProfileInput
from app.schemas.user import UserStats
from app.services.prediction_engine.registry import get_prediction_model

HISTORY_LIMIT = 50


def run_prediction(input_data: ProfileInput) -> PredictionOutput:
    """Runs whichever prediction model is currently active. No DB access."""
    model = get_prediction_model()
    return model.predict(input_data)


def save_prediction(db: Session, *, user: User, input_data: ProfileInput, output: PredictionOutput) -> PredictionRecord:
    top_confidence = max((d.probability for d in output.diet_probabilities), default=0.0)
    record = PredictionRecord(
        user_id=user.id,
        input_payload=input_data.model_dump(),
        output_payload=output.model_dump(),
        recommended_diet=output.recommended_diet,
        top_confidence=top_confidence,
        metabolic_score=output.metabolic_score,
        total_calories=output.nutrition_totals.calories,
        model_name=output.model_name,
        model_version=output.model_version,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_history(db: Session, *, user: User, limit: int = HISTORY_LIMIT) -> list[PredictionRecord]:
    stmt = (
        select(PredictionRecord)
        .where(PredictionRecord.user_id == user.id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def get_prediction_by_id(db: Session, *, user: User, prediction_id: uuid.UUID) -> PredictionRecord | None:
    stmt = select(PredictionRecord).where(
        PredictionRecord.id == prediction_id, PredictionRecord.user_id == user.id
    )
    return db.scalars(stmt).first()


def clear_history(db: Session, *, user: User) -> None:
    for record in get_history(db, user=user, limit=10_000):
        db.delete(record)
    db.commit()


def get_user_stats(db: Session, *, user: User) -> UserStats:
    stmt = select(
        func.count(PredictionRecord.id),
        func.max(PredictionRecord.top_confidence),
        func.avg(PredictionRecord.metabolic_score),
    ).where(PredictionRecord.user_id == user.id)
    total, best_confidence, avg_metabolic_score = db.execute(stmt).one()
    return UserStats(
        total_predictions=total or 0,
        best_confidence=round(best_confidence, 1) if best_confidence is not None else 0.0,
        avg_metabolic_score=round(float(avg_metabolic_score), 1) if avg_metabolic_score is not None else 0.0,
    )
