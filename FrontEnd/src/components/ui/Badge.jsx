import React from 'react';

export default function Badge({ icon: Icon, children, tone = 'sage', className = '' }) {
  const tones = {
    sage: 'bg-[#DDE8D8] text-[#123D2A]',
    light: 'bg-white/15 text-white border border-white/25',
    outline: 'bg-white text-[#1F5A3F] border border-[#1F5A3F]/25',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-[0.08em] uppercase ${tones[tone]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
}
