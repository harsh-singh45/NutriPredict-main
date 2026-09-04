"""
The plug-in seam for prediction models.

Every model — today's heuristic placeholder, and your teammate's trained
model later — implements `BasePredictionModel`. Nothing outside this
`prediction_engine` package needs to know which one is active; the router
and service layer only ever talk to `BasePredictionModel`.

To swap in a real model:
  1. Implement it in ml_model.py (see the template/instructions there).
  2. Register it in registry.py.
  3. Set PREDICTION_MODEL=ml in your .env.
No other code changes required.
"""
from abc import ABC, abstractmethod

from app.schemas.prediction import PredictionOutput, ProfileInput


class BasePredictionModel(ABC):
    """Common interface for anything that turns a ProfileInput into a PredictionOutput."""

    #: Short machine-readable identifier, e.g. "heuristic", "ml".
    #: Stored on every PredictionRecord so you can tell which engine
    #: produced a given result and compare models against each other later.
    name: str = "base"

    #: Free-form version string for the specific model/weights in use,
    #: e.g. "1.0.0" or a training run ID like "xgb-2026-08-30".
    version: str = "0.0.0"

    @abstractmethod
    def predict(self, input_data: ProfileInput) -> PredictionOutput:
        """
        Run inference for a single user profile and return a fully-formed
        PredictionOutput. Implementations should be deterministic given the
        same input+model version where possible, and should NOT perform any
        database access — persistence is handled by the caller
        (see services/prediction_service.py).
        """
        raise NotImplementedError
