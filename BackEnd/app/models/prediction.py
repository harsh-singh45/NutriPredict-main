import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PredictionRecord(Base):
    """
    One row per generated prediction.

    `input_payload` and `output_payload` store the full request/response as
    JSONB so the schema never has to change as the prediction model evolves
    (new input fields, new outputs, etc.) — and so this table can double as
    a training/evaluation dataset if the model is retrained later. The
    handful of scalar columns alongside them are denormalized purely so the
    Profile page's stats and history list can be computed with a plain
    indexed SQL query instead of unpacking JSON.
    """

    __tablename__ = "prediction_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Full fidelity copies of what was sent in and what came back.
    input_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    output_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Denormalized summary fields for fast list/stat queries.
    recommended_diet: Mapped[str] = mapped_column(String(50), nullable=False)
    top_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    metabolic_score: Mapped[float] = mapped_column(Float, nullable=False)
    total_calories: Mapped[float] = mapped_column(Float, nullable=False)

    # Which prediction engine produced this row — useful once there's more
    # than one trained model version in play.
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    user: Mapped["User"] = relationship(back_populates="predictions")
