import React from 'react';

// Clean, brand-colored SVG marks for MCP connectors — distinct glyphs on
// branded tiles (no plain initials). Rendered offline, no dependency.

function Tile({ size, bg, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill={bg} />
      {children}
    </svg>
  );
}

const BRANDS = {
  salesforce: (size) => (
    <Tile size={size} bg="#00A1E0">
      <path fill="#fff" d="M22 13c1.7 0 3.2 1 3.9 2.4a4 4 0 1 1 1 7.6H15.8a3.4 3.4 0 0 1-1-6.6 3.5 3.5 0 0 1 .6-.3A4.7 4.7 0 0 1 22 13z" />
    </Tile>
  ),
  slack: (size) => (
    <Tile size={size} bg="#fff">
      <g>
        <rect x="17.5" y="9" width="3.2" height="9" rx="1.6" fill="#36C5F0" />
        <rect x="9" y="19.3" width="9" height="3.2" rx="1.6" fill="#2EB67D" />
        <rect x="19.3" y="22" width="3.2" height="9" rx="1.6" fill="#ECB22E" />
        <rect x="22" y="17.5" width="9" height="3.2" rx="1.6" fill="#E01E5A" />
      </g>
    </Tile>
  ),
  jira: (size) => (
    <Tile size={size} bg="#fff">
      <path fill="#2684FF" d="M20 8l9 9-9 9-4.2-4.2L20.6 17 15.8 12.2z" opacity="0.55" />
      <path fill="#2684FF" d="M20 14l6 6-6 6-4.2-4.2 1.8-1.8-1.8-1.8z" />
    </Tile>
  ),
  github: (size) => (
    <Tile size={size} bg="#181717">
      <path fill="#fff" d="M20 10a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85l-.01 2.74c0 .27.18.58.69.48A10 10 0 0 0 20 10z" />
    </Tile>
  ),
  workday: (size) => (
    <Tile size={size} bg="#0875E1">
      <path fill="#fff" d="M10 16h2.4l1.8 6 1.8-6h2l1.8 6 1.8-6H26l-3 9h-2.3l-1.7-5.6L17.3 25H15z" />
    </Tile>
  ),
  hubspot: (size) => (
    <Tile size={size} bg="#FF7A59">
      <circle cx="18" cy="22" r="4.4" fill="none" stroke="#fff" strokeWidth="2.4" />
      <circle cx="27" cy="13" r="2.4" fill="#fff" />
      <path d="M22.4 22V17.5a3 3 0 0 1 3-3" stroke="#fff" strokeWidth="2.4" fill="none" />
    </Tile>
  ),
  notion: (size) => (
    <Tile size={size} bg="#fff">
      <rect x="9" y="9" width="22" height="22" rx="4" fill="none" stroke="#111" strokeWidth="1.6" />
      <path fill="#111" d="M15 15h2.6l5 7v-7H25v11h-2.5l-5.1-7.1V26H15z" />
    </Tile>
  ),
  servicenow: (size) => (
    <Tile size={size} bg="#62D84E">
      <path fill="#fff" d="M20 11a9 9 0 0 0-7 14.7l2.3-2.3a5.8 5.8 0 1 1 9.4 0l2.3 2.3A9 9 0 0 0 20 11z" />
    </Tile>
  ),
  // ---- ERP / real-estate systems ----
  sap: (size) => (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden="true">
      <defs><linearGradient id="sapg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2BAEEF" /><stop offset="1" stopColor="#0072C6" /></linearGradient></defs>
      <rect width="40" height="40" rx="10" fill="url(#sapg)" />
      <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" letterSpacing="0.5">SAP</text>
    </svg>
  ),
  yardi: (size) => (
    <Tile size={size} bg="#00853F">
      {/* house mark */}
      <path fill="#fff" d="M20 11l9 7.5h-2.4V29h-4.4v-6h-4.4v6h-4.4V18.5H11z" />
    </Tile>
  ),
  docusign: (size) => (
    <Tile size={size} bg="#D4B106">
      {/* signature loop + check */}
      <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" d="M12 24c4-1 5-9 7-9s1 8 4 8 5-4 5-4" />
      <path fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M24.5 26.5l2 2 3.5-4" />
    </Tile>
  ),
  appfolio: (size) => (
    <Tile size={size} bg="#1C6BBA">
      {/* folio document with roof */}
      <path fill="#fff" d="M20 10l8 5v-2h-3.5L20 12l-8 5h3v11h10V19h2z" opacity="0.0" />
      <path fill="#fff" d="M20 11l9 6h-2.2v11H13.2V17H11z" />
      <rect x="17" y="20" width="6" height="6" rx="1" fill="#1C6BBA" />
    </Tile>
  ),
  stripe: (size) => (
    <Tile size={size} bg="#635BFF">
      <g fill="#fff">
        <rect x="11" y="14" width="18" height="3.2" rx="1.6" />
        <rect x="11" y="19.4" width="18" height="3.2" rx="1.6" opacity="0.85" />
        <rect x="11" y="24.8" width="12" height="3.2" rx="1.6" opacity="0.7" />
      </g>
    </Tile>
  ),
  procore: (size) => (
    <Tile size={size} bg="#F47E20">
      <circle cx="20" cy="20" r="8" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="20" cy="20" r="2.6" fill="#fff" />
    </Tile>
  ),
  mri: (size) => (
    <Tile size={size} bg="#1B3A57">
      <path fill="#fff" d="M19 11l7 5.5h-1.8V28h-3.4v-6.4h-3.6V28h-3.4V16.5H12z" />
    </Tile>
  ),
  realpage: (size) => (
    <Tile size={size} bg="#F58220">
      <path fill="#fff" d="M20 11l9 6.5h-2.3V29H13.3V17.5H11z M17 21h6v6h-6z" />
    </Tile>
  ),
  entrata: (size) => (
    <Tile size={size} bg="#2D5BFF">
      <path fill="#fff" d="M14 12h12v3.4h-8.4v2.9H25v3.2h-7.4v3h8.6V28H14z" />
    </Tile>
  ),
  netsuite: (size) => (
    <Tile size={size} bg="#1B4E9B">
      <path fill="#fff" d="M14 11h3.4l5.2 7.6V11H26v18h-3.4l-5.2-7.6V29H14z" />
    </Tile>
  ),
  dynamics: (size) => (
    <Tile size={size} bg="#002050">
      <path fill="#fff" d="M20 10l9 4v12l-9 4-2-1V13zM18 13l-4 1.8v10.4L18 27z" opacity="0.95" />
    </Tile>
  ),
  sage: (size) => (
    <Tile size={size} bg="#00D639">
      <circle cx="20" cy="20" r="7.5" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="20" cy="20" r="2.4" fill="#fff" />
    </Tile>
  ),
  buildium: (size) => (
    <Tile size={size} bg="#159C8E">
      <path fill="#fff" d="M20 11l9 6.5h-2.3V29H13.3V17.5H11zM16.5 20h7v3h-7zm0 4.5h7V28h-7z" />
    </Tile>
  ),
  coupa: (size) => (
    <Tile size={size} bg="#326DE6">
      <path fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" d="M25 15.5a7 7 0 1 0 0 9" />
    </Tile>
  ),
};

export function BrandIcon({ brand, size = 40 }) {
  const render = BRANDS[brand];
  if (render) return render(size);
  // graceful fallback: neutral tile with first letter
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#e5e7eb" />
      <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill="#374151">
        {(brand || '?')[0].toUpperCase()}
      </text>
    </svg>
  );
}
