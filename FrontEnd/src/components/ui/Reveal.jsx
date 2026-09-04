import React, { useEffect, useRef, useState } from 'react';

const hasIntersectionObserver = typeof IntersectionObserver !== 'undefined';

/**
 * Wraps children and applies the fade-up animation once the element
 * scrolls into view. Falls back to always-visible if IntersectionObserver
 * isn't available. Respects prefers-reduced-motion via the CSS media query
 * already defined in index.css. Includes a timeout safety net so content
 * never stays permanently hidden if the observer never fires.
 */
export default function Reveal({ as, delay = 0, className = '', children, ...props }) {
  const Tag = as || 'div';
  const ref = useRef(null);
  const [visible, setVisible] = useState(!hasIntersectionObserver);

  useEffect(() => {
    if (!hasIntersectionObserver) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);

    // Safety net: never leave content permanently hidden if the observer
    // doesn't fire for some reason (e.g. unusual embedding contexts).
    const fallback = setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${visible ? 'animate-fade-up' : 'opacity-0'} ${className}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}
