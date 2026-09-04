import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Leaf, Lock, ArrowRight, AlertCircle, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { resetPassword } from '../utils/auth';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const passwordLongEnough = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = password !== '' && password === confirmPassword;
  const isFormValid = passwordLongEnough && passwordsMatch && token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('This reset link is missing its token. Request a new one.');
      return;
    }
    if (!passwordLongEnough) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsDone(true);
    } catch (err) {
      setError(err.status === 400 ? 'This reset link is invalid or has expired. Request a new one.' : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F7F6F1]">
      <div className="w-full max-w-md surface-card p-8 sm:p-10 text-center">

        {isDone ? (
          <>
            <div className="w-14 h-14 bg-[#1F5A3F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#1F5A3F]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1D2A22] mb-2">Password reset</h2>
            <p className="text-sm text-[#6B7280] mb-8">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)] transition-all"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-[#1F5A3F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#1F5A3F]">
              <Leaf className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1D2A22] mb-2">Set a new password</h2>
            <p className="text-sm text-[#6B7280] mb-8">Choose a new password for your account.</p>

            {!token && (
              <div className="mb-5 flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-800 text-sm rounded-xl px-4 py-3 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>This link is missing its reset token. Make sure you opened the full link from your email.</span>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 text-left">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1D2A22] ml-1">New password</label>
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
                <label className="text-sm font-medium text-[#1D2A22] ml-1">Confirm new password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                    placeholder="Re-enter your new password"
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
                {isSubmitting ? 'Resetting…' : 'Reset Password'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-sm text-[#6B7280] mt-8">
              <Link to="/forgot-password" className="text-[#1F5A3F] font-semibold hover:underline">
                Request a new link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
