import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Leaf, ArrowRight, AlertCircle, Mail, RotateCw } from 'lucide-react';
import { verifyEmail, resendVerification, getUser } from '../utils/auth';
import OtpInput from '../components/ui/OtpInput';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';
  const shouldAutoSend = Boolean(location.state?.autoSend);

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(emailFromState && !shouldAutoSend ? RESEND_COOLDOWN_SECONDS : 0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (getUser()) {
      navigate('/profile');
    }
  }, [navigate]);

  useEffect(() => {
    if (shouldAutoSend && emailFromState) {
      handleResend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  // Auto-submit once all 6 digits are entered.
  useEffect(() => {
    if (code.length === 6 && email.trim() && !isSubmitting) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    if (code.length !== 6 || !email.trim()) return;
    setError('');
    setIsSubmitting(true);
    try {
      await verifyEmail(email.trim(), code);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) return;
    setError('');
    setInfo('');
    setIsResending(true);
    try {
      const message = await resendVerification(email.trim());
      setInfo(message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setCode('');
    } catch (err) {
      setError(err.message || 'Could not resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 bg-[#F7F6F1]">
      <div className="w-full max-w-md surface-card p-8 sm:p-10 text-center">
        <div className="w-14 h-14 bg-[#1F5A3F]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#1F5A3F]">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-semibold text-[#1D2A22] mb-2">Verify your email</h2>
        <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
          {email ? (
            <>We sent a 6-digit code to <span className="font-semibold text-[#1D2A22]">{email}</span>.</>
          ) : (
            'Enter your email and the 6-digit code we sent you.'
          )}
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {info && !error && (
          <div className="mb-5 bg-[#DDE8D8] text-[#123D2A] text-sm rounded-xl px-4 py-3 text-left">
            {info}
          </div>
        )}

        {!emailFromState && (
          <div className="mb-6 text-left">
            <label className="text-sm font-medium text-[#1D2A22] ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
              placeholder="you@email.com"
            />
          </div>
        )}

        <OtpInput value={code} onChange={setCode} disabled={isSubmitting} />

        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || !email.trim() || isSubmitting}
          className="w-full mt-8 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:bg-[#A9C6B8] disabled:text-white/80 disabled:cursor-not-allowed bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]"
        >
          {isSubmitting ? 'Verifying…' : 'Verify Email'} {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>

        <button
          onClick={handleResend}
          disabled={isResending || cooldown > 0 || !email.trim()}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-[#1F5A3F] hover:underline disabled:text-[#9CA3AF] disabled:no-underline disabled:cursor-not-allowed transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
        </button>

        <div className="mt-6 pt-6 border-t border-[#E7E3D8]">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1D2A22]">
            <Leaf className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
