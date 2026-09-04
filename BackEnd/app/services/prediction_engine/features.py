"""
Feature-building and meal-planning logic for the trained diet/metabolic
models, factored out of ml_model.py so it's independently testable and so
an offline retraining/evaluation script could import the exact same logic
this API uses at inference time.

This is a faithful port of the original Streamlit prototype (ML_Model/app.py)
— same feature derivations, same meal-scoring heuristic, same fixed defaults
for values the app never collected from the user (e.g. HDL/LDL/triglycerides
default to population-typical constants because only total cholesterol is
collected). Where this differs from app.py, it's noted inline.
"""
import re

import numpy as np
import pandas as pd

from app.schemas.prediction import (
    MealCalorieSummary,
    MealItem,
    NutritionTotals,
    ProfileInput,
)

DIET_FEATURES = [
    "Age", "Gender", "Weight_kg", "Height_cm", "BMI", "Disease_Type", "Severity",
    "Physical_Activity_Level", "Daily_Caloric_Intake", "Cholesterol_mg/dL",
    "Blood_Pressure_mmHg", "Glucose_mg/dL", "Dietary_Restrictions", "Allergies",
    "Preferred_Cuisine", "Weekly_Exercise_Hours", "Adherence_to_Diet_Plan",
    "Dietary_Nutrient_Imbalance_Score",
]

METABOLIC_FEATURES = [
    "RIDAGEYR", "RIAGENDR", "BMXWT", "BMXHT", "BMXBMI", "DR1TKCAL", "DR1TPROT",
    "DR1TCARB", "DR1TTFAT", "DR1TFIBE", "LBXTC", "LBDHDD", "LBDLDL", "LBXTR",
]

NUTRITION_COLS = ["Calories", "Protein", "Fat", "Carbohydrates", "Fiber", "Sodium"]
MEAL_RATIOS = {"Breakfast": 0.25, "Lunch": 0.35, "Snack": 0.10, "Dinner": 0.30}

# Food-name substrings used to filter the meal plan away from each allergen
# group. Independent of (and more thorough than) the single free-text
# "Allergies" feature the diet classifier itself was trained on — see the
# module docstring in ml_model.py for why that ML feature barely matters.
ALLERGENS: dict[str, list[str]] = {
    "Milk": ["milk", "cheese", "yogurt", "butter", "cream", "whey"],
    "Peanut": ["peanut", "groundnut"],
    "Tree Nut": ["almond", "cashew", "walnut", "pistachio", "hazelnut"],
    "Soy": ["soy", "soya", "tofu"],
    "Egg": ["egg"],
    "Fish": ["fish", "salmon", "tuna", "sardine"],
    "Shellfish": ["shrimp", "prawn", "crab", "lobster"],
    "Wheat": ["wheat", "bread", "flour", "pasta"],
}


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    return round(weight_kg / ((height_cm / 100) ** 2), 2)


def load_food_database(csv_path: str) -> pd.DataFrame:
    """Loads and cleans the food nutrition table once, at model init time."""
    df = pd.read_csv(csv_path, low_memory=False)
    for col in NUTRITION_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df[df.Calories.notna() & (df.Calories > 0)]
    df = df[df.Protein.notna() & df.Fat.notna() & df.Carbohydrates.notna()]
    # The source data has ~40% duplicate rows (same food description, a
    # different fdc_id — different USDA sample/extraction of the same
    # item). Left as-is, these show up as the same food appearing twice
    # within one meal; keep just the first occurrence of each description.
    df = df.drop_duplicates(subset="description", keep="first")
    return df.reset_index(drop=True)


def build_diet_features(input_data: ProfileInput) -> pd.DataFrame:
    bmi = calculate_bmi(input_data.weight, input_data.height)
    row = {
        "Age": input_data.age,
        "Gender": input_data.gender,
        "Weight_kg": input_data.weight,
        "Height_cm": input_data.height,
        "BMI": bmi,
        "Disease_Type": input_data.disease_type,
        "Severity": input_data.severity,
        "Physical_Activity_Level": input_data.physical_activity_level,
        "Daily_Caloric_Intake": input_data.daily_caloric_intake,
        "Cholesterol_mg/dL": input_data.cholesterol_mg_dl,
        "Blood_Pressure_mmHg": input_data.blood_pressure_mmhg,
        "Glucose_mg/dL": input_data.glucose_mg_dl,
        "Dietary_Restrictions": input_data.dietary_restrictions,
        "Allergies": ", ".join(input_data.allergies) if input_data.allergies else "None",
        "Preferred_Cuisine": input_data.preferred_cuisine,
        "Weekly_Exercise_Hours": input_data.weekly_exercise_hours,
        "Adherence_to_Diet_Plan": input_data.adherence_to_diet_plan,
        "Dietary_Nutrient_Imbalance_Score": input_data.dietary_nutrient_imbalance_score,
    }
    return pd.DataFrame([row], columns=DIET_FEATURES)


def build_metabolic_features(input_data: ProfileInput) -> pd.DataFrame:
    """
    Derives the NHANES-style features the metabolic model expects.
    Macro grams (protein/carb/fat) are estimated from the calorie target
    using fixed ratios, and HDL/LDL/triglycerides default to
    population-typical constants — this mirrors the original prototype
    exactly, which only ever collected total cholesterol from the user.
    """
    bmi = calculate_bmi(input_data.weight, input_data.height)
    calories = input_data.daily_caloric_intake
    row = {
        "RIDAGEYR": input_data.age,
        "RIAGENDR": 1 if input_data.gender == "Male" else 2,
        "BMXWT": input_data.weight,
        "BMXHT": input_data.height,
        "BMXBMI": bmi,
        "DR1TKCAL": calories,
        "DR1TPROT": max(0.8 * input_data.weight, 1),
        "DR1TCARB": max(0.45 * calories / 4, 1),
        "DR1TTFAT": max(0.28 * calories / 9, 1),
        "DR1TFIBE": 30.0,
        "LBXTC": input_data.cholesterol_mg_dl,
        "LBDHDD": 50.0,
        "LBDLDL": 115.0,
        "LBXTR": 125.0,
    }
    return pd.DataFrame([row], columns=METABOLIC_FEATURES)


def filter_allergies(food_db: pd.DataFrame, allergies: list[str]) -> pd.DataFrame:
    out = food_db.copy()
    for allergen in allergies:
        patterns = ALLERGENS.get(allergen, [])
        if not patterns:
            continue
        pattern = "|".join(re.escape(word) for word in patterns)
        out = out[~out.description.astype(str).str.contains(pattern, case=False, na=False)]
    return out.reset_index(drop=True)


def score_food(row: pd.Series, diet: str) -> float:
    carbs = float(row.Carbohydrates)
    protein = float(row.Protein)
    fat = float(row.Fat)
    fiber = 0 if pd.isna(row.Fiber) else float(row.Fiber)
    sodium = 0 if pd.isna(row.Sodium) else float(row.Sodium)

    if diet == "Low_Carb":
        carb_score = 50 if carbs <= 10 else 35 if carbs <= 20 else 20 if carbs <= 40 else 5 if carbs <= 60 else 0
        return carb_score + min(protein, 30) + min(fiber * 2, 15)

    if diet == "Low_Sodium":
        sodium_score = 50 if sodium <= 140 else 35 if sodium <= 300 else 20 if sodium <= 500 else 5 if sodium <= 700 else 0
        return sodium_score + min(protein, 30) + min(fiber * 2, 15)

    # "Balanced" (or any other/unknown category)
    return (
        min(protein * 1.5, 30)
        + min(fiber * 2, 20)
        + (20 if 10 <= carbs <= 60 else 0)
        + (15 if 5 <= fat <= 30 else 0)
        + (10 if sodium <= 500 else 0)
    )


def build_meal_plan(
    food_db: pd.DataFrame, diet: str, calories: float, allergies: list[str], foods_per_meal: int = 3
) -> pd.DataFrame:
    safe = filter_allergies(food_db, allergies)
    if len(safe) < foods_per_meal * 4:
        raise ValueError("Not enough foods remain in the database after allergy filtering.")

    plan: list[dict] = []
    used: set = set()

    for meal, ratio in MEAL_RATIOS.items():
        target = calories * ratio
        candidates = safe[~safe.fdc_id.isin(used)].copy()
        candidates["score"] = candidates.apply(lambda r: score_food(r, diet), axis=1)
        candidates["dist"] = (candidates.Calories - target / foods_per_meal).abs()
        candidates["rank"] = candidates.score - candidates.dist / max(target / foods_per_meal, 1) * 20
        selected = candidates.sort_values("rank", ascending=False).head(foods_per_meal)

        remaining = target
        for i, (_, r) in enumerate(selected.iterrows()):
            is_last = i == foods_per_meal - 1
            portion = (remaining / r.Calories * 100) if is_last else ((target / foods_per_meal) / r.Calories * 100)
            portion = float(np.clip(portion, 20, 500))
            factor = portion / 100
            cal = float(r.Calories) * factor
            remaining -= cal
            used.add(r.fdc_id)

            plan.append(
                {
                    "Meal": meal,
                    "Food": r.description,
                    "Portion_g": round(portion, 1),
                    "Calories": round(cal, 1),
                    "Protein": round(r.Protein * factor, 1),
                    "Fat": round(r.Fat * factor, 1),
                    "Carbohydrates": round(r.Carbohydrates * factor, 1),
                    "Fiber": None if pd.isna(r.Fiber) else round(r.Fiber * factor, 1),
                    "Sodium": None if pd.isna(r.Sodium) else round(r.Sodium * factor, 1),
                }
            )

    return pd.DataFrame(plan)


def meal_plan_to_items(plan_df: pd.DataFrame) -> list[MealItem]:
    def _clean(value):
        return None if pd.isna(value) else float(value)

    return [
        MealItem(
            meal=row.Meal,
            food=row.Food,
            portion_g=row.Portion_g,
            calories=row.Calories,
            protein=row.Protein,
            fat=row.Fat,
            carbohydrates=row.Carbohydrates,
            fiber=_clean(row.Fiber),
            sodium=_clean(row.Sodium),
        )
        for row in plan_df.itertuples(index=False)
    ]


def compute_nutrition_totals(plan_df: pd.DataFrame) -> NutritionTotals:
    totals = plan_df[NUTRITION_COLS].sum(skipna=True)
    return NutritionTotals(
        calories=round(float(totals.Calories), 1),
        protein=round(float(totals.Protein), 1),
        fat=round(float(totals.Fat), 1),
        carbohydrates=round(float(totals.Carbohydrates), 1),
        fiber=round(float(totals.Fiber), 1),
        sodium=round(float(totals.Sodium), 1),
    )


def compute_meal_calorie_summary(plan_df: pd.DataFrame, calories: float) -> list[MealCalorieSummary]:
    by_meal = plan_df.groupby("Meal", as_index=False).Calories.sum()
    targets = {meal: calories * ratio for meal, ratio in MEAL_RATIOS.items()}
    return [
        MealCalorieSummary(meal=row.Meal, calories=round(float(row.Calories), 1), target=round(targets[row.Meal], 1))
        for row in by_meal.itertuples(index=False)
    ]
