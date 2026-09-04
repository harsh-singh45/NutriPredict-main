import React, { useState } from 'react';

/**
 * Renders a photo, but falls back to `fallback` (any React node — e.g. an
 * inline SVG illustration) if the image fails to load, instead of showing
 * a broken-image icon. Also supports a soft placeholder color while loading.
 */
export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallback = null,
  loading = 'lazy',
}) {
  const [errored, setErrored] = useState(false);

  if (errored && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
