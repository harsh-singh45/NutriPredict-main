from tests.conftest import signup_and_verify


def test_guest_prediction_is_not_saved(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)

    assert resp.status_code == 200
    body = resp.json()
    assert body["saved"] is False
    assert body["id"] is None
    assert body["model_name"] == "ml"
    assert body["recommended_diet"] in ("Balanced", "Low_Carb", "Low_Sodium")


def test_authenticated_prediction_is_saved(client, auth_headers, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers)

    assert resp.status_code == 200
    body = resp.json()
    assert body["saved"] is True
    assert body["id"] is not None


def test_prediction_returns_full_probability_distribution(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)
    body = resp.json()

    diets = {p["diet"] for p in body["diet_probabilities"]}
    assert diets == {"Balanced", "Low_Carb", "Low_Sodium"}

    total = sum(p["probability"] for p in body["diet_probabilities"])
    assert 99.0 <= total <= 101.0  # should sum to ~100%, allow rounding slack

    top = max(body["diet_probabilities"], key=lambda p: p["probability"])
    assert top["diet"] == body["recommended_diet"]


def test_diabetes_profile_favors_low_carb(client, sample_profile):
    """
    Sanity check that the model responds to clinically meaningful input,
    not just a smoke test that it runs. A severe, sedentary diabetic
    profile should score Low_Carb well above the other two categories —
    this mirrors the model's own training signal (Disease_Type dominates
    feature importance; see the integration notes in ml_model.py).
    """
    profile = {
        **sample_profile,
        "disease_type": "Diabetes",
        "severity": "Severe",
        "physical_activity_level": "Sedentary",
        "weekly_exercise_hours": 0,
        "glucose_mg_dl": 180,
        "dietary_restrictions": "Low_Sugar",
    }
    resp = client.post("/api/v1/predictions", json=profile)
    body = resp.json()

    low_carb = next(p["probability"] for p in body["diet_probabilities"] if p["diet"] == "Low_Carb")
    assert low_carb > 60


def test_meal_plan_covers_all_four_meals(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)
    meals = {item["meal"] for item in resp.json()["meal_plan"]}
    assert meals == {"Breakfast", "Lunch", "Snack", "Dinner"}


def test_meal_plan_has_no_duplicate_foods(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)
    foods = [item["food"] for item in resp.json()["meal_plan"]]
    assert len(foods) == len(set(foods))


def test_meal_plan_respects_allergies(client, sample_profile):
    profile = {**sample_profile, "allergies": ["Fish", "Shellfish", "Milk", "Egg", "Peanut", "Tree Nut", "Soy", "Wheat"]}
    resp = client.post("/api/v1/predictions", json=profile)
    assert resp.status_code == 200  # still succeeds even with every allergen excluded

    foods = " ".join(item["food"].lower() for item in resp.json()["meal_plan"])
    for banned in ["fish", "shrimp", "milk", "cheese", "egg", "peanut", "almond", "soy", "wheat"]:
        assert banned not in foods


def test_nutrition_totals_roughly_match_calorie_target(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)
    totals = resp.json()["nutrition_totals"]
    # Portions are sized against the calorie target per meal; allow some
    # slack for rounding across 12 food items.
    assert abs(totals["calories"] - sample_profile["daily_caloric_intake"]) < 50


def test_bmi_is_computed_correctly(client, sample_profile):
    resp = client.post("/api/v1/predictions", json=sample_profile)
    expected_bmi = round(sample_profile["weight"] / ((sample_profile["height"] / 100) ** 2), 2)
    assert resp.json()["bmi"] == expected_bmi


def test_rejects_invalid_disease_type(client, sample_profile):
    sample_profile["disease_type"] = "Flu"
    resp = client.post("/api/v1/predictions", json=sample_profile)
    assert resp.status_code == 422


def test_rejects_invalid_cuisine(client, sample_profile):
    sample_profile["preferred_cuisine"] = "French"
    resp = client.post("/api/v1/predictions", json=sample_profile)
    assert resp.status_code == 422


def test_rejects_out_of_range_adherence(client, sample_profile):
    sample_profile["adherence_to_diet_plan"] = 150
    resp = client.post("/api/v1/predictions", json=sample_profile)
    assert resp.status_code == 422


def test_rejects_negative_weight(client, sample_profile):
    sample_profile["weight"] = -10
    resp = client.post("/api/v1/predictions", json=sample_profile)
    assert resp.status_code == 422


def test_history_requires_auth(client):
    resp = client.get("/api/v1/predictions/history")
    assert resp.status_code == 401


def test_history_empty_for_new_user(client, auth_headers):
    resp = client.get("/api/v1/predictions/history", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_history_returns_most_recent_first(client, auth_headers, sample_profile):
    client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers)
    client.post("/api/v1/predictions", json={**sample_profile, "preferred_cuisine": "Chinese"}, headers=auth_headers)

    resp = client.get("/api/v1/predictions/history", headers=auth_headers)
    records = resp.json()
    assert len(records) == 2
    # newest first
    assert records[0]["created_at"] >= records[1]["created_at"]


def test_history_is_scoped_per_user(client, sample_profile):
    a = signup_and_verify(client, "A", "a@example.com", "password-a1")
    b = signup_and_verify(client, "B", "b@example.com", "password-b1")
    headers_a = {"Authorization": f"Bearer {a['access_token']}"}
    headers_b = {"Authorization": f"Bearer {b['access_token']}"}

    client.post("/api/v1/predictions", json=sample_profile, headers=headers_a)

    assert len(client.get("/api/v1/predictions/history", headers=headers_a).json()) == 1
    assert len(client.get("/api/v1/predictions/history", headers=headers_b).json()) == 0


def test_get_prediction_detail_returns_full_payload(client, auth_headers, sample_profile):
    created = client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers).json()

    resp = client.get(f"/api/v1/predictions/{created['id']}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["input"]["preferred_cuisine"] == sample_profile["preferred_cuisine"]
    assert len(body["output"]["meal_plan"]) > 0
    assert body["output"]["recommended_diet"] == created["recommended_diet"]


def test_get_prediction_detail_404_for_nonexistent_id(client, auth_headers):
    fake_id = "00000000-0000-0000-0000-000000000000"
    resp = client.get(f"/api/v1/predictions/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_get_prediction_detail_404_for_other_users_prediction(client, sample_profile):
    a = signup_and_verify(client, "A", "a@example.com", "password-a1")
    b = signup_and_verify(client, "B", "b@example.com", "password-b1")
    headers_a = {"Authorization": f"Bearer {a['access_token']}"}
    headers_b = {"Authorization": f"Bearer {b['access_token']}"}

    created = client.post("/api/v1/predictions", json=sample_profile, headers=headers_a).json()

    resp = client.get(f"/api/v1/predictions/{created['id']}", headers=headers_b)
    assert resp.status_code == 404


def test_clear_history_removes_all_predictions(client, auth_headers, sample_profile):
    client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers)
    client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers)

    del_resp = client.delete("/api/v1/predictions/history", headers=auth_headers)
    assert del_resp.status_code == 204

    resp = client.get("/api/v1/predictions/history", headers=auth_headers)
    assert resp.json() == []


def test_user_stats_reflects_saved_predictions(client, auth_headers, sample_profile):
    client.post("/api/v1/predictions", json=sample_profile, headers=auth_headers)
    client.post("/api/v1/predictions", json={**sample_profile, "preferred_cuisine": "Chinese"}, headers=auth_headers)

    resp = client.get("/api/v1/users/me/stats", headers=auth_headers)
    body = resp.json()
    assert body["total_predictions"] == 2
    assert body["best_confidence"] > 0
    assert body["avg_metabolic_score"] > 0


def test_user_stats_zero_for_new_user(client, auth_headers):
    resp = client.get("/api/v1/users/me/stats", headers=auth_headers)
    assert resp.json() == {"total_predictions": 0, "best_confidence": 0.0, "avg_metabolic_score": 0.0}
