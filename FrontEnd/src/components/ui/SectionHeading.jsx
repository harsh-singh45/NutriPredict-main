import React from 'react';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start text-left';

  return (
    <div className={`flex flex-col gap-4 max-w-2xl ${alignment} ${className}`}>
      {eyebrow && <span className="section-label">{eyebrow}</span>}
      <h2 className="text-3xl sm:text-4xl font-semibold text-[#1D2A22] text-balance leading-[1.15]">
        {title}
      </h2>
      {description && (
        <p className="text-[#6B7280] text-base sm:text-lg leading-relaxed text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
