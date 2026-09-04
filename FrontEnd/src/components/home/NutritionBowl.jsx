import React from 'react';

/**
 * A stylised "balanced bowl" illustration in the NutriPredict palette.
 * Built as inline SVG so it always renders — no external image dependency.
 */
export default function NutritionBowl() {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" role="img" aria-label="Illustration of a balanced bowl of vegetables, grains, and avocado">
      <defs>
        <linearGradient id="bowlBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFEBDD" />
          <stop offset="100%" stopColor="#DDE8D8" />
        </linearGradient>
        <radialGradient id="bowlShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#123D2A" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#123D2A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill="url(#bowlBg)" />

      {/* soft ground shadow */}
      <ellipse cx="200" cy="360" rx="150" ry="30" fill="url(#bowlShadow)" />

      {/* bowl */}
      <path d="M70 230 Q70 340 200 340 Q330 340 330 230 Z" fill="#FFFFFF" stroke="#E7E3D8" strokeWidth="2" />
      <ellipse cx="200" cy="230" rx="130" ry="34" fill="#F7F6F1" stroke="#E7E3D8" strokeWidth="2" />

      {/* avocado half */}
      <ellipse cx="150" cy="222" rx="42" ry="26" fill="#7C9A4A" />
      <ellipse cx="150" cy="222" rx="26" ry="16" fill="#DDE8D8" />
      <circle cx="150" cy="222" r="9" fill="#8A5F1E" />

      {/* grains / rice mound */}
      <ellipse cx="248" cy="226" rx="46" ry="22" fill="#F1E4C6" />
      <circle cx="232" cy="220" r="3" fill="#C08A2E" opacity="0.5" />
      <circle cx="250" cy="216" r="3" fill="#C08A2E" opacity="0.5" />
      <circle cx="264" cy="224" r="3" fill="#C08A2E" opacity="0.5" />
      <circle cx="244" cy="230" r="3" fill="#C08A2E" opacity="0.5" />

      {/* cherry tomatoes */}
      <circle cx="112" cy="244" r="10" fill="#B8532F" />
      <circle cx="128" cy="252" r="8" fill="#B8532F" />

      {/* leafy greens */}
      <path d="M180 250 Q170 236 186 230 Q196 244 180 250Z" fill="#1F5A3F" />
      <path d="M198 254 Q188 240 204 234 Q214 248 198 254Z" fill="#2E7D53" />
      <path d="M216 250 Q206 236 222 230 Q232 244 216 250Z" fill="#1F5A3F" />

      {/* seeds sprinkle */}
      <circle cx="270" cy="248" r="2" fill="#8A5F1E" />
      <circle cx="278" cy="242" r="2" fill="#8A5F1E" />
      <circle cx="286" cy="250" r="2" fill="#8A5F1E" />

      {/* rim highlight */}
      <path d="M76 226 Q200 262 324 226" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}
