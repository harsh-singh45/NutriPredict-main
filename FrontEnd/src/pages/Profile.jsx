import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Trash2, Clock, Flame, Target, Salad, Plus, Leaf, AlertCircle, Loader2 } from 'lucide-react';
import { getUser, logoutUser } from '../utils/auth';
import { getHistory, getUserStats, clearHistory, getPredictionDetail } from '../utils/predictions';
import ChangePasswordCard from '../components/profile/ChangePasswordCard';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ totalPredictions: 0, bestConfidence: 0, avgMetabolicScore: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [historyData, statsData] = await Promise.all([getHistory(), getUserStats()]);
      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Could not load your predictions right now.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [navigate, loadData]);

  const handleSignOut = () => {
    logoutUser();
    navigate('/');
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
      setStats({ totalPredictions: 0, bestConfidence: 0, avgMetabolicScore: 0 });
    } catch (err) {
      setError(err.message || 'Could not clear history right now.');
    }
  };

  const openPrediction = async (id) => {
    setOpeningId(id);
    try {
      const { formData, results } = await getPredictionDetail(id);
      navigate('/results', { state: { formData, results } });
    } catch (err) {
      setError(err.message || 'Could not load that prediction.');
    } finally {
      setOpeningId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 pt-10">

      {/* 1. USER IDENTITY CARD */}
      <div className="surface-card p-6 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1F5A3F]/10 text-[#1F5A3F] flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#1D2A22]">{user.name}</h2>
            <p className="text-sm text-[#6B7280] font-medium">{user.email}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Member since {new Date(user.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold border border-red-100"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface-card p-6 text-center">
          <div className="text-3xl font-bold text-[#1F5A3F] mb-1">{stats.totalPredictions}</div>
          <div className="text-xs text-[#6B7280] font-medium">Predictions</div>
        </div>
        <div className="surface-card p-6 text-center">
          <div className="text-3xl font-bold text-[#1F5A3F] mb-1">{stats.bestConfidence}%</div>
          <div className="text-xs text-[#6B7280] font-medium">Best Confidence</div>
        </div>
        <div className="surface-card p-6 text-center">
          <div className="text-3xl font-bold text-[#2E6E8E] mb-1">{stats.avgMetabolicScore}</div>
          <div className="text-xs text-[#6B7280] font-medium">Avg. Est. Glucose (mg/dL)</div>
        </div>
      </div>

      {/* 3. CHANGE PASSWORD */}
      <ChangePasswordCard />

      {/* 4. PREDICTION HISTORY */}
      <div className="pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-1 gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#1D2A22]">
            <Clock className="w-5 h-5 text-[#1F5A3F]" /> Prediction History
          </h3>

          <div className="flex items-center justify-between sm:justify-end gap-6">
            <button
              onClick={() => navigate('/predict')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F5A3F] text-white text-sm font-semibold hover:bg-[#123D2A] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Prediction
            </button>

            <button
              onClick={handleClearHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-red-500 transition-colors disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="surface-card p-10 flex items-center justify-center gap-2 text-[#6B7280]">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading your predictions…
            </div>
          ) : history.length === 0 ? (
            <div className="surface-card p-10 text-center">
              <p className="text-[#6B7280] mb-4">No predictions yet</p>
              <button onClick={() => navigate('/predict')} className="px-6 py-2.5 rounded-xl bg-[#1F5A3F] text-white text-sm font-semibold shadow-sm hover:-translate-y-0.5 transition-all">
                Make Your First Prediction
              </button>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => openPrediction(item.id)}
                className="surface-card surface-card-hover p-4 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1F5A3F]/10 flex items-center justify-center text-[#1F5A3F]">
                    {openingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Leaf className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1D2A22] group-hover:text-[#1F5A3F] transition-colors">
                      {item.recommendedDiet?.replace('_', ' ')}
                    </h4>
                    <p className="text-xs text-[#6B7280]">{item.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 pr-2">
                  <div className="flex flex-col items-center">
                    <Target className="w-4 h-4 text-[#1F5A3F] mb-1" />
                    <span className="text-xs font-bold text-[#1D2A22]">{item.topConfidence ?? 0}%</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Flame className="w-4 h-4 text-[#C08A2E] mb-1" />
                    <span className="text-xs font-bold text-[#1D2A22]">{Math.round(item.totalCalories ?? 0)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Salad className="w-4 h-4 text-[#7C5CBF] mb-1" />
                    <span className="text-xs font-bold text-[#1D2A22]">{item.metabolicScore ?? 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
