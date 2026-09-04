import React from 'react';

/** Small sparkline used inside feature cards. direction: 'down' | 'up' */
export function MiniSparkline({ direction = 'down', color = '#1F5A3F' }) {
  const down = 'M2 8 C 14 10, 20 6, 30 14 C 40 20, 48 18, 58 30 C 64 37, 68 34, 74 40';
  const up = 'M2 40 C 14 34, 20 38, 30 24 C 40 12, 48 16, 58 8 C 64 4, 68 6, 74 2';
  return (
    <svg viewBox="0 0 76 44" className="w-full h-11" fill="none" aria-hidden="true">
      <path
        d={direction === 'down' ? down : up}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small bar visualization for "energy" style data */
export function MiniBars({ values = [40, 65, 50, 80, 60], color = '#1F5A3F' }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-1.5 h-11 w-full">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            opacity: 0.35 + (i / values.length) * 0.65,
          }}
        />
      ))}
    </div>
  );
}

/** Small circular progress ring for adherence-style scores */
export function MiniRing({ percent = 87, color = '#1F5A3F' }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 44 44" className="w-11 h-11 -rotate-90">
        <circle cx="22" cy="22" r={r} stroke="#E7E3D8" strokeWidth="4" fill="none" />
        <circle
          cx="22"
          cy="22"
          r={r}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#1D2A22]">
        {percent}%
      </span>
    </div>
  );
}
