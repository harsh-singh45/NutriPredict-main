import React from 'react';
import { Star } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

const AVATAR_IDS = [12, 32, 47];

export default function TrustBadge() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-3">
        {AVATAR_IDS.map((id) => (
          <ImageWithFallback
            key={id}
            src={`https://i.pravatar.cc/64?img=${id}`}
            alt=""
            className="w-9 h-9 rounded-full border-2 border-[#F7F6F1] object-cover bg-[#DDE8D8]"
            fallback={<div className="w-9 h-9 rounded-full border-2 border-[#F7F6F1] bg-[#DDE8D8]" />}
          />
        ))}
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-[#C08A2E] text-[#C08A2E]" />
          ))}
          <span className="text-xs font-bold text-[#1D2A22] ml-1">4.8/5</span>
        </div>
        <p className="text-xs text-[#6B7280] font-medium mt-0.5">Trusted by 1,200+ users</p>
      </div>
    </div>
  );
}
