"""
Selects the active prediction model based on settings.PREDICTION_MODEL.

This is the plug-in seam: BasePredictionModel is the interface every model
implements, and nothing outside this package needs to know which concrete
class is active. Right now there's exactly one entry — the real trained
model (MLPredictionModel) — after the heuristic placeholder that used to
live here was removed in favor of it. Add a new model (e.g. a retrained
v2) by implementing BasePredictionModel and adding it to _REGISTRY; no
other code changes required.
"""
from functools import lru_cache

from app.core.config import settings
from app.services.prediction_engine.base import BasePredictionModel
from app.services.prediction_engine.ml_model import MLPredictionModel

_REGISTRY: dict[str, type[BasePredictionModel]] = {
    "ml": MLPredictionModel,
}


@lru_cache
def get_prediction_model() -> BasePredictionModel:
    """
    Returns the active model instance, constructed once and cached for the
    lifetime of the process — important here specifically, since __init__
    loads two scikit-learn models and a food database from disk, which you
    don't want to repeat on every request.
    """
    model_cls = _REGISTRY.get(settings.PREDICTION_MODEL)
    if model_cls is None:
        available = ", ".join(sorted(_REGISTRY))
        raise ValueError(
            f"Unknown PREDICTION_MODEL={settings.PREDICTION_MODEL!r}. "
            f"Available models: {available}"
        )
    return model_cls()
