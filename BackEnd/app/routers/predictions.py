import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.prediction import (
    PredictionDetailOut,
    PredictionRecordOut,
    PredictionResponse,
    ProfileInput,
)
from app.services import prediction_service
from app.services.prediction_engine.ml_model import MealPlanUnavailableError

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.post("", response_model=PredictionResponse)
def create_prediction(
    payload: ProfileInput,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
) -> PredictionResponse:
    """
    Generates a prediction from the active model (see
    services/prediction_engine/registry.py). Anyone can call this — it's
    only persisted to history if the request is authenticated, mirroring
    the current frontend's "guest can preview, logged-in users get history"
    behavior.
    """
    try:
        output = prediction_service.run_prediction(payload)
    except MealPlanUnavailableError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Not enough foods in the database match your allergy restrictions to "
                "build a full meal plan. Try removing an allergy filter."
            ),
        ) from None

    record = None
    if current_user is not None:
        record = prediction_service.save_prediction(
            db, user=current_user, input_data=payload, output=output
        )

    return PredictionResponse(
        **output.model_dump(),
        id=record.id if record else None,
        saved=record is not None,
    )

@router.get("/history", response_model=list[PredictionRecordOut])
def list_history(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PredictionRecordOut]:
    records = prediction_service.get_history(db, user=current_user, limit=limit)
    return [PredictionRecordOut.model_validate(r) for r in records]


@router.get("/{prediction_id}", response_model=PredictionDetailOut)
def get_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictionDetailOut:
    """
    Fetch one past prediction in full. Useful for a "view details" link from
    the Profile history list — the current frontend navigates to /results
    without state when you click a history row, which shows an empty state;
    wiring that route up to fetch from here is a natural next step.
    """
    record = prediction_service.get_prediction_by_id(db, user=current_user, prediction_id=prediction_id)
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    return PredictionDetailOut(
        id=record.id,
        recommended_diet=record.recommended_diet,
        top_confidence=record.top_confidence,
        metabolic_score=record.metabolic_score,
        total_calories=record.total_calories,
        model_name=record.model_name,
        model_version=record.model_version,
        created_at=record.created_at,
        input=record.input_payload,
        output=record.output_payload,
    )


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    prediction_service.clear_history(db, user=current_user)
