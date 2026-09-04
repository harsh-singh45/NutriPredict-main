import React from 'react';
import { TrendingDown, Battery, HeartPulse, Target, Flame, Leaf, Sprout } from 'lucide-react';

const DIETS = [
  { name: 'Keto', icon: Flame, tone: 'text-[#B8532F] bg-[#F1DED4]' },
  { name: 'Low Carb', icon: Leaf, tone: 'text-[#8A5F1E] bg-[#F1E4C6]' },
  { name: 'Plant Based', icon: Sprout, tone: 'text-[#1F5A3F] bg-[#DDE8D8]' },
];

const ROWS = [
  {
    label: 'Weight Trend',
    icon: TrendingDown,
    values: ['↓ 4.8 kg', '↓ 3.9 kg', '↓ 3.1 kg'],
    best: 0,
  },
  {
    label: 'Energy Level',
    icon: Battery,
    values: ['82%', '78%', '86%'],
    best: 2,
  },
  {
    label: 'Metabolic Impact',
    icon: HeartPulse,
    values: ['+12%', '+9%', '+15%'],
    best: 2,
  },
  {
    label: 'Adherence Probability',
    icon: Target,
    values: ['71%', '84%', '88%'],
    best: 2,
  },
];

export default function DietComparisonTable() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#E7E3D8]">
              <th className="text-left font-medium text-[#6B7280] px-5 py-4 w-[38%]">Metric</th>
              {DIETS.map((d) => {
                const DietIcon = d.icon;
                return (
                  <th key={d.name} className="text-left font-semibold text-[#1D2A22] px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center ${d.tone}`}>
                        <DietIcon className="w-3.5 h-3.5" />
                      </span>
                      {d.name}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const Icon = row.icon;
              return (
                <tr key={row.label} className={i !== ROWS.length - 1 ? 'border-b border-[#F0EEE5]' : ''}>
                  <td className="px-5 py-4 text-[#1D2A22] font-medium">
                    <span className="inline-flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#1F5A3F]/60" />
                      {row.label}
                    </span>
                  </td>
                  {row.values.map((v, idx) => (
                    <td
                      key={idx}
                      className={`px-5 py-4 font-semibold ${
                        idx === row.best ? 'text-[#1F5A3F]' : 'text-[#1D2A22]/80'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {v}
                        {idx === row.best && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1F5A3F]" aria-hidden="true" />
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
