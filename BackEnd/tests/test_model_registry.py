import pytest

from app.core.config import settings
from app.schemas.prediction import (
    MealCalorieSummary,
    NutritionTotals,
    PredictionOutput,
    ProfileInput,
)
from app.services.prediction_engine import registry
from app.services.prediction_engine.base import BasePredictionModel
from app.services.prediction_engine.ml_model import MLPredictionModel


@pytest.fixture(autouse=True)
def _reset_registry_state():
    """Every test gets a clean lru_cache and PREDICTION_MODEL setting, so
    tests that swap models don't bleed into each other or into other test
    modules."""
    original = settings.PREDICTION_MODEL
    registry.get_prediction_model.cache_clear()
    yield
    settings.PREDICTION_MODEL = original
    registry.get_prediction_model.cache_clear()


def test_base_model_cannot_be_instantiated_directly():
    with pytest.raises(TypeError):
        BasePredictionModel()


def test_default_registry_returns_ml_model():
    model = registry.get_prediction_model()
    assert isinstance(model, MLPredictionModel)
    assert model.name == "ml"


def test_registry_is_cached_returns_same_instance():
    """Important beyond the usual caching concern: __init__ loads two
    scikit-learn models and a food database from disk, which should only
    ever happen once per process."""
    first = registry.get_prediction_model()
    second = registry.get_prediction_model()
    assert first is second


def test_registry_raises_for_unknown_model_name():
    settings.PREDICTION_MODEL = "does-not-exist"
    registry.get_prediction_model.cache_clear()

    with pytest.raises(ValueError, match="Unknown PREDICTION_MODEL"):
        registry.get_prediction_model()


def test_a_new_model_can_be_registered_and_selected():
    """
    Proves that adding a model to _REGISTRY and flipping the env var is
    genuinely all it takes to switch which model serves predictions — no
    router or service code needs to change. Uses a lightweight dummy here
    so the test doesn't depend on a second real trained model existing.
    """

    class DummyModel(BasePredictionModel):
        name = "dummy"
        version = "9.9.9"

        def predict(self, input_data: ProfileInput) -> PredictionOutput:
            return PredictionOutput(
                bmi=22.0,
                recommended_diet="Balanced",
                diet_probabilities=[],
                meal_plan=[],
                nutrition_totals=NutritionTotals(calories=0, protein=0, fat=0, carbohydrates=0, fiber=0, sodium=0),
                meal_calorie_summary=[],
                metabolic_score=0,
                model_name=self.name,
                model_version=self.version,
            )

    registry._REGISTRY["dummy"] = DummyModel
    try:
        settings.PREDICTION_MODEL = "dummy"
        registry.get_prediction_model.cache_clear()

        model = registry.get_prediction_model()
        assert isinstance(model, DummyModel)
        assert model.name == "dummy"
    finally:
        del registry._REGISTRY["dummy"]


def test_ml_model_is_deterministic(sample_profile):
    model = registry.get_prediction_model()
    input_data = ProfileInput(**sample_profile)

    first = model.predict(input_data)
    second = model.predict(input_data)

    assert first.recommended_diet == second.recommended_diet
    assert first.diet_probabilities == second.diet_probabilities
    assert first.metabolic_score == second.metabolic_score


def test_ml_model_diet_probabilities_are_known_classes(sample_profile):
    model = registry.get_prediction_model()
    output = model.predict(ProfileInput(**sample_profile))

    diets = {p.diet for p in output.diet_probabilities}
    assert diets == {"Balanced", "Low_Carb", "Low_Sodium"}


def test_ml_model_meal_plan_matches_recommended_diet_context(sample_profile):
    """Not asserting exact food names (that would break the moment the food
    database changes) — just that a plan comes back shaped correctly."""
    model = registry.get_prediction_model()
    output = model.predict(ProfileInput(**sample_profile))

    assert len(output.meal_plan) > 0
    assert output.nutrition_totals.calories > 0
