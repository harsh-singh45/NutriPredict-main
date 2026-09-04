import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, HeartPulse, Activity, Utensils, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { generatePrediction } from '../utils/predictions';

const DISEASE_TYPES = ['None', 'Diabetes', 'Hypertension', 'Obesity'];
const SEVERITIES = ['Mild', 'Moderate', 'Severe'];
const ACTIVITY_LEVELS = [
  { value: 'Sedentary', label: 'Sedentary', hint: 'Little to no exercise' },
  { value: 'Moderate', label: 'Moderate', hint: 'A few workouts a week' },
  { value: 'Active', label: 'Active', hint: 'Exercise most days' },
];
const DIETARY_RESTRICTIONS = ['None', 'Low_Sodium', 'Low_Sugar'];
const ALLERGENS = ['Milk', 'Peanut', 'Tree Nut', 'Soy', 'Egg', 'Fish', 'Shellfish', 'Wheat'];
const CUISINES = ['Indian', 'Chinese', 'Italian', 'Mexican'];

const ACTIVITY_MULTIPLIER = { Sedentary: 1.2, Moderate: 1.55, Active: 1.725 };

function estimateDailyCalories({ age, gender, height, weight, physicalActivityLevel }) {
  if (!age || !height || !weight || !physicalActivityLevel) return '';
  const a = Number(age);
  const h = Number(height);
  const w = Number(weight);
  // Mifflin-St Jeor
  const bmr = gender === 'Male' ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIER[physicalActivityLevel];
  return Math.round(tdee / 10) * 10; // round to nearest 10 kcal
}

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    age: '', gender: 'Select', height: '', weight: '',
    diseaseType: 'None', severity: 'Moderate',
    cholesterol: '', bloodPressure: '', glucose: '',
    physicalActivityLevel: '', weeklyExerciseHours: 3,
    dailyCaloricIntake: '',
    adherenceToDietPlan: 75, nutrientImbalanceScore: 30,
    dietaryRestrictions: 'None', allergies: [], preferredCuisine: '',
  });
  const [caloriesAuto, setCaloriesAuto] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');

  // Keep the suggested calorie target in sync with the inputs that drive
  // it, until the user manually edits the field themselves.
  useEffect(() => {
    if (!caloriesAuto) return;
    const suggestion = estimateDailyCalories(data);
    if (suggestion !== '') {
      setData((d) => ({ ...d, dailyCaloricIntake: suggestion }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.age, data.gender, data.height, data.weight, data.physicalActivityLevel, caloriesAuto]);

  const canNext = () => {
    if (step === 0) return data.age && data.gender !== 'Select' && data.height && data.weight;
    if (step === 1) return data.cholesterol && data.bloodPressure && data.glucose;
    if (step === 2) return data.physicalActivityLevel && data.weeklyExerciseHours !== '' && data.dailyCaloricIntake;
    if (step === 3) return data.preferredCuisine !== '';
    return true;
  };

  const toggleAllergy = (allergen) => {
    setData((d) => ({
      ...d,
      allergies: d.allergies.includes(allergen)
        ? d.allergies.filter((a) => a !== allergen)
        : [...d.allergies, allergen],
    }));
  };

  const handlePredict = async () => {
    setPredictError('');
    setIsPredicting(true);
    try {
      const results = await generatePrediction(data);
      navigate('/results', { state: { formData: data, results } });
    } catch (err) {
      setPredictError(err.message || 'Something went wrong generating your prediction. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-4 pt-12 pb-16">
      <div className="text-center mb-8">
        <span className="section-label">Step {step + 1} of 4</span>
        <h2 className="mt-3 text-3xl font-semibold text-[#1D2A22]">
          Predict Your <span className="text-[#1F5A3F]">Diet Outcome</span>
        </h2>
        <p className="text-[#6B7280] mt-2">A few details for your personalized recommendation and meal plan</p>
      </div>

      {/* 4-Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {[0, 1, 2, 3].map((s, index) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
              step >= s ? 'bg-[#1F5A3F] text-white shadow-md' : 'bg-[#E7E3D8] text-[#6B7280]'
            }`}>
              {s + 1}
            </div>
            {index < 3 && (
              <div className={`w-12 sm:w-16 h-px transition-colors duration-300 ${
                step > s ? 'bg-[#1F5A3F]' : 'bg-[#E7E3D8]'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="surface-card p-8 sm:p-10">

        {/* STEP 0: Personal Details */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-up">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-[#1D2A22]">
              <User className="text-[#1F5A3F] w-5 h-5" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Age" type="number" value={data.age} onChange={(v) => setData({ ...data, age: v })} />
              <Select label="Gender" value={data.gender} onChange={(v) => setData({ ...data, gender: v })} options={['Select', 'Male', 'Female']} />
              <Input label="Height (cm)" type="number" value={data.height} onChange={(v) => setData({ ...data, height: v })} />
              <Input label="Weight (kg)" type="number" value={data.weight} onChange={(v) => setData({ ...data, weight: v })} />
            </div>
          </div>
        )}

        {/* STEP 1: Health Profile */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-[#1D2A22]">
              <HeartPulse className="text-[#1F5A3F] w-5 h-5" /> Health Profile
            </h3>

            <div>
              <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Existing Condition</label>
              <div className="flex flex-wrap gap-2">
                {DISEASE_TYPES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setData({ ...data, diseaseType: d })}
                    className={`px-4 py-2.5 rounded-xl text-sm border transition-all ${
                      data.diseaseType === d
                        ? 'bg-[#1F5A3F]/10 border-[#1F5A3F] text-[#1F5A3F] font-semibold'
                        : 'bg-[#F7F6F1] border-[#E7E3D8] text-[#6B7280] hover:border-[#1F5A3F]/30'
                    }`}
                  >
                    {d === 'None' ? 'None' : d}
                  </button>
                ))}
              </div>
            </div>

            {data.diseaseType !== 'None' && (
              <div className="animate-fade-up">
                <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Severity</label>
                <div className="flex flex-wrap gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setData({ ...data, severity: s })}
                      className={`px-4 py-2.5 rounded-xl text-sm border transition-all ${
                        data.severity === s
                          ? 'bg-[#1F5A3F]/10 border-[#1F5A3F] text-[#1F5A3F] font-semibold'
                          : 'bg-[#F7F6F1] border-[#E7E3D8] text-[#6B7280] hover:border-[#1F5A3F]/30'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Input label="Cholesterol (mg/dL)" type="number" value={data.cholesterol} onChange={(v) => setData({ ...data, cholesterol: v })} placeholder="180" />
              <Input label="Blood Pressure (mmHg)" type="number" value={data.bloodPressure} onChange={(v) => setData({ ...data, bloodPressure: v })} placeholder="120" />
              <Input label="Glucose (mg/dL)" type="number" value={data.glucose} onChange={(v) => setData({ ...data, glucose: v })} placeholder="90" />
            </div>
          </div>
        )}

        {/* STEP 2: Lifestyle & Goals */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-up">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-[#1D2A22]">
              <Activity className="text-[#1F5A3F] w-5 h-5" /> Lifestyle &amp; Goals
            </h3>

            <div>
              <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Physical Activity Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ACTIVITY_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setData({ ...data, physicalActivityLevel: opt.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      data.physicalActivityLevel === opt.value
                        ? 'border-[#1F5A3F] bg-[#1F5A3F]/5 shadow-[0_0_0_3px_rgba(31,90,63,0.08)]'
                        : 'border-[#E7E3D8] bg-[#F7F6F1] hover:border-[#1F5A3F]/30'
                    }`}
                  >
                    <div className="font-semibold text-[#1D2A22]">{opt.label}</div>
                    <div className="text-xs text-[#6B7280] mt-1">{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Weekly Exercise Hours"
              type="number"
              value={data.weeklyExerciseHours}
              onChange={(v) => setData({ ...data, weeklyExerciseHours: v })}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#1D2A22]">Daily Calorie Target</label>
                {!caloriesAuto && (
                  <button
                    onClick={() => setCaloriesAuto(true)}
                    className="text-xs font-semibold text-[#1F5A3F] hover:underline"
                  >
                    Use suggested
                  </button>
                )}
              </div>
              <input
                type="number"
                value={data.dailyCaloricIntake}
                onChange={(e) => {
                  setCaloriesAuto(false);
                  setData({ ...data, dailyCaloricIntake: e.target.value });
                }}
                className="w-full bg-[#F7F6F1] p-3.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F5A3F] transition-shadow text-[#1D2A22]"
              />
              <p className="text-xs text-[#9CA3AF] mt-1.5">
                {caloriesAuto ? 'Suggested from your details — edit any time.' : 'Custom value.'}
              </p>
            </div>

            <RangeSlider
              label="Adherence to Diet Plan"
              value={data.adherenceToDietPlan} min={0} max={100}
              onChange={(v) => setData({ ...data, adherenceToDietPlan: parseInt(v) })}
              valueLabel={`${data.adherenceToDietPlan}%`} minLabel="Unlikely" maxLabel="Very likely"
            />

            <RangeSlider
              label="Current Diet Imbalance"
              value={data.nutrientImbalanceScore} min={0} max={100}
              onChange={(v) => setData({ ...data, nutrientImbalanceScore: parseInt(v) })}
              valueLabel={`${data.nutrientImbalanceScore}/100`} minLabel="Balanced" maxLabel="Very imbalanced"
            />
          </div>
        )}

        {/* STEP 3: Preferences */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-up">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-[#1D2A22]">
              <Utensils className="text-[#1F5A3F] w-5 h-5" /> Preferences
            </h3>

            <div>
              <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_RESTRICTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setData({ ...data, dietaryRestrictions: r })}
                    className={`px-4 py-2.5 rounded-xl text-sm border transition-all ${
                      data.dietaryRestrictions === r
                        ? 'bg-[#1F5A3F]/10 border-[#1F5A3F] text-[#1F5A3F] font-semibold'
                        : 'bg-[#F7F6F1] border-[#E7E3D8] text-[#6B7280] hover:border-[#1F5A3F]/30'
                    }`}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Allergies</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAllergy(a)}
                    className={`px-4 py-2.5 rounded-xl text-sm border transition-all ${
                      data.allergies.includes(a)
                        ? 'bg-[#1F5A3F]/10 border-[#1F5A3F] text-[#1F5A3F] font-semibold'
                        : 'bg-[#F7F6F1] border-[#E7E3D8] text-[#6B7280] hover:border-[#1F5A3F]/30'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1D2A22] mb-3 block">Preferred Cuisine</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CUISINES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setData({ ...data, preferredCuisine: c })}
                    className={`p-4 rounded-xl border text-center font-semibold transition-all ${
                      data.preferredCuisine === c
                        ? 'border-[#1F5A3F] bg-[#1F5A3F]/5 text-[#1F5A3F] shadow-[0_0_0_3px_rgba(31,90,63,0.08)]'
                        : 'border-[#E7E3D8] bg-[#F7F6F1] text-[#1D2A22] hover:border-[#1F5A3F]/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Prediction error */}
        {predictError && step === 3 && (
          <div className="mt-6 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{predictError}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-[#E7E3D8]">
          <button disabled={step === 0 || isPredicting} onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 text-[#6B7280] hover:text-[#1D2A22] disabled:opacity-0 transition-all font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            disabled={!canNext() || isPredicting}
            onClick={() => (step < 3 ? setStep((s) => s + 1) : handlePredict())}
            className="bg-[#1F5A3F] text-white px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)] disabled:bg-[#A9C6B8] disabled:text-white/80 transition-all"
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                {step === 3 ? 'Generate Prediction' : 'Next'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper components ---------------------------------------------------

function Input({ label, type, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1D2A22]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#F7F6F1] p-3.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F5A3F] transition-shadow text-[#1D2A22]"
        placeholder={placeholder || '0'}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[#1D2A22]">{label}</label>
      <select
        className="bg-[#F7F6F1] p-3.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F5A3F] transition-shadow text-[#1D2A22]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function RangeSlider({ label, value, min, max, onChange, valueLabel, minLabel, maxLabel }) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[15px] font-semibold text-[#1D2A22]">{label}</label>
        <span className="text-[15px] font-semibold text-[#1F5A3F]">{valueLabel}</span>
      </div>

      <input
        type="range"
        min={min} max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ background: `linear-gradient(to right, #1F5A3F ${percentage}%, #E7E3D8 ${percentage}%)` }}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
                   focus:outline-none focus:ring-4 focus:ring-[#1F5A3F]/20
                   [&::-webkit-slider-thumb]:appearance-none
                   [&::-webkit-slider-thumb]:w-5
                   [&::-webkit-slider-thumb]:h-5
                   [&::-webkit-slider-thumb]:bg-[#1F5A3F]
                   [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:shadow-[0_2px_5px_rgba(0,0,0,0.2)]
                   [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:transition-transform
                   hover:[&::-webkit-slider-thumb]:scale-110
                   [&::-moz-range-thumb]:w-5
                   [&::-moz-range-thumb]:h-5
                   [&::-moz-range-thumb]:bg-[#1F5A3F]
                   [&::-moz-range-thumb]:border-none
                   [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:shadow-[0_2px_5px_rgba(0,0,0,0.2)]
                   [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:transition-transform
                   hover:[&::-moz-range-thumb]:scale-110"
      />

      <div className="flex justify-between items-center text-[13px] text-[#6B7280] font-medium mt-2">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
