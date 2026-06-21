// ============================================================================
//  COMPONENTES DE UI REUTILIZÁVEIS
//
//  Cada componente aqui é genérico e sem lógica de negócio — apenas recebe
//  props bem tipadas e renderiza. Podem ser usados em qualquer feature do
//  EcoTrack (ou importados em outros projetos) sem modificação.
// ============================================================================

import React from 'react';
import type { TipoProduto } from '../../types';
import { tokens, styles, GLOBAL_CSS } from '../../design/tokens';
import {
  IconLoader,
  IconAlert,
  IconCheck,
  IconRecycle,
  IconLeaf,
  IconCpu,
} from '../../icons';
import type { IconProps } from '../../icons';

// ---------- GlobalStyles -----------------------------------------------------

/** Injeta o CSS global do EcoTrack uma única vez na <head>. */
export const GlobalStyles: React.FC = () => <style>{GLOBAL_CSS}</style>;

// ---------- StatusBanner -----------------------------------------------------

export type StatusVariant = 'loading' | 'error' | 'success';

interface StatusBannerProps {
  variant: StatusVariant;
  children: React.ReactNode;
}

/**
 * Banner de feedback de estado (loading / error / success).
 * Animate-in automático via classe CSS.
 */
export const StatusBanner: React.FC<StatusBannerProps> = ({ variant, children }) => {
  const config: Record<
    StatusVariant,
    { bg: string; color: string; Icone: React.FC<IconProps>; spin: boolean }
  > = {
    loading: { bg: tokens.surfaceAlt, color: tokens.inkMuted, Icone: IconLoader, spin: true },
    error:   { bg: tokens.dangerSoft,  color: tokens.danger,   Icone: IconAlert,  spin: false },
    success: { bg: tokens.primarySoft, color: tokens.primaryDark, Icone: IconCheck, spin: false },
  };
  const conf = config[variant];
  const Icone = conf.Icone;

  return (
    <div
      className="ecotrack-fade-in"
      style={{ ...styles.banner, background: conf.bg, color: conf.color }}
    >
      <span className={conf.spin ? 'ecotrack-spin' : undefined} style={{ display: 'inline-flex' }}>
        <Icone size={16} />
      </span>
      <span>{children}</span>
    </div>
  );
};

// ---------- PrimaryButton ----------------------------------------------------

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/**
 * Botão primário com estado de carregamento integrado.
 * Desabilitado automaticamente quando `loading` ou `disabled` é verdadeiro.
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  loading,
  disabled,
  style,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className="ecotrack-primary-btn"
    style={{
      ...styles.primaryButton,
      ...((disabled || loading) ? styles.primaryButtonDisabled : {}),
      ...style,
    }}
  >
    {loading && (
      <span className="ecotrack-spin" style={{ display: 'inline-flex' }}>
        <IconLoader size={15} />
      </span>
    )}
    {children}
  </button>
);

// ---------- SectionCard ------------------------------------------------------

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

/**
 * Card com cabeçalho icônico padronizado para cada seção/feature.
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  description,
  children,
}) => (
  <div style={styles.sectionCard}>
    <div style={styles.sectionHeader}>
      <div style={styles.sectionIconWrap}>{icon}</div>
      <div>
        <h2 style={styles.sectionTitle}>{title}</h2>
        <p style={styles.sectionDesc}>{description}</p>
      </div>
    </div>
    <div>{children}</div>
  </div>
);

// ---------- TagLabel ---------------------------------------------------------

/**
 * Etiqueta visual com "furo" decorativo — usada para números de série e
 * códigos de envio.
 */
export const TagLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={styles.tagLabel}>
    <span style={styles.tagHole} />
    <span>{children}</span>
  </span>
);

// ---------- TipoBadge --------------------------------------------------------

/** Retorna cor, fundo e ícone para cada TipoProduto. */
export function tipoMeta(tipo: TipoProduto) {
  switch (tipo) {
    case 'Reciclável': return { cor: tokens.reciclavel, fundo: tokens.reciclavelSoft, Icone: IconRecycle };
    case 'Orgânico':   return { cor: tokens.organico,   fundo: tokens.organicoSoft,   Icone: IconLeaf    };
    case 'Tecnologia': return { cor: tokens.tecnologia, fundo: tokens.tecnologiaSoft, Icone: IconCpu     };
  }
}

/**
 * Pill colorida com ícone para indicar o tipo de produto de um lote.
 */
export const TipoBadge: React.FC<{ tipo: TipoProduto }> = ({ tipo }) => {
  const meta = tipoMeta(tipo);
  const Icone = meta.Icone;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: meta.fundo,
        color: meta.cor,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      <Icone size={13} />
      {tipo}
    </span>
  );
};

// ---------- StatCard ---------------------------------------------------------

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}

/**
 * Cartão numérico para o painel de métricas.
 */
export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIconWrap, color: accent, background: `${accent}1A` }}>
      {icon}
    </div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

// ---------- utilitário de formatação ----------------------------------------

/** Aplica máscara progressiva de CNPJ enquanto o usuário digita. */
export function formatarCNPJ(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14);
  if (d.length > 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})$/, '$1.$2.$3/$4-$5');
  if (d.length > 8)  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/,        '$1.$2.$3/$4');
  if (d.length > 5)  return d.replace(/^(\d{2})(\d{3})(\d{0,3})$/,               '$1.$2.$3');
  if (d.length > 2)  return d.replace(/^(\d{2})(\d{0,3})$/,                      '$1.$2');
  return d;
}