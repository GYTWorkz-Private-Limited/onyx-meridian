import React, { useId } from 'react';

// Onyx Meridian brand mark: a faceted onyx gem ("Onyx") cradling a globe
// meridian ring ("Meridian"). Self-contained SVG, no dependency.
export function Logo({ size = 28 }) {
  const id = useId();
  const gem = `${id}-gem`;
  const sheen = `${id}-sheen`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img" aria-label="Onyx Meridian logo">
      <defs>
        <linearGradient id={gem} x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5dade2" />
          <stop offset="0.55" stopColor="#3a86d4" />
          <stop offset="1" stopColor="#2563a8" />
        </linearGradient>
        <linearGradient id={sheen} x1="11" y1="3" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Faceted gem — rounded hexagon */}
      <path
        d="M14.6 2.7a2.8 2.8 0 0 1 2.8 0l8.6 4.96a2.8 2.8 0 0 1 1.4 2.43v9.82a2.8 2.8 0 0 1-1.4 2.43l-8.6 4.96a2.8 2.8 0 0 1-2.8 0l-8.6-4.96A2.8 2.8 0 0 1 4.6 19.9V10.1a2.8 2.8 0 0 1 1.4-2.43z"
        fill={`url(#${gem})`}
      />
      <path
        d="M14.6 2.7a2.8 2.8 0 0 1 2.8 0l8.6 4.96a2.8 2.8 0 0 1 1.4 2.43L16 16 4.6 10.1a2.8 2.8 0 0 1 1.4-2.43z"
        fill={`url(#${sheen})`}
      />

      {/* Globe meridian */}
      <g stroke="#fff" strokeWidth="1.5" opacity="0.95">
        <ellipse cx="16" cy="16" rx="4.4" ry="7.6" fill="none" />
        <line x1="7.2" y1="16" x2="24.8" y2="16" />
      </g>
      <circle cx="16" cy="16" r="1.7" fill="#fff" />
    </svg>
  );
}

export default Logo;
