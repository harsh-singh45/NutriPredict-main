import React from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  primary:
    'bg-[#1F5A3F] text-white hover:bg-[#123D2A] shadow-[0_1px_2px_rgba(18,61,42,0.08)] hover:shadow-[0_8px_20px_-6px_rgba(18,61,42,0.35)]',
  secondary:
    'bg-white text-[#1D2A22] border border-[#E7E3D8] hover:border-[#1F5A3F]/40 hover:bg-[#F7F6F1]',
  ghost:
    'bg-transparent text-[#1D2A22] hover:bg-black/[0.04]',
  light:
    'bg-white/10 text-white border border-white/25 hover:bg-white/20',
};

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-[15px]',
};

export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none group ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  const content = (
    <>
      {Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4 transition-transform duration-300" />
      )}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {content}
    </button>
  );
}
