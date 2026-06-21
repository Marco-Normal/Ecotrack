// ============================================================================
//  FEATURE: PAINEL GERAL
//  Visão rápida de métricas e últimos lotes criados.
// ============================================================================

import React, { useEffect, useState } from 'react';
import type { ResumoPainel } from '../../types';
import { apiService } from '../../services/apiService';
import { tokens, styles } from '../../design/tokens';
import { IconLayout, IconPackage, IconTruck } from '../../icons';
import {
  SectionCard,
  StatusBanner,
  StatCard,
  TagLabel,
  TipoBadge,
} from '../ui';

const Painel: React.FC = () => {
  const [resumo, setResumo] = useState<ResumoPainel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setIsLoading(true);
    setErro(null);

    apiService
      .obterResumo()
      .then((r) => { if (ativo) setResumo(r); })
      .catch((e: Error) => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setIsLoading(false); });

    return () => { ativo = false; };
  }, []);

  return (
    <SectionCard
      icon={<IconLayout size={20} />}
      title="Painel Geral"
      description="Visão rápida do andamento da sua operação de descarte sustentável."
    >
      {isLoading && <StatusBanner variant="loading">Carregando indicadores...</StatusBanner>}
      {erro && <StatusBanner variant="error">{erro}</StatusBanner>}

      {!isLoading && resumo && (
        <>
          <div className="ecotrack-dashboard-grid" style={styles.dashboardGrid}>
            <StatCard label="Produtos disponíveis"    value={resumo.produtosDisponiveis} icon={<IconPackage size={18} />} accent={tokens.primary}   />
            <StatCard label="Total de produtos"       value={resumo.totalProdutos}       icon={<IconPackage size={18} />} accent={tokens.inkMuted}  />
            <StatCard label="Lotes registrados"       value={resumo.totalLotes}          icon={<IconPackage size={18} />} accent={tokens.accent}    />
            <StatCard label="Transportes registrados" value={resumo.totalTransportes}    icon={<IconTruck   size={18} />} accent={tokens.tecnologia} />
          </div>

          <div style={{ marginTop: 28 }}>
            <h3 style={styles.subheading}>Últimos lotes criados</h3>

            {resumo.ultimosLotes.length === 0 ? (
              <p style={styles.emptyState}>
                Nenhum lote criado ainda. Comece pela aba &quot;Cadastrar Lote&quot;.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resumo.ultimosLotes.map((l) => (
                  <div key={l.id} style={styles.loteRow}>
                    <TagLabel>{l.nome || l.numeroSerie}</TagLabel>
                    <TipoBadge tipo={l.tipoProduto} />
                    <span style={styles.loteRowMeta}>{l.qtdProdutos ?? l.produtosNumeroControle.length} produto(s)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </SectionCard>
  );
};

export default Painel;