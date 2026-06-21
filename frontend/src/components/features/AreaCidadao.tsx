// ============================================================================
//  FEATURE: ÁREA DO CIDADÃO
//
//  Fluxo em 3 passos:
//    1. O cidadão digita seu CPF e clica em "Acessar Meus Descartes"
//    2. A lista de produtos descartados é exibida
//    3. Ao clicar num produto, a linha do tempo logística é exibida inline
// ============================================================================

import React, { useState } from 'react';
import type { EventoLogistico, LogisticaProduto, Produto } from '../../types';
import { apiService } from '../../services/apiService';
import { tokens, styles } from '../../design/tokens';
import {
  IconUser,
  IconMapPin,
  IconTruck,
  IconPackage,
  IconCheck,
  IconLoader,
  IconChevronRight,
  IconX,
} from '../../icons';
import {
  SectionCard,
  StatusBanner,
  PrimaryButton,
  TipoBadge,
  TagLabel,
} from '../ui';

// ---------- helpers de formatação --------------------------------------------

function formatarCPF(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
  if (d.length > 6) return d.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  if (d.length > 3) return d.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
  return d;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------- sub-componente: ícone por tipo de evento -------------------------

const iconeEvento = (tipo: EventoLogistico['tipo']) => {
  switch (tipo) {
    case 'coleta':      return <IconMapPin size={14} />;
    case 'agrupamento': return <IconPackage size={14} />;
    case 'transporte':  return <IconTruck size={14} />;
    case 'aguardando':  return <IconLoader size={14} />;
  }
};

const corEvento = (tipo: EventoLogistico['tipo']): { bg: string; cor: string } => {
  switch (tipo) {
    case 'coleta':      return { bg: tokens.primarySoft,    cor: tokens.primaryDark };
    case 'agrupamento': return { bg: tokens.accentSoft,     cor: tokens.accent      };
    case 'transporte':  return { bg: tokens.tecnologiaSoft, cor: tokens.tecnologia  };
    case 'aguardando':  return { bg: tokens.surfaceAlt,     cor: tokens.inkMuted    };
  }
};

// ---------- sub-componente: linha do tempo -----------------------------------

const TimelineCidadao: React.FC<{ logistica: LogisticaProduto; onFechar: () => void }> = ({
  logistica,
  onFechar,
}) => {
  const { produto, timeline } = logistica;

  return (
    <div
      className="ecotrack-fade-in"
      style={{
        marginTop: 12,
        border: `1.5px solid ${tokens.line}`,
        borderRadius: tokens.radius,
        background: tokens.surface,
        overflow: 'hidden',
      }}
    >
      {/* cabeçalho do detalhe */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: tokens.surfaceAlt,
          borderBottom: `1px solid ${tokens.line}`,
          gap: 12,
          flexWrap: 'wrap' as const,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TagLabel>{produto.numeroControle}</TagLabel>
          <TipoBadge tipo={produto.tipo} />
        </div>
        <button
          onClick={onFechar}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            border: `1px solid ${tokens.line}`,
            borderRadius: tokens.radiusSm,
            background: tokens.surface,
            color: tokens.inkMuted,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <IconX size={13} /> Fechar
        </button>
      </div>

      {/* stepper vertical */}
      <div style={{ padding: '20px 20px 8px' }}>
        {timeline.map((evento, idx) => {
          const { bg, cor } = corEvento(evento.tipo);
          const isUltimo = idx === timeline.length - 1;
          const isAguardando = evento.tipo === 'aguardando';

          return (
            <div key={idx} style={{ display: 'flex', gap: 14 }}>
              {/* coluna da bolinha + linha */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: bg,
                    color: cor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                    border: isAguardando ? `2px dashed ${tokens.lineStrong}` : `2px solid ${bg}`,
                  }}
                >
                  {isAguardando
                    ? <span className="ecotrack-spin" style={{ display: 'inline-flex' }}>{iconeEvento(evento.tipo)}</span>
                    : iconeEvento(evento.tipo)
                  }
                </div>
                {!isUltimo && (
                  <div style={{ width: 2, flex: 1, background: tokens.line, minHeight: 28, margin: '4px 0' }} />
                )}
              </div>

              {/* conteúdo do evento */}
              <div style={{ paddingBottom: isUltimo ? 8 : 24, flex: 1, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: tokens.ink }}>
                    {evento.titulo}
                  </span>
                  {!isAguardando && (
                    <span style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: tokens.fontMono }}>
                      {formatarData(evento.data)}
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: tokens.inkMuted, lineHeight: 1.5 }}>
                  {evento.descricao}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* rodapé: resumo de status */}
      <div
        style={{
          margin: '4px 20px 16px',
          padding: '10px 14px',
          borderRadius: tokens.radiusSm,
          background: logistica.lote ? tokens.primarySoft : tokens.accentSoft,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: logistica.lote ? tokens.primaryDark : tokens.accent,
          fontWeight: 600,
        }}
      >
        <IconCheck size={14} />
        {logistica.transportes.length > 0
          ? `Produto já transportado ${logistica.transportes.length} vez(es).`
          : logistica.lote
          ? 'Produto agrupado em lote — aguardando transporte.'
          : 'Produto recebido — aguardando formação de lote.'}
      </div>
    </div>
  );
};

// ---------- sub-componente: linha da lista de produtos -----------------------

interface ProdutoRowProps {
  produto: Produto;
  selecionado: boolean;
  carregando: boolean;
  onSelecionar: () => void;
}

const ProdutoRow: React.FC<ProdutoRowProps> = ({ produto, selecionado, carregando, onSelecionar }) => (
  <button
    onClick={onSelecionar}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '12px 14px',
      border: `1.5px solid ${selecionado ? tokens.primary : tokens.line}`,
      borderRadius: tokens.radiusSm,
      background: selecionado ? tokens.primarySoft : tokens.surface,
      cursor: 'pointer',
      textAlign: 'left' as const,
      transition: 'border-color 0.15s, background 0.15s',
      fontFamily: 'inherit',
    }}
  >
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
      <TagLabel>{produto.numeroControle}</TagLabel>
      <TipoBadge tipo={produto.tipo} />
      {produto.dataDescarte && (
        <span style={{ fontSize: 12, color: tokens.inkMuted, fontFamily: tokens.fontMono }}>
          Descartado em {new Date(produto.dataDescarte).toLocaleDateString('pt-BR')}
        </span>
      )}
    </div>
    <div style={{ color: selecionado ? tokens.primary : tokens.inkMuted, display: 'flex' }}>
      {carregando
        ? <span className="ecotrack-spin" style={{ display: 'inline-flex' }}><IconLoader size={16} /></span>
        : <IconChevronRight size={16} />
      }
    </div>
  </button>
);

// ---------- componente principal ---------------------------------------------

const AreaCidadao: React.FC = () => {
  // Passo 1 — input de CPF
  const [cpf, setCpf] = useState('');
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);

  // Passo 2 — lista de produtos
  const [produtos, setProdutos] = useState<Produto[] | null>(null);

  // Passo 3 — logística do produto selecionado
  const [produtoSelecionado, setProdutoSelecionado] = useState<string | null>(null);
  const [logistica, setLogistica] = useState<LogisticaProduto | null>(null);
  const [isLoadingLogistica, setIsLoadingLogistica] = useState(false);
  const [erroLogistica, setErroLogistica] = useState<string | null>(null);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    setIsLoadingProdutos(true);
    setErroProdutos(null);
    setProdutos(null);
    setProdutoSelecionado(null);
    setLogistica(null);

    try {
      const lista = await apiService.buscarProdutosPorCpf(cpf);
      setProdutos(lista);
    } catch (err) {
      setErroProdutos(err instanceof Error ? err.message : 'Erro ao buscar descartes.');
    } finally {
      setIsLoadingProdutos(false);
    }
  }

  async function handleSelecionarProduto(numeroControle: string) {
    // toggle: clicar no mesmo fecha
    if (produtoSelecionado === numeroControle) {
      setProdutoSelecionado(null);
      setLogistica(null);
      return;
    }

    setProdutoSelecionado(numeroControle);
    setLogistica(null);
    setErroLogistica(null);
    setIsLoadingLogistica(true);

    try {
      const resultado = await apiService.obterLogisticaProduto(numeroControle);
      setLogistica(resultado);
    } catch (err) {
      setErroLogistica(err instanceof Error ? err.message : 'Erro ao carregar rastreamento.');
    } finally {
      setIsLoadingLogistica(false);
    }
  }

  return (
    <SectionCard
      icon={<IconUser size={20} />}
      title="Área do Cidadão"
      description="Digite seu CPF para visualizar todos os seus produtos descartados e acompanhar o rastreamento de cada um."
    >
      {/* Passo 1: formulário de CPF */}
      <form onSubmit={handleBuscar} style={styles.formGrid}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
          <div style={{ ...styles.field, maxWidth: 320 }}>
            <input
              id="cpf-cidadao"
              style={styles.input}
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(formatarCPF(e.target.value));
                // Limpa resultados anteriores ao editar
                setProdutos(null);
                setProdutoSelecionado(null);
                setLogistica(null);
                setErroProdutos(null);
              }}
            />
          </div>
          <PrimaryButton
            type="submit"
            loading={isLoadingProdutos}
            disabled={cpf.replace(/\D/g, '').length < 11}
          >
            <IconUser size={15} /> Acessar Meus Descartes
          </PrimaryButton>
        </div>

        {/* dica de CPF para teste */}
        {!produtos && !erroProdutos && !isLoadingProdutos && (
          <p style={{ ...styles.helperText, margin: 0 }}>
            CPFs de teste: <code style={{ fontFamily: tokens.fontMono }}>123.456.789-00</code> (4 produtos)
            ou <code style={{ fontFamily: tokens.fontMono }}>987.654.321-00</code> (2 produtos).
          </p>
        )}
      </form>

      {isLoadingProdutos && (
        <div style={{ marginTop: 20 }}>
          <StatusBanner variant="loading">Consultando seus descartes...</StatusBanner>
        </div>
      )}

      {erroProdutos && (
        <div style={{ marginTop: 20 }}>
          <StatusBanner variant="error">{erroProdutos}</StatusBanner>
        </div>
      )}

      {/* Passo 2: lista de produtos */}
      {produtos && produtos.length > 0 && (
        <div className="ecotrack-fade-in" style={{ marginTop: 28 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ ...styles.subheading, margin: 0 }}>
              {produtos.length} produto(s) encontrado(s)
            </h3>
            <p style={{ ...styles.helperText, margin: '4px 0 0' }}>
              Clique em um produto para ver o rastreamento completo.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {produtos.map((produto) => (
              <div key={produto.numeroControle}>
                <ProdutoRow
                  produto={produto}
                  selecionado={produtoSelecionado === produto.numeroControle}
                  carregando={isLoadingLogistica && produtoSelecionado === produto.numeroControle}
                  onSelecionar={() => handleSelecionarProduto(produto.numeroControle)}
                />

                {/* Passo 3: timeline inline sob o produto selecionado */}
                {produtoSelecionado === produto.numeroControle && !isLoadingLogistica && erroLogistica && (
                  <div style={{ marginTop: 8 }}>
                    <StatusBanner variant="error">{erroLogistica}</StatusBanner>
                  </div>
                )}

                {produtoSelecionado === produto.numeroControle && !isLoadingLogistica && logistica && (
                  <TimelineCidadao
                    logistica={logistica}
                    onFechar={() => { setProdutoSelecionado(null); setLogistica(null); }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default AreaCidadao;