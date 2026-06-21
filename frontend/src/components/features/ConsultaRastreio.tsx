// ============================================================================
//  FEATURE: CONSULTA / RASTREIO DE LOTE
//  Busca paramétrica por número de série e exibe produtos + histórico de
//  transporte em linha do tempo.
// ============================================================================

import React, { useState } from 'react';
import type { ResultadoRastreio } from '../../types';
import { apiService } from '../../services/apiService';
import { tokens, styles } from '../../design/tokens';
import { IconSearch, IconTruck } from '../../icons';
import {
  SectionCard,
  StatusBanner,
  PrimaryButton,
  TagLabel,
  TipoBadge,
} from '../ui';

const ConsultaRastreio: React.FC = () => {
  const [termo, setTermo]                         = useState('');
  const [isLoading, setIsLoading]                 = useState(false);
  const [erro, setErro]                           = useState<string | null>(null);
  const [resultado, setResultado]                 = useState<ResultadoRastreio | null>(null);
  const [buscou, setBuscou]                       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErro(null);
    setBuscou(true);

    try {
      const r = await apiService.rastrearLote(termo);
      setResultado(r);
    } catch (err) {
      setResultado(null);
      setErro(err instanceof Error ? err.message : 'Não foi possível concluir a busca.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SectionCard
      icon={<IconSearch size={20} />}
      title="Rastrear Lote"
      description="Digite o número de série de um lote para ver seu conteúdo e o histórico de transporte."
    >
      <form onSubmit={handleSubmit} style={{ ...styles.formGrid, marginBottom: 8 }}>
        <div className="ecotrack-field-row" style={styles.fieldRow}>
          <div style={{ ...styles.field, flex: 2 }}>
            <label style={styles.label} htmlFor="busca-lote">Número de série do lote</label>
            <input
              id="busca-lote"
              style={styles.input}
              placeholder="ex.: LOTE-2026-001"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <PrimaryButton type="submit" loading={isLoading} disabled={!termo.trim()}>
              <IconSearch size={15} /> Rastrear
            </PrimaryButton>
          </div>
        </div>
      </form>

      {!buscou && !isLoading && (
        <p style={styles.emptyState}>Informe um número de série para começar o rastreio.</p>
      )}
      {isLoading && <StatusBanner variant="loading">Procurando o lote na base de dados...</StatusBanner>}
      {buscou && !isLoading && erro && <StatusBanner variant="error">{erro}</StatusBanner>}

      {buscou && !isLoading && !erro && resultado && (
        <div className="ecotrack-fade-in" style={styles.resultadoWrap}>

          {/* Cabeçalho do lote encontrado */}
          <div style={styles.resultadoHeader}>
            <TagLabel>{resultado.lote.numeroSerie}</TagLabel>
            <TipoBadge tipo={resultado.lote.tipoProduto} />
            <span style={styles.loteRowMeta}>
              criado em {new Date(resultado.lote.dataCriacao).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* Produtos */}
          <div style={{ marginTop: 20 }}>
            <h3 style={styles.subheading}>Produtos no lote ({resultado.produtos.length})</h3>
            <div style={styles.chipWrap}>
              {resultado.produtos.map((p) => (
                <span key={p.numeroControle} style={styles.productChip}>
                  {p.numeroControle}
                </span>
              ))}
            </div>
          </div>

          {/* Histórico de transporte */}
          <div style={{ marginTop: 24 }}>
            <h3 style={styles.subheading}>
              Histórico de transporte ({resultado.transportes.length})
            </h3>

            {resultado.transportes.length === 0 ? (
              <p style={styles.emptyState}>
                Este lote ainda não possui nenhum transporte registrado.
              </p>
            ) : (
              <div style={styles.timelineList}>
                {resultado.transportes.map((t, idx) => (
                  <div key={t.id} style={styles.timelineItem}>
                    {/* Eixo visual da timeline */}
                    <div style={styles.timelineDotWrap}>
                      <div style={styles.timelineDot}>
                        <IconTruck size={13} />
                      </div>
                      {idx < resultado.transportes.length - 1 && (
                        <div style={styles.timelineLine} />
                      )}
                    </div>

                    {/* Conteúdo do evento */}
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineTop}>
                        <TagLabel>{t.codigoEnvio}</TagLabel>
                        <span style={styles.loteRowMeta}>
                          {new Date(t.dataRegistro).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div style={styles.timelineRoute}>
                        <span>{t.cnpjRemetente}</span>
                        <span style={{ color: tokens.accent }}>→</span>
                        <span>{t.cnpjDestinatario}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default ConsultaRastreio;