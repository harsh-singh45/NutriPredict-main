import React from 'react';

export default function StepCard({ number, icon, title, description }) {
  const Icon = icon;
  return (
    <div className="relative flex flex-col items-start gap-4 flex-1">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white border border-[#E7E3D8] shadow-[0_1px_2px_rgba(18,61,42,0.06)] flex items-center justify-center text-[#1F5A3F]">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold tracking-[0.16em] text-[#1F5A3F]/50">STEP {number}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#1D2A22] mb-1.5">{title}</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
