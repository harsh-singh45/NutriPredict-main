import React from 'react';
import { Sparkles, Zap, Flame, HeartPulse, Info } from 'lucide-react';

const POINTS = [
  { x: 0, y: 46 },
  { x: 40, y: 40 },
  { x: 80, y: 42 },
  { x: 120, y: 30 },
  { x: 160, y: 26 },
  { x: 200, y: 18 },
  { x: 240, y: 14 },
  { x: 280, y: 6 },
];

const WEEK_LABELS = ['Wk 0', 'Wk 3', 'Wk 6', 'Wk 9', 'Wk 12'];

function buildPath(points) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export default function PredictionPreview() {
  const linePath = buildPath(POINTS);
  const areaPath = `${linePath} L 280 60 L 0 60 Z`;

  return (
    <div
      className="surface-card p-5 sm:p-6 w-full max-w-[460px] animate-fade-up"
      style={{ animationDelay: '150ms' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Your Prediction Overview</p>
          <p className="text-sm font-semibold text-[#1D2A22] mt-0.5">Plant-Based · 12-week forecast</p>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#DDE8D8] text-[#123D2A] text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          92% AI Confidence
        </div>
      </div>

      {/* Weight projection */}
      <div className="rounded-xl bg-[#F7F6F1] border border-[#EFEBDE] p-4 mb-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-wide inline-flex items-center gap-1">
              Weight Projection <Info className="w-3 h-3 opacity-50" />
            </p>
            <p className="text-xl font-bold text-[#1D2A22] mt-1">
              72.4 kg <span className="text-[#6B7280] font-medium text-sm">→</span>{' '}
              <span className="text-[#1F5A3F]">68.9 kg</span>
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">in 12 weeks</p>
          </div>
          <span className="text-xs font-bold text-[#1F5A3F] bg-white border border-[#DDE8D8] px-2.5 py-1 rounded-full">
            −4.9%
          </span>
        </div>

        <div className="relative">
          <svg viewBox="0 0 280 64" className="w-full h-16" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F5A3F" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1F5A3F" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#previewFill)" />
            <path
              d={linePath}
              stroke="#1F5A3F"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: 'draw-line-1 1.3s 0.3s cubic-bezier(0.22,1,0.36,1) forwards',
              }}
            />
            {POINTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i === POINTS.length - 1 ? 4 : 2.5} fill="#1F5A3F" opacity={i === POINTS.length - 1 ? 1 : 0.5} />
            ))}
          </svg>

          {/* Callout bubble on the final point */}
          <div className="absolute -top-2 right-0 bg-[#123D2A] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
            68.9 kg
            <span className="absolute -bottom-1 right-4 w-2 h-2 bg-[#123D2A] rotate-45" />
          </div>
        </div>

        <div className="flex justify-between mt-2 px-0.5">
          {WEEK_LABELS.map((w) => (
            <span key={w} className="text-[10px] text-[#9CA3AF] font-medium">{w}</span>
          ))}
        </div>
      </div>

      {/* Mini metric cards — circular gauges like a real product dashboard */}
      <div className="grid grid-cols-3 gap-3">
        <GaugeStat icon={Zap} label="Energy Level" percent={82} value="High" tone="amber" />
        <GaugeStat icon={Flame} label="Metabolic Impact" percent={62} value="+12%" tone="sky" isTrend />
        <GaugeStat icon={HeartPulse} label="Adherence" percent={87} value="High" tone="default" />
      </div>

      <style>{`
        @keyframes draw-line-1 {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

function GaugeStat({ icon, label, percent, value, tone, isTrend }) {
  const Icon = icon;
  const tones = {
    default: { ring: '#1F5A3F', bg: 'bg-[#DDE8D8]', text: 'text-[#1F5A3F]' },
    amber: { ring: '#C08A2E', bg: 'bg-[#F1E4C6]', text: 'text-[#8A5F1E]' },
    sky: { ring: '#B8532F', bg: 'bg-[#F1DED4]', text: 'text-[#8A3F1E]' },
  };
  const t = tones[tone];
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="rounded-xl border border-[#EFEBDE] p-3 flex flex-col items-center text-center hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
      <div className="relative w-11 h-11 mb-2">
        <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
          <circle cx="20" cy="20" r={r} stroke="#EFEBDE" strokeWidth="3.5" fill="none" />
          <circle
            cx="20" cy="20" r={r}
            stroke={t.ring}
            strokeWidth="3.5"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className={`absolute inset-[5px] rounded-full ${t.bg} ${t.text} flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-[10px] text-[#6B7280] font-medium leading-tight">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${isTrend ? 'text-[#1F5A3F]' : 'text-[#1D2A22]'}`}>{value}</p>
    </div>
  );
}
