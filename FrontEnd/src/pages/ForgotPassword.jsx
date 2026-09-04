import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, ArrowRight, ArrowLeft, Quote, Sparkles, AlertCircle, MailCheck } from 'lucide-react';
import { forgotPassword } from '../utils/auth';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import ctaProducePhoto from '../assets/images/cta-produce.jpg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const message = await forgotPassword(email.trim());
      setSentMessage(message);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F7F6F1]">
      <div className="w-full max-w-4xl surface-card overflow-hidden grid lg:grid-cols-[1.05fr_1fr]">

        {/* Left — photography panel */}
        <div className="relative hidden lg:block min-h-[560px]">
          <ImageWithFallback
            src={ctaProducePhoto}
            alt="Fresh cherry tomatoes and spinach"
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

          {sentMessage ? (
            <div className="text-center lg:text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#DDE8D8] flex items-center justify-center mb-6 text-[#1F5A3F] mx-auto lg:mx-0">
                <MailCheck className="w-7 h-7" />
              </div>
              <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-[#1D2A22] mb-3">Check your email</h2>
              <p className="text-sm text-[#6B7280] leading-relaxed mb-8">{sentMessage}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#1F5A3F] font-semibold hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-[1.75rem] font-semibold text-[#1D2A22] mb-2">Forgot your password?</h2>
              <p className="text-sm text-[#6B7280] mb-8">
                Enter your email and we'll send you a link to reset it.
              </p>

              {error && (
                <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={!email.trim() || isSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:bg-[#A9C6B8] disabled:text-white/80 disabled:cursor-not-allowed bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]"
                >
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <p className="text-sm text-[#6B7280] mt-8 text-center lg:text-left">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-[#1F5A3F] font-semibold hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
