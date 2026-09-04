import React from 'react';
import { Card } from '../ui/Card';

export default function FeatureCard({ icon, title, description, visual }) {
  const Icon = icon;
  return (
    <Card hover className="p-7 flex flex-col gap-5 group">
      <div className="w-11 h-11 rounded-xl bg-[#1F5A3F]/10 ring-4 ring-[#1F5A3F]/5 flex items-center justify-center text-[#1F5A3F] group-hover:bg-[#1F5A3F] group-hover:ring-[#1F5A3F]/15 group-hover:text-white transition-all duration-300">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#1D2A22] mb-2">{title}</h3>
        <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
      </div>
      {visual && <div className="pt-1">{visual}</div>}
    </Card>
  );
}
