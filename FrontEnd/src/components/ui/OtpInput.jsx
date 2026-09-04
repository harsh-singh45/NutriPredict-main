import React, { useRef } from 'react';

/**
 * A 6-box one-time-code input. Typing a digit auto-advances to the next
 * box; backspace on an empty box moves back; pasting a full code fills
 * every box at once.
 */
export default function OtpInput({ value, onChange, length = 6, disabled = false }) {
  const inputRefs = useRef([]);

  const setDigit = (index, char) => {
    const digits = value.padEnd(length, ' ').split('');
    digits[index] = char;
    onChange(digits.join('').replace(/ /g, '').slice(0, length));
  };

  const handleChange = (index, raw) => {
    const char = raw.replace(/\D/g, '').slice(-1); // keep only the last typed digit
    if (raw !== '' && char === '') return; // ignore non-digit input
    setDigit(index, char);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl bg-[#F7F6F1] border border-transparent focus:bg-white focus:border-[#1F5A3F] outline-none transition-all text-[#1D2A22] disabled:opacity-50"
        />
      ))}
    </div>
  );
}
