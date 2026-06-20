// ============================================================================
//  TOKENS DE DESIGN
//  Fonte única de verdade para todas as decisões visuais.
//  Importe `tokens` e `styles` onde precisar — nunca escreva valores
//  mágicos de cor, fonte ou espaçamento diretamente nos componentes.
// ============================================================================

export const tokens = {
  bg: '#E9EFE4',
  surface: '#FFFFFF',
  surfaceAlt: '#F2F5ED',
  ink: '#172620',
  inkMuted: '#5B6B60',
  line: '#C7D0BF',
  lineStrong: '#A9B6A0',
  primary: '#2E6A4E',
  primaryDark: '#1F4E39',
  primarySoft: '#DCEADF',
  accent: '#D9822E',
  accentSoft: '#F8E6C9',
  danger: '#B23B3B',
  dangerSoft: '#F7E1DE',
  reciclavel: '#2E6A4E',
  reciclavelSoft: '#DCEADF',
  organico: '#8A6633',
  organicoSoft: '#F0E3CC',
  tecnologia: '#3C6E8C',
  tecnologiaSoft: '#DCE7EC',
  radius: 10,
  radiusSm: 6,
  fontDisplay: "'Big Shoulders Display', sans-serif",
  fontBody: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'IBM Plex Mono', 'SFMono-Regular', monospace",
} as const;

// ---------- CSS global -------------------------------------------------------

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background: ${tokens.bg};
}

#root {
  width: 100%;
  min-height: 100vh;
}

.ecotrack-root, .ecotrack-root *, .ecotrack-root *::before, .ecotrack-root *::after {
  box-sizing: border-box;
}

.ecotrack-root {
  font-family: ${tokens.fontBody};
  color: ${tokens.ink};
  -webkit-font-smoothing: antialiased;
}

.ecotrack-root button { font-family: inherit; cursor: pointer; }

.ecotrack-root input[type="checkbox"] {
  accent-color: ${tokens.primary};
  width: 16px;
  height: 16px;
  flex: none;
}

.ecotrack-root input:focus-visible,
.ecotrack-root select:focus-visible,
.ecotrack-root button:focus-visible {
  outline: 2px solid ${tokens.accent};
  outline-offset: 2px;
}

.ecotrack-root input::placeholder { color: #93A395; }

@keyframes ecotrackSpin  { to { transform: rotate(360deg); } }
.ecotrack-spin { animation: ecotrackSpin 0.85s linear infinite; }

@keyframes ecotrackFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.ecotrack-fade-in { animation: ecotrackFadeIn 0.3s ease-out; }

.ecotrack-tab-btn:hover { color: ${tokens.primaryDark}; background: ${tokens.surfaceAlt}; }
.ecotrack-primary-btn:not(:disabled):hover { background: ${tokens.primaryDark}; }
.ecotrack-checkbox-row:hover { background: ${tokens.surfaceAlt}; }

@media (max-width: 640px) {
  .ecotrack-field-row     { flex-direction: column !important; }
  .ecotrack-dashboard-grid { grid-template-columns: 1fr !important; }
  .ecotrack-tab-btn       { flex: 1 1 40% !important; }
}
`;

// ---------- estilos CSS-in-JS ------------------------------------------------

export const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100%',
    minHeight: '100vh',
    background: tokens.bg,
    fontFamily: tokens.fontBody,
  },
  header: {
    width: '100%',
    background: tokens.primaryDark,
    color: '#F3F7F1',
  },
  headerInner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '20px 40px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.accent,
    flex: 'none',
  },
  brandTitle: {
    fontFamily: tokens.fontDisplay,
    fontWeight: 800,
    fontSize: 26,
    letterSpacing: '0.04em',
    lineHeight: 1,
  },
  brandTag: {
    fontFamily: tokens.fontMono,
    fontSize: 12.5,
    color: 'rgba(243,247,241,0.7)',
    marginTop: 4,
    letterSpacing: '0.02em',
  },
  barcodeStripe: {
    height: 7,
    background: `repeating-linear-gradient(90deg, ${tokens.accent} 0 2px, transparent 2px 6px, rgba(255,255,255,0.5) 6px 7px, transparent 7px 13px, ${tokens.accent} 13px 16px, transparent 16px 23px)`,
    opacity: 0.85,
  },
  tabNav: {
    width: '100%',
    background: tokens.bg,
    padding: '0 40px',
  },
  tabNavInner: {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    paddingTop: 16,
  },
  tabButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    borderBottom: '3px solid transparent',
    background: 'transparent',
    color: tokens.inkMuted,
    fontSize: 14,
    fontWeight: 600,
    transition: 'background 0.15s ease, color 0.15s ease',
  },
  tabButtonActive: {
    background: tokens.surface,
    color: tokens.primaryDark,
    borderBottom: `3px solid ${tokens.accent}`,
  },
  main: {
    width: '100%',
    padding: '0 40px 48px',
  },
  mainInner: {
    maxWidth: 1280,
    margin: '0 auto',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: 12.5,
    color: tokens.inkMuted,
    padding: '24px 24px 40px',
    fontFamily: tokens.fontMono,
  },
  sectionCard: {
    background: tokens.surface,
    border: `1px solid ${tokens.line}`,
    borderRadius: tokens.radius,
    padding: 28,
    boxShadow: '0 1px 2px rgba(23,38,32,0.04)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 9,
    background: tokens.primarySoft,
    color: tokens.primaryDark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  sectionTitle: {
    fontFamily: tokens.fontDisplay,
    fontWeight: 700,
    fontSize: 21,
    letterSpacing: '0.01em',
    margin: 0,
  },
  sectionDesc: {
    fontSize: 13.5,
    color: tokens.inkMuted,
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 18,
  },
  fieldRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    flex: 1,
    minWidth: 220,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: tokens.ink,
  },
  input: {
    padding: '10px 12px',
    borderRadius: tokens.radiusSm,
    border: `1px solid ${tokens.line}`,
    background: tokens.surface,
    fontSize: 14,
    color: tokens.ink,
    fontFamily: tokens.fontMono,
  },
  select: {
    padding: '10px 12px',
    borderRadius: tokens.radiusSm,
    border: `1px solid ${tokens.line}`,
    background: tokens.surface,
    fontSize: 14,
    color: tokens.ink,
    fontFamily: tokens.fontBody,
  },
  helperText: {
    fontSize: 12.5,
    color: tokens.inkMuted,
  },
  checkboxList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    border: `1px solid ${tokens.line}`,
    borderRadius: tokens.radiusSm,
    padding: 6,
    maxHeight: 220,
    overflowY: 'auto' as const,
    background: tokens.surfaceAlt,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  checkboxLabel: {
    fontFamily: tokens.fontMono,
    fontSize: 13.5,
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 20px',
    borderRadius: tokens.radiusSm,
    border: 'none',
    background: tokens.primary,
    color: '#F3F7F1',
    fontSize: 14,
    fontWeight: 700,
    alignSelf: 'flex-start',
    transition: 'background 0.15s ease, opacity 0.15s ease',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 14px',
    borderRadius: tokens.radiusSm,
    fontSize: 13.5,
    lineHeight: 1.4,
  },
  emptyState: {
    fontSize: 13.5,
    color: tokens.inkMuted,
    background: tokens.surfaceAlt,
    border: `1px dashed ${tokens.line}`,
    borderRadius: tokens.radiusSm,
    padding: '14px 16px',
    margin: 0,
  },
  tagLabel: {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    background: tokens.accentSoft,
    border: `1.5px dashed ${tokens.lineStrong}`,
    borderRadius: 6,
    padding: '5px 12px 5px 24px',
    fontFamily: tokens.fontMono,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: tokens.primaryDark,
  },
  tagHole: {
    position: 'absolute' as const,
    left: 9,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: tokens.bg,
    border: `1.5px dashed ${tokens.lineStrong}`,
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    border: `1px solid ${tokens.line}`,
    borderRadius: tokens.radiusSm,
    background: tokens.surfaceAlt,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  statValue: {
    fontFamily: tokens.fontDisplay,
    fontWeight: 800,
    fontSize: 24,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 12,
    color: tokens.inkMuted,
    marginTop: 4,
  },
  subheading: {
    fontFamily: tokens.fontDisplay,
    fontWeight: 700,
    fontSize: 16,
    margin: '0 0 10px',
    letterSpacing: '0.01em',
  },
  loteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
    padding: '10px 12px',
    border: `1px solid ${tokens.line}`,
    borderRadius: tokens.radiusSm,
    background: tokens.surfaceAlt,
  },
  loteRowMeta: {
    fontSize: 12.5,
    color: tokens.inkMuted,
  },
  chipWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  productChip: {
    fontFamily: tokens.fontMono,
    fontSize: 12.5,
    padding: '5px 10px',
    borderRadius: 6,
    background: tokens.surfaceAlt,
    border: `1px solid ${tokens.line}`,
    color: tokens.ink,
  },
  resultadoWrap: {
    marginTop: 18,
    paddingTop: 18,
    borderTop: `1px dashed ${tokens.line}`,
  },
  resultadoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  timelineList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  timelineItem: {
    display: 'flex',
    gap: 14,
  },
  timelineDotWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: tokens.tecnologiaSoft,
    color: tokens.tecnologia,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    background: tokens.line,
    minHeight: 24,
  },
  timelineContent: {
    paddingBottom: 18,
    flex: 1,
  },
  timelineTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginBottom: 6,
  },
  timelineRoute: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: tokens.fontMono,
    fontSize: 13,
    color: tokens.ink,
    flexWrap: 'wrap' as const,
  },
};