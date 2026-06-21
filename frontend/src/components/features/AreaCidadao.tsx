// ============================================================================
//  FEATURE: ÁREA DO CIDADÃO
//
//  Fluxo em 4 passos:
//    1. O cidadão digita seu CPF e clica em "Acessar Meus Descartes"
//    2. (NOVO) O painel de créditos e recompensas disponíveis é exibido
//    3. A lista de produtos descartados é exibida
//    4. Ao clicar num produto, a linha do tempo logística é exibida inline
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
          <span style={{ fontWeight: 700, fontSize: 15, color: tokens.ink }}>{produto.nome}</span>
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: tokens.ink }}>{produto.nome}</span>
        <TipoBadge tipo={produto.tipo} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 12, color: tokens.inkMuted }}>{produto.nome}</span>
        {produto.dataDescarte && (
          <span style={{ fontSize: 12, color: tokens.inkMuted }}>
            · Descartado em {new Date(produto.dataDescarte).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
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

  // ESTADOS DA NOVA TRANSAÇÃO
  const [cidadao, setCidadao] = useState<{ cpf: string; nome: string; creditos: number } | null>(null);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [erroCidadao, setErroCidadao] = useState<string | null>(null);
  const [sucessoResgate, setSucessoResgate] = useState<string | null>(null);
  const [isResgatando, setIsResgatando] = useState(false);

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

    // Reseta o painel de resgate
    setCidadao(null);
    setErroCidadao(null);
    setSucessoResgate(null);

    try {
      // Carrega os descartes
      const lista = await apiService.buscarProdutosPorCpf(cpf);
      setProdutos(lista);

      // Carrega os dados do cidadão e o estoque simultaneamente
      try {
        const dadosCidadao = await apiService.buscarCidadao(cpf);
        setCidadao(dadosCidadao);
        const dadosEstoque = await apiService.listarEstoque();
        setEstoque(dadosEstoque);
      } catch (errC) {
        setErroCidadao('Não foi possível carregar os créditos ou as opções de resgate disponíveis.');
      }

    } catch (err) {
      setErroProdutos(err instanceof Error ? err.message : 'Erro ao buscar descartes.');
    } finally {
      setIsLoadingProdutos(false);
    }
  }

  // NOVA FUNÇÃO DE TRANSAÇÃO: Resgatar Recompensa
  async function handleResgatar(cnpj: string, tipo: string) {
    if (!cidadao) return;
    setErroCidadao(null);
    setSucessoResgate(null);
    setIsResgatando(true);
    
    try {
      const res = await apiService.realizarResgate(cidadao.cpf, cnpj, tipo);
      setSucessoResgate('Resgate processado com sucesso! Verifique seu email para mais detalhes.');
      
      // Atualiza o saldo localmente sem recarregar a tela (melhor UX)
      setCidadao({ ...cidadao, creditos: res.novo_saldo });
      
      // Atualiza o estoque para refletir a redução no backend
      const dadosEstoque = await apiService.listarEstoque();
      setEstoque(dadosEstoque);
    } catch (err: any) {
      setErroCidadao(err.message || 'Erro ao realizar o resgate.');
    } finally {
      setIsResgatando(false);
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
      description="Digite seu CPF para consultar seus descartes, acompanhar rastreamentos e resgatar recompensas."
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
                setCidadao(null);
              }}
            />
          </div>
          <PrimaryButton
            type="submit"
            loading={isLoadingProdutos}
            disabled={cpf.replace(/\D/g, '').length < 11}
          >
            <IconUser size={15} /> Acessar Painel
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
          <StatusBanner variant="loading">Consultando seus dados...</StatusBanner>
        </div>
      )}

      {erroProdutos && (
        <div style={{ marginTop: 20 }}>
          <StatusBanner variant="error">{erroProdutos}</StatusBanner>
        </div>
      )}

      {/* NOVO PASSO: Painel de Resgate */}
      {cidadao && (
        <div className="ecotrack-fade-in" style={{ marginTop: 28, padding: 20, border: `1.5px solid ${tokens.primarySoft}`, borderRadius: tokens.radius, background: tokens.surfaceAlt }}>
          <h3 style={{ ...styles.subheading, margin: '0 0 8px 0', color: tokens.primaryDark }}>
            Bem-vindo(a), {cidadao.nome}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 16 }}>
            Seu saldo disponível: <strong style={{ color: tokens.primary, fontSize: 18 }}> {cidadao.creditos} Créditos</strong>
          </p>

          {erroCidadao && <div style={{ marginBottom: 16 }}><StatusBanner variant="error">{erroCidadao}</StatusBanner></div>}
          
          {sucessoResgate && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: tokens.radiusSm, fontWeight: 600, fontSize: 14 }}>
              <IconCheck size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {sucessoResgate}
            </div>
          )}

          {estoque.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, color: tokens.inkMuted, fontWeight: 600 }}>Recompensas Disponíveis</h4>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {estoque.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: `1px solid ${tokens.line}`, borderRadius: tokens.radiusSm, background: tokens.surface }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: 14, color: tokens.ink }}>{item.empresa_nome}</strong>
                      <span style={{ fontSize: 13, color: tokens.inkMuted }}>{item.tipo} | Restam: {item.quantidade} unidades</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: tokens.accent, fontSize: 14 }}>{item.valor} pts</span>
                      <button
                        disabled={isResgatando || cidadao.creditos < item.valor}
                        onClick={() => handleResgatar(item.cnpj, item.tipo)}
                        style={{
                          padding: '6px 14px',
                          border: 'none',
                          borderRadius: tokens.radiusSm,
                          background: cidadao.creditos >= item.valor ? tokens.primary : tokens.lineStrong,
                          color: cidadao.creditos >= item.valor ? 'white' : tokens.inkMuted,
                          cursor: cidadao.creditos >= item.valor ? 'pointer' : 'not-allowed',
                          fontWeight: 600,
                          fontSize: 13,
                          fontFamily: 'inherit',
                          transition: 'background 0.2s'
                        }}
                      >
                        {isResgatando ? 'Aguarde...' : 'Resgatar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Passo 3: lista de produtos originais */}
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

                {/* Passo 4: timeline inline sob o produto selecionado */}
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