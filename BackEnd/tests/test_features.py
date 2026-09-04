import pytest

from app.core.config import settings
from app.services.prediction_engine.features import (
    ALLERGENS,
    build_diet_features,
    build_meal_plan,
    build_metabolic_features,
    calculate_bmi,
    filter_allergies,
    load_food_database,
    score_food,
)
from app.schemas.prediction import ProfileInput


@pytest.fixture(scope="module")
def food_db():
    return load_food_database(settings.FOOD_DATABASE_PATH)


def test_calculate_bmi():
    # 70kg at 175cm -> 70 / 1.75^2 = 22.86
    assert calculate_bmi(70, 175) == 22.86


def test_food_database_has_no_duplicate_descriptions(food_db):
    assert food_db["description"].duplicated().sum() == 0


def test_food_database_has_no_zero_or_missing_calories(food_db):
    assert (food_db["Calories"] > 0).all()
    assert food_db["Calories"].notna().all()


def test_filter_allergies_removes_matching_foods(food_db):
    filtered = filter_allergies(food_db, ["Fish"])
    remaining_names = " ".join(filtered["description"].str.lower())
    for word in ALLERGENS["Fish"]:
        assert word not in remaining_names


def test_filter_allergies_with_no_allergies_returns_everything(food_db):
    filtered = filter_allergies(food_db, [])
    assert len(filtered) == len(food_db)


def test_filter_allergies_unknown_allergen_is_a_no_op(food_db):
    filtered = filter_allergies(food_db, ["Not A Real Allergen"])
    assert len(filtered) == len(food_db)


def test_score_food_rewards_low_carb_for_low_carb_diet(food_db):
    low_carb_food = food_db.loc[food_db["Carbohydrates"].idxmin()]
    high_carb_food = food_db.loc[food_db["Carbohydrates"].idxmax()]
    assert score_food(low_carb_food, "Low_Carb") >= score_food(high_carb_food, "Low_Carb")


def test_score_food_rewards_low_sodium_for_low_sodium_diet(food_db):
    low_sodium = food_db.dropna(subset=["Sodium"]).loc[food_db["Sodium"].idxmin()]
    high_sodium = food_db.dropna(subset=["Sodium"]).loc[food_db["Sodium"].idxmax()]
    assert score_food(low_sodium, "Low_Sodium") >= score_food(high_sodium, "Low_Sodium")


def test_build_meal_plan_produces_twelve_items_by_default(food_db):
    plan = build_meal_plan(food_db, "Balanced", 2000, [])
    assert len(plan) == 12  # 4 meals x 3 foods


def test_build_meal_plan_raises_when_allergies_exhaust_the_database():
    """A tiny synthetic database (below the foods_per_meal * 4 floor) should
    raise cleanly rather than silently return a broken/short plan."""
    import pandas as pd

    tiny_db = pd.DataFrame(
        [
            {
                "fdc_id": 1,
                "description": "Milk, whole",
                "data_type": "foundation_food",
                "food_category_id": 1,
                "Calories": 60,
                "Carbohydrates": 5,
                "Fat": 3,
                "Fiber": 0,
                "Protein": 3,
                "Sodium": 40,
            }
        ]
    )
    with pytest.raises(ValueError):
        build_meal_plan(tiny_db, "Balanced", 2000, ["Milk"])


def test_build_diet_features_maps_profile_fields(sample_profile):
    profile = ProfileInput(**sample_profile)
    row = build_diet_features(profile).iloc[0]

    assert row["Age"] == profile.age
    assert row["Gender"] == profile.gender
    assert row["BMI"] == calculate_bmi(profile.weight, profile.height)
    assert row["Disease_Type"] == profile.disease_type
    assert row["Allergies"] == "None"  # empty list -> "None" sentinel


def test_build_diet_features_joins_multiple_allergies(sample_profile):
    profile = ProfileInput(**{**sample_profile, "allergies": ["Milk", "Egg"]})
    row = build_diet_features(profile).iloc[0]
    assert row["Allergies"] == "Milk, Egg"


def test_build_metabolic_features_maps_gender_to_nhanes_codes(sample_profile):
    male = ProfileInput(**{**sample_profile, "gender": "Male"})
    female = ProfileInput(**{**sample_profile, "gender": "Female"})

    assert build_metabolic_features(male).iloc[0]["RIAGENDR"] == 1
    assert build_metabolic_features(female).iloc[0]["RIAGENDR"] == 2
