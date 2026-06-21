// ============================================================================
//  ÍCONES (SVG inline — zero dependências externas)
//  Todos os ícones compartilham o mesmo contrato `IconProps`.
//  Para adicionar um novo ícone, basta seguir o mesmo padrão.
// ============================================================================

import React from 'react';

export interface IconProps {
  size?: number;
  style?: React.CSSProperties;
}

const base = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconRecycle: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M12 3a9 9 0 1 1-7.5 4" />
    <path d="M4 3v4h4" />
  </svg>
);

export const IconLeaf: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M5 19c7-1 13-6 13-14-8 0-13 5-13 14Z" />
    <path d="M5 19c2-3 4-6 9-10" />
  </svg>
);

export const IconCpu: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
  </svg>
);

export const IconTruck: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 11h4l3 3v2h-7z" />
    <circle cx="7.5" cy="18" r="1.7" />
    <circle cx="17.5" cy="18" r="1.7" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-5-5" />
  </svg>
);

export const IconPackage: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
    <path d="M3 7.5v9L12 21l9-4.5v-9" />
    <path d="M12 12v9" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M4 12.5 9 17.5 20 6.5" />
  </svg>
);

export const IconAlert: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M12 3 22 20H2Z" />
    <path d="M12 9.5v5" />
    <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLoader: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <circle cx="12" cy="12" r="9" strokeOpacity={0.25} />
    <path d="M21 12a9 9 0 0 0-9-9" />
  </svg>
);

export const IconLayout: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export const IconMapPin: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const IconChevronRight: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export const IconX: React.FC<IconProps> = ({ size = 18, style }) => (
  <svg {...base} viewBox="0 0 24 24" width={size} height={size} style={style}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);