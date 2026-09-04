"""
The real prediction model — trained by the ML teammate, replacing the
heuristic placeholder that used to live here.

Two scikit-learn Pipelines (loaded once, in __init__, and cached by the
registry — see registry.py):

  - diet_recommendation_model.pkl: a RandomForestClassifier that predicts
    one of three diet categories (Balanced / Low_Carb / Low_Sodium) from
    the user's health profile, with a full probability distribution across
    all three.
  - metabolic_glucose_model.pkl: a RandomForestRegressor over NHANES-style
    biometric/dietary features. Its exact training target/units weren't
    recoverable from what shipped with the model — the output range
    (~90-140 for the profiles this was tested against) strongly resembles
    fasting glucose in mg/dL, matching the filename, but treat it as a
    model estimate, not a validated clinical figure (see the docstring on
    PredictionOutput.metabolic_score).

The recommended diet category then drives build_meal_plan() (see
features.py) to assemble a full one-day meal plan from the bundled food
database, respecting the user's allergies.

Both .pkl files are scikit-learn Pipelines with their own preprocessing
(imputation, one-hot encoding) baked in — this class just builds the
correctly-shaped input DataFrame and calls .predict()/.predict_proba().
"""
import joblib

from app.core.config import settings
from app.schemas.prediction import PredictionOutput, ProfileInput
from app.services.prediction_engine.base import BasePredictionModel
from app.services.prediction_engine.features import (
    build_diet_features,
    build_meal_plan,
    build_metabolic_features,
    calculate_bmi,
    compute_meal_calorie_summary,
    compute_nutrition_totals,
    load_food_database,
    meal_plan_to_items,
)


class MealPlanUnavailableError(ValueError):
    """Raised when too few foods remain after allergy filtering to build a full plan."""


class MLPredictionModel(BasePredictionModel):
    name = "ml"
    version = "1.0.0"

    def __init__(self) -> None:
        self.diet_model = joblib.load(settings.DIET_MODEL_PATH)
        self.metabolic_model = joblib.load(settings.METABOLIC_MODEL_PATH)
        self.food_db = load_food_database(settings.FOOD_DATABASE_PATH)

    def predict(self, input_data: ProfileInput) -> PredictionOutput:
        # 1. Diet category recommendation, with full probability distribution.
        diet_features = build_diet_features(input_data)
        recommended_diet = str(self.diet_model.predict(diet_features)[0])
        proba = self.diet_model.predict_proba(diet_features)[0]
        diet_probabilities = sorted(
            (
                {"diet": diet_class, "probability": round(float(p) * 100, 1)}
                for diet_class, p in zip(self.diet_model.classes_, proba)
            ),
            key=lambda d: d["probability"],
            reverse=True,
        )

        # 2. Metabolic model output.
        metabolic_features = build_metabolic_features(input_data)
        metabolic_score = round(float(self.metabolic_model.predict(metabolic_features)[0]), 1)

        # 3. Meal plan built around the recommended diet category.
        try:
            plan_df = build_meal_plan(
                self.food_db,
                recommended_diet,
                input_data.daily_caloric_intake,
                input_data.allergies,
            )
        except ValueError as exc:
            raise MealPlanUnavailableError(str(exc)) from exc

        return PredictionOutput(
            bmi=calculate_bmi(input_data.weight, input_data.height),
            recommended_diet=recommended_diet,
            diet_probabilities=diet_probabilities,
            meal_plan=meal_plan_to_items(plan_df),
            nutrition_totals=compute_nutrition_totals(plan_df),
            meal_calorie_summary=compute_meal_calorie_summary(plan_df, input_data.daily_caloric_intake),
            metabolic_score=metabolic_score,
            model_name=self.name,
            model_version=self.version,
        )
