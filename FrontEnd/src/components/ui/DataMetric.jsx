import React from 'react';

export default function DataMetric({ icon: Icon, label, value, tone = 'default', className = '' }) {
  const tones = {
    default: 'text-[#1F5A3F] bg-[#DDE8D8]',
    amber: 'text-[#8A5F1E] bg-[#F1E4C6]',
    sky: 'text-[#20495E] bg-[#D9E7ED]',
  };

  return (
    <div
      className={`surface-card flex items-center gap-3 px-4 py-3 ${className}`}
    >
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      )}
      <div className="leading-tight">
        <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">{label}</div>
        <div className="text-sm font-bold text-[#1D2A22]">{value}</div>
      </div>
    </div>
  );
}
