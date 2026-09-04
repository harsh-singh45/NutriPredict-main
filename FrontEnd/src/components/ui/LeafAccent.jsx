import React from 'react';

/**
 * Small decorative leaf sprig used to soften section corners, echoing the
 * botanical brand mark. Purely ornamental (aria-hidden).
 */
export default function LeafAccent({ className = '', flip = false, tone = '#1F5A3F' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path
        d="M10 110 C 20 70 40 40 90 20"
        stroke={tone}
        strokeWidth="2"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M30 92 C 30 74 46 64 60 58 C 52 74 46 86 30 92 Z"
        fill={tone}
        opacity="0.22"
      />
      <path
        d="M55 66 C 58 48 72 36 92 28 C 86 46 76 60 55 66 Z"
        fill={tone}
        opacity="0.3"
      />
      <path
        d="M14 108 C 14 96 22 88 30 84 C 26 96 22 104 14 108 Z"
        fill={tone}
        opacity="0.4"
      />
    </svg>
  );
}
