import React from 'react';

export function Card({ hover = false, className = '', children, ...props }) {
  return (
    <div
      className={`surface-card ${hover ? 'surface-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageContainer({ className = '', children }) {
  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
