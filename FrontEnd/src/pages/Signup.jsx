import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, User, Mail, Lock, ArrowRight, Sparkles, Quote, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { signup, getUser } from '../utils/auth';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import heroIngredientsPhoto from '../assets/images/hero-ingredients.jpg';

const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getUser()) {
      navigate('/profile');
    }
  }, [navigate]);

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = password !== '' && password === confirmPassword;

  const validate = () => {
    if (!name.trim()) return 'Enter your name.';
    if (!email.trim()) return 'Enter your email.';
    if (!passwordLongEnough) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (!passwordsMatch) return 'Passwords do not match.';
    return '';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/verify-email', { state: { email: email.trim() } });
    } catch (err) {
      setError(err.status === 409 ? 'An account with this email already exists.' : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() !== '' && email.trim() !== '' && passwordLongEnough && passwordsMatch;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F7F6F1]">
      <div className="w-full max-w-4xl surface-card overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">

        {/* Left — photography panel */}
        <div className="relative hidden lg:block min-h-[640px]">
          <ImageWithFallback
            src={heroIngredientsPhoto}
            alt="Fresh almonds, avocado, and spinach"
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
                See how a diet could affect you — before you change a single meal.
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
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-[#1D2A22] mb-2">Create your account</h2>
          <p className="text-sm text-[#6B7280] mb-8">Save your predictions and track progress over time</p>

          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="Your name"
                />
              </div>
            </div>

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
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="At least 8 characters"
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
              {password !== '' && (
                <p className={`text-xs flex items-center gap-1.5 mt-1.5 ml-1 ${passwordLongEnough ? 'text-[#1F5A3F]' : 'text-[#9CA3AF]'}`}>
                  <Check className={`w-3.5 h-3.5 ${passwordLongEnough ? 'opacity-100' : 'opacity-40'}`} />
                  At least {MIN_PASSWORD_LENGTH} characters
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="Re-enter your password"
                />
              </div>
              {confirmPassword !== '' && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1.5 ml-1">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:bg-[#A9C6B8] disabled:text-white/80 disabled:cursor-not-allowed bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]"
            >
              {isSubmitting ? 'Creating account…' : 'Create Account'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-sm text-[#6B7280] mt-8 text-center lg:text-left">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1F5A3F] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
