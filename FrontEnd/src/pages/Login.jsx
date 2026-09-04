import { AlertCircle, ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, Quote, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import nutritionBowlPhoto from '../assets/images/nutrition-bowl.jpg';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import { getUser, login } from '../utils/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (getUser()) {
      navigate(location.state?.from?.pathname || '/profile', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/profile');
    } catch (err) {
      if (err.status === 403) {
        navigate('/verify-email', { state: { email: email.trim(), autoSend: true } });
        return;
      }
      setError(err.status === 401 ? 'Incorrect email or password.' : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email.trim() !== '' && password !== '';

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F7F6F1]">
      <div className="w-full max-w-4xl surface-card overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">

        {/* Left — photography panel */}
        <div className="relative hidden lg:block min-h-[600px]">
          <ImageWithFallback
            src={nutritionBowlPhoto}
            alt="Fresh, balanced bowl of leafy greens, avocado, and grains"
            className="absolute inset-0 w-full h-full object-cover"
            fallback={<div className="absolute inset-0 bg-[#DDE8D8]" />}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(200deg, rgba(18,61,42,0.15) 0%, rgba(18,61,42,0.78) 100%)' }}
          />

          <div className="relative h-full flex flex-col justify-between p-9 text-white">
            <div className="inline-flex items-center gap-2 w-fit">
              <div className="w-9 h-9 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                NutriPredict
              </span>
            </div>

            <div>
              <Quote className="w-7 h-7 text-white/50 mb-3" />
              <p className="text-xl leading-snug text-balance" style={{ fontFamily: 'var(--font-display)' }}>
                Predictions, not guesses — I finally chose a diet with real evidence behind it.
              </p>
              <div className="flex items-center gap-2 mt-5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Sparkles key={i} className="w-3.5 h-3.5 fill-[#C08A2E] text-[#C08A2E]" />
                  ))}
                </div>
                <span className="text-xs text-white/70 font-medium">Rated 4.8/5 by 1,200+ users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-14 h-14 bg-[#1F5A3F]/10 rounded-2xl flex items-center justify-center mb-6 text-[#1F5A3F] lg:hidden">
            <Leaf className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-[#1D2A22] mb-2">Welcome back</h2>
          <p className="text-sm text-[#6B7280] mb-8">Sign in to see your predictions and progress</p>

          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-medium text-[#1D2A22]">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#1F5A3F] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1D2A22] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:bg-[#A9C6B8] disabled:text-white/80 disabled:cursor-not-allowed bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-sm text-[#6B7280] mt-8 text-center lg:text-left">
            New to NutriPredict?{' '}
            <Link to="/signup" className="text-[#1F5A3F] font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
