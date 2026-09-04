import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Salad, Gauge, Flame, Target, ArrowLeft, AlertCircle, Download, Loader2,
  Info, Coffee, UtensilsCrossed, Apple, Moon,
} from 'lucide-react';
import { downloadPredictionReportPdf } from '../utils/pdfReport';

const DIET_LABELS = {
  Balanced: 'Balanced Diet',
  Low_Carb: 'Low-Carb Diet',
  Low_Sodium: 'Low-Sodium Diet',
};

const MEAL_ICONS = { Breakfast: Coffee, Lunch: UtensilsCrossed, Snack: Apple, Dinner: Moon };
const MEAL_ORDER = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const MACRO_COLORS = { protein: '#1F5A3F', fat: '#C08A2E', carbohydrates: '#2E6E8E' };

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#2E6E8E' };
  if (bmi < 25) return { label: 'Normal', color: '#1F5A3F' };
  if (bmi < 30) return { label: 'Overweight', color: '#C08A2E' };
  return { label: 'Obese', color: '#B8532F' };
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const probabilityChartRef = useRef(null);
  const calorieChartRef = useRef(null);

  const { formData, results } = location.state || {};

  if (!formData || !results) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
        <h2 className="text-2xl font-semibold text-[#1D2A22] mb-2">No Prediction Data Found</h2>
        <p className="text-[#6B7280] mb-6">You need to run a prediction first.</p>
        <button onClick={() => navigate('/predict')} className="px-6 py-3 bg-[#1F5A3F] text-white rounded-xl font-semibold hover:bg-[#123D2A] transition-colors">
          Go to Predict Wizard
        </button>
      </div>
    );
  }

  const dietLabel = DIET_LABELS[results.recommendedDiet] || results.recommendedDiet;
  const bmiInfo = bmiCategory(results.bmi);
  const topConfidence = Math.max(...results.dietProbabilities.map((d) => d.probability));

  const mealsGrouped = MEAL_ORDER.map((meal) => ({
    meal,
    items: results.mealPlan.filter((item) => item.meal === meal),
    summary: results.mealCalorieSummary.find((m) => m.meal === meal),
  })).filter((g) => g.items.length > 0);

  const macroData = [
    { name: 'Protein', value: results.nutritionTotals.protein, key: 'protein' },
    { name: 'Fat', value: results.nutritionTotals.fat, key: 'fat' },
    { name: 'Carbs', value: results.nutritionTotals.carbohydrates, key: 'carbohydrates' },
  ];

  const handleDownloadReport = async () => {
    setDownloadError('');
    setIsDownloading(true);
    try {
      await downloadPredictionReportPdf({
        dietLabel,
        formData,
        results,
        refs: { probabilityChart: probabilityChartRef, calorieChart: calorieChartRef },
      });
    } catch {
      setDownloadError('Could not generate the PDF report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 space-y-8 pt-10 pb-16">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button onClick={() => navigate('/predict')} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1D2A22] mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Setup
          </button>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#1D2A22]">
            Recommended: <span className="text-[#1F5A3F]">{dietLabel}</span>
          </h1>
          <p className="text-[#6B7280] mt-1">AI-recommended nutrition plan based on your health profile.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex surface-card p-1 rounded-xl">
            {['overview', 'meal plan', 'nutrition'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  activeTab === tab ? 'bg-[#1F5A3F] text-white shadow-sm' : 'text-[#6B7280] hover:bg-black/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F5A3F] text-white text-sm font-semibold hover:bg-[#123D2A] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDownloading ? 'Generating…' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* TOP METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Gauge />} title="BMI" value={results.bmi} subtitle={bmiInfo.label} color={bmiInfo.color} />
        <MetricCard icon={<Target />} title="Confidence" value={`${topConfidence}%`} subtitle={dietLabel} color="#1F5A3F" />
        <MetricCard icon={<Flame />} title="Daily Calories" value={`${Math.round(results.nutritionTotals.calories)}`} subtitle={`Target: ${formData.dailyCaloricIntake}`} color="#C08A2E" />
        <MetricCard icon={<Salad />} title="Est. Glucose" value={`${results.metabolicScore}`} subtitle="mg/dL (model estimate)" color="#7C5CBF" />
      </div>

      {/* Metabolic disclaimer */}
      <div className="bg-[#F7F6F1] border border-[#E7E3D8] rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-[#6B7280]">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#9CA3AF]" />
        <span>
          The glucose estimate is an output of a trained model, not a lab result or medical diagnosis — use it as
          one signal among many, not a substitute for professional advice.
        </span>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div ref={probabilityChartRef} className="surface-card p-6">
            <h3 className="font-semibold text-[#1D2A22] text-lg">Diet Fit Confidence</h3>
            <p className="text-xs text-[#6B7280] mb-4">How well each diet category matches your profile.</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={results.dietProbabilities} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7E3D8" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="diet" tickFormatter={(d) => DIET_LABELS[d] || d} stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} width={110} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Confidence']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E7E3D8' }}
                />
                <Bar dataKey="probability" radius={[0, 6, 6, 0]}>
                  {results.dietProbabilities.map((entry) => (
                    <Cell key={entry.diet} fill={entry.diet === results.recommendedDiet ? '#1F5A3F' : '#DDE8D8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div ref={calorieChartRef} className="surface-card p-6">
            <h3 className="font-semibold text-[#1D2A22] text-lg">Calories by Meal</h3>
            <p className="text-xs text-[#6B7280] mb-4">Planned calories vs. your per-meal target.</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={results.mealCalorieSummary} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E3D8" />
                <XAxis dataKey="meal" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E7E3D8' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="target" name="Target" fill="#E7E3D8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="calories" name="Planned" fill="#1F5A3F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 surface-card p-6">
            <h3 className="font-semibold text-[#1D2A22] text-lg mb-2">Why this recommendation</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              {recommendationExplanation(formData, results)}
            </p>
          </div>
        </div>
      )}

      {/* MEAL PLAN TAB */}
      {activeTab === 'meal plan' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {mealsGrouped.map(({ meal, items, summary }) => {
            const Icon = MEAL_ICONS[meal] || Salad;
            return (
              <div key={meal} className="surface-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#1F5A3F]/10 flex items-center justify-center text-[#1F5A3F]">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="font-semibold text-[#1D2A22]">{meal}</h3>
                  </div>
                  {summary && (
                    <span className="text-xs font-semibold text-[#6B7280]">
                      {Math.round(summary.calories)} / {Math.round(summary.target)} kcal
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0EEE5] last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1D2A22] leading-snug">{item.food}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{item.portionG}g · P {item.protein}g · F {item.fat}g · C {item.carbohydrates}g</p>
                      </div>
                      <span className="text-sm font-semibold text-[#1F5A3F] shrink-0">{Math.round(item.calories)} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NUTRITION TAB */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 surface-card p-6">
            <h3 className="font-semibold text-[#1D2A22] text-lg mb-4">Nutrition Totals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NutritionStat label="Calories" value={`${Math.round(results.nutritionTotals.calories)}`} unit="kcal" />
              <NutritionStat label="Protein" value={results.nutritionTotals.protein} unit="g" />
              <NutritionStat label="Fat" value={results.nutritionTotals.fat} unit="g" />
              <NutritionStat label="Carbohydrates" value={results.nutritionTotals.carbohydrates} unit="g" />
              <NutritionStat label="Fiber" value={results.nutritionTotals.fiber} unit="g" />
              <NutritionStat label="Sodium" value={Math.round(results.nutritionTotals.sodium)} unit="mg" />
            </div>
          </div>

          <div className="surface-card p-6 flex flex-col items-center">
            <h3 className="font-semibold text-[#1D2A22] text-lg self-start mb-2">Macro Split</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={macroData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {macroData.map((entry) => (
                    <Cell key={entry.key} fill={MACRO_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}g`, '']} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function recommendationExplanation(formData, results) {
  const parts = [];
  if (formData.diseaseType && formData.diseaseType !== 'None') {
    parts.push(`your ${formData.diseaseType.toLowerCase()} profile`);
  }
  if (formData.dietaryRestrictions && formData.dietaryRestrictions !== 'None') {
    parts.push(`your ${formData.dietaryRestrictions.replace('_', ' ').toLowerCase()} preference`);
  }
  const contextPhrase = parts.length
    ? `weighing ${parts.join(' and ')} alongside your activity level, cholesterol, and blood pressure`
    : 'weighing your activity level, cholesterol, blood pressure, and glucose together';

  return `Based on your health profile, the model recommends a ${DIET_LABELS[results.recommendedDiet] || results.recommendedDiet} approach — ${contextPhrase}. This came out ahead with ${Math.max(...results.dietProbabilities.map((d) => d.probability))}% confidence across the three categories the model considers (Balanced, Low-Carb, Low-Sodium). The meal plan below is built to hit your ${formData.dailyCaloricIntake} kcal daily target while respecting any allergies you selected.`;
}

function MetricCard({ icon, title, value, subtitle, color }) {
  return (
    <div className="surface-card p-5 flex flex-col justify-between hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}1A`, color }}>
          {React.cloneElement(icon, { className: 'w-4 h-4' })}
        </div>
        <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color }}>{value}</div>
      {subtitle && <div className="text-xs text-[#6B7280] mt-1">{subtitle}</div>}
    </div>
  );
}

function NutritionStat({ label, value, unit }) {
  return (
    <div className="bg-[#F7F6F1] rounded-xl p-4 border border-[#EFEBDE]">
      <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-[#1D2A22] mt-1">
        {value} <span className="text-xs font-medium text-[#9CA3AF]">{unit}</span>
      </p>
    </div>
  );
}
