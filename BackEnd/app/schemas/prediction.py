import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# --- Vocabulary the trained models were fit on ---------------------------
# These aren't arbitrary — they're the exact category strings
# diet_recommendation_model.pkl's OneHotEncoder was trained with (see
# BackEnd/app/services/prediction_engine/ml_model.py for how they're
# inspected). Sending anything else for these fields doesn't error (the
# encoder was built with handle_unknown="ignore"), it just contributes no
# signal to the prediction — so keep these Literals in sync with the model
# if it's ever retrained on a different vocabulary.

DiseaseType = Literal["None", "Diabetes", "Hypertension", "Obesity"]
Severity = Literal["None", "Mild", "Moderate", "Severe"]
ActivityLevel = Literal["Sedentary", "Moderate", "Active"]
DietaryRestriction = Literal["None", "Low_Sodium", "Low_Sugar"]
Cuisine = Literal["Indian", "Chinese", "Italian", "Mexican"]

# Foods are filtered against these allergen groups when building the meal
# plan (see ml_model.py's ALLERGENS map) — independent of, and more
# thorough than, the single "Allergies" feature the diet classifier itself
# was trained on.
Allergen = Literal["Milk", "Peanut", "Tree Nut", "Soy", "Egg", "Fish", "Shellfish", "Wheat"]


class ProfileInput(BaseModel):
    """
    Everything the ProfileSetup wizard collects — this is the exact set of
    features diet_recommendation_model.pkl and metabolic_glucose_model.pkl
    were trained on (see ml_model.py for the feature-building code). This
    contract is intentionally tied to this specific model; if the model is
    ever retrained on different inputs, update this schema and ml_model.py
    together.
    """

    age: int = Field(gt=0, le=120)
    gender: Literal["Male", "Female"]
    height: float = Field(gt=0, le=300, description="Height in cm")
    weight: float = Field(gt=0, le=400, description="Weight in kg")

    disease_type: DiseaseType = "None"
    severity: Severity = "None"

    physical_activity_level: ActivityLevel
    weekly_exercise_hours: float = Field(ge=0, le=40)

    daily_caloric_intake: float = Field(gt=0, le=8000, description="Daily calorie target (kcal)")
    cholesterol_mg_dl: float = Field(gt=0, le=500, description="Total cholesterol, mg/dL")
    blood_pressure_mmhg: float = Field(gt=0, le=260, description="Systolic blood pressure, mmHg")
    glucose_mg_dl: float = Field(gt=0, le=500, description="Fasting glucose, mg/dL")

    dietary_restrictions: DietaryRestriction = "None"
    allergies: list[Allergen] = Field(default_factory=list)
    preferred_cuisine: Cuisine

    adherence_to_diet_plan: int = Field(ge=0, le=100, description="Self-rated likelihood of sticking to a plan")
    dietary_nutrient_imbalance_score: int = Field(
        ge=0, le=100, description="Self-rated current diet imbalance (0=balanced, 100=very imbalanced)"
    )


class DietProbability(BaseModel):
    diet: str
    probability: float = Field(description="0-100")


class MealItem(BaseModel):
    meal: Literal["Breakfast", "Lunch", "Snack", "Dinner"]
    food: str
    portion_g: float
    calories: float
    protein: float
    fat: float
    carbohydrates: float
    fiber: float | None = None
    sodium: float | None = None


class NutritionTotals(BaseModel):
    calories: float
    protein: float
    fat: float
    carbohydrates: float
    fiber: float
    sodium: float


class MealCalorieSummary(BaseModel):
    meal: Literal["Breakfast", "Lunch", "Snack", "Dinner"]
    calories: float
    target: float


class PredictionOutput(BaseModel):
    """
    What the model returns: a recommended diet category (with the full
    probability distribution across all classes the classifier knows —
    Balanced / Low_Carb / Low_Sodium), a generated one-day meal plan built
    from that recommendation, and a metabolic model output.

    `metabolic_score` is the second model's raw regression output. Its
    training target/units weren't recoverable from the project files that
    shipped with the model (see ml_model.py) — the value ranges strongly
    resemble fasting glucose in mg/dL, and the file is named accordingly,
    but this is a model estimate, not a validated clinical figure. Surface
    it with that caveat rather than as a diagnosis.
    """

    bmi: float

    recommended_diet: str
    diet_probabilities: list[DietProbability]

    meal_plan: list[MealItem]
    nutrition_totals: NutritionTotals
    meal_calorie_summary: list[MealCalorieSummary]

    metabolic_score: float

    model_name: str
    model_version: str


class PredictionResponse(PredictionOutput):
    """What POST /predictions returns: the prediction plus persistence info."""

    id: uuid.UUID | None = None
    saved: bool = False


class PredictionRecordOut(BaseModel):
    """Lightweight shape for the history list (Profile page)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    recommended_diet: str
    top_confidence: float
    metabolic_score: float
    total_calories: float
    model_name: str
    model_version: str
    created_at: datetime


class PredictionDetailOut(PredictionRecordOut):
    """Full shape for viewing one specific past prediction (Dashboard page)."""

    input: ProfileInput
    output: PredictionOutput
