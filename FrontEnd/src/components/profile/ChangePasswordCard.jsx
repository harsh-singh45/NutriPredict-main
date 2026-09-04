import React, { useState } from 'react';
import { KeyRound, ChevronDown, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../../utils/auth';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordLongEnough = newPassword.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = newPassword !== '' && newPassword === confirmPassword;
  const isFormValid = currentPassword !== '' && passwordLongEnough && passwordsMatch;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleToggle = () => {
    setIsOpen((v) => !v);
    setError('');
    setSuccess('');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const message = await changePassword(currentPassword, newPassword);
      setSuccess(message);
      resetForm();
    } catch (err) {
      setError(err.status === 401 ? 'Current password is incorrect.' : err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1F5A3F]/10 flex items-center justify-center text-[#1F5A3F]">
            <KeyRound className="w-5 h-5" />
          </div>
          <span>
            <span className="block font-semibold text-[#1D2A22]">Change Password</span>
            <span className="block text-xs text-[#6B7280] mt-0.5">Update the password for your account</span>
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-6 pb-6 animate-fade-up">
          <div className="h-px bg-[#E7E3D8] mb-6" />

          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 flex items-start gap-2 bg-[#DDE8D8] text-[#123D2A] text-sm rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Current password</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 pr-11 py-3 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                  placeholder="Your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1D2A22] transition-colors"
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">New password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                placeholder="At least 8 characters"
              />
              {newPassword !== '' && !passwordLongEnough && (
                <p className="text-xs text-[#9CA3AF] mt-1 ml-1">At least {MIN_PASSWORD_LENGTH} characters</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1D2A22] ml-1">Confirm new password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] placeholder-[#9CA3AF] font-medium"
                placeholder="Re-enter your new password"
              />
              {confirmPassword !== '' && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1 ml-1">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:bg-[#A9C6B8] disabled:text-white/80 disabled:cursor-not-allowed bg-[#1F5A3F] text-white hover:bg-[#123D2A] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]"
            >
              {isSubmitting ? 'Saving…' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
