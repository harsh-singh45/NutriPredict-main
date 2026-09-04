import { apiRequest } from './api';
import { getToken } from './auth';

// --- Request/response mapping helpers -------------------------------------
// The backend uses snake_case (matches Python/Pydantic convention); the UI
// components use camelCase. Rather than touch every component, we translate
// at this boundary so the rest of the app is unaffected by which language
// is on the other end.

function toApiProfile(formData) {
  return {
    age: Number(formData.age),
    gender: formData.gender,
    height: Number(formData.height),
    weight: Number(formData.weight),
    disease_type: formData.diseaseType,
    severity: formData.severity,
    physical_activity_level: formData.physicalActivityLevel,
    weekly_exercise_hours: Number(formData.weeklyExerciseHours),
    daily_caloric_intake: Number(formData.dailyCaloricIntake),
    cholesterol_mg_dl: Number(formData.cholesterol),
    blood_pressure_mmhg: Number(formData.bloodPressure),
    glucose_mg_dl: Number(formData.glucose),
    dietary_restrictions: formData.dietaryRestrictions,
    allergies: formData.allergies || [],
    preferred_cuisine: formData.preferredCuisine,
    adherence_to_diet_plan: Number(formData.adherenceToDietPlan),
    dietary_nutrient_imbalance_score: Number(formData.nutrientImbalanceScore),
  };
}

function fromApiProfile(input) {
  return {
    age: input.age,
    gender: input.gender,
    height: input.height,
    weight: input.weight,
    diseaseType: input.disease_type,
    severity: input.severity,
    physicalActivityLevel: input.physical_activity_level,
    weeklyExerciseHours: input.weekly_exercise_hours,
    dailyCaloricIntake: input.daily_caloric_intake,
    cholesterol: input.cholesterol_mg_dl,
    bloodPressure: input.blood_pressure_mmhg,
    glucose: input.glucose_mg_dl,
    dietaryRestrictions: input.dietary_restrictions,
    allergies: input.allergies || [],
    preferredCuisine: input.preferred_cuisine,
    adherenceToDietPlan: input.adherence_to_diet_plan,
    nutrientImbalanceScore: input.dietary_nutrient_imbalance_score,
  };
}

function fromApiOutput(output) {
  return {
    bmi: output.bmi,
    recommendedDiet: output.recommended_diet,
    dietProbabilities: output.diet_probabilities.map((p) => ({ diet: p.diet, probability: p.probability })),
    mealPlan: output.meal_plan.map((item) => ({
      meal: item.meal,
      food: item.food,
      portionG: item.portion_g,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbohydrates: item.carbohydrates,
      fiber: item.fiber,
      sodium: item.sodium,
    })),
    nutritionTotals: {
      calories: output.nutrition_totals.calories,
      protein: output.nutrition_totals.protein,
      fat: output.nutrition_totals.fat,
      carbohydrates: output.nutrition_totals.carbohydrates,
      fiber: output.nutrition_totals.fiber,
      sodium: output.nutrition_totals.sodium,
    },
    mealCalorieSummary: output.meal_calorie_summary.map((m) => ({
      meal: m.meal,
      calories: m.calories,
      target: m.target,
    })),
    metabolicScore: output.metabolic_score,
    modelName: output.model_name,
    modelVersion: output.model_version,
  };
}

function formatDate(isoString) {
  return new Date(isoString)
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(',', ' at');
}

function fromApiHistoryRecord(record) {
  return {
    id: record.id,
    date: formatDate(record.created_at),
    recommendedDiet: record.recommended_diet,
    topConfidence: record.top_confidence,
    metabolicScore: record.metabolic_score,
    totalCalories: record.total_calories,
    modelName: record.model_name,
    modelVersion: record.model_version,
  };
}

// --- Public API --------------------------------------------------------

/**
 * Runs a prediction. Works whether or not the user is logged in — if they
 * are, it's saved to their history server-side automatically.
 */
export async function generatePrediction(formData) {
  const token = getToken();
  const output = await apiRequest('/predictions', {
    method: 'POST',
    body: toApiProfile(formData),
    token: token || undefined,
  });
  return { id: output.id, saved: output.saved, ...fromApiOutput(output) };
}

/** Fetches one saved prediction in full — used for "view details" from history. */
export async function getPredictionDetail(id) {
  const token = getToken();
  const detail = await apiRequest(`/predictions/${id}`, { token });
  return { formData: fromApiProfile(detail.input), results: fromApiOutput(detail.output) };
}

/** Most recent predictions for the logged-in user, newest first. */
export async function getHistory(limit = 50) {
  const token = getToken();
  const records = await apiRequest(`/predictions/history?limit=${limit}`, { token });
  return records.map(fromApiHistoryRecord);
}

/** { totalPredictions, bestConfidence, avgMetabolicScore } for the logged-in user. */
export async function getUserStats() {
  const token = getToken();
  const stats = await apiRequest('/users/me/stats', { token });
  return {
    totalPredictions: stats.total_predictions,
    bestConfidence: stats.best_confidence,
    avgMetabolicScore: stats.avg_metabolic_score,
  };
}

export async function clearHistory() {
  const token = getToken();
  await apiRequest('/predictions/history', { method: 'DELETE', token });
}
