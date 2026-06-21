// ============================================================================
//  FEATURE: CADASTRO DE LOTE
//  Agrupa produtos do mesmo tipo em um novo lote rastreável.
// ============================================================================

import React, { useEffect, useState } from 'react';
import type { Lote, Produto, TipoProduto } from '../../types';
import { apiService } from '../../services/apiService';
import { styles } from '../../design/tokens';
import { IconPackage, IconPlus } from '../../icons';
import {
  SectionCard,
  StatusBanner,
  PrimaryButton,
} from '../ui';

const TIPOS_PRODUTO: TipoProduto[] = ['Reciclável', 'Orgânico', 'Tecnologia'];

const CadastroLote: React.FC = () => {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoProduto | ''>('');
  const [produtos, setProdutos]               = useState<Produto[]>([]);
  const [selecionados, setSelecionados]       = useState<Set<string>>(new Set());
  const [numeroSerie, setNumeroSerie]         = useState('');

  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const [isSubmitting, setIsSubmitting]           = useState(false);
  const [erro, setErro]                           = useState<string | null>(null);
  const [sucesso, setSucesso]                     = useState<Lote | null>(null);

  // Busca produtos disponíveis sempre que o tipo muda
  useEffect(() => {
    if (!tipoSelecionado) { setProdutos([]); return; }

    let ativo = true;
    setIsLoadingProdutos(true);
    setErro(null);
    setSelecionados(new Set());

    apiService
      .listarProdutosDisponiveisPorTipo(tipoSelecionado)
      .then((lista) => { if (ativo) setProdutos(lista); })
      .catch((e: Error) => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setIsLoadingProdutos(false); });

    return () => { ativo = false; };
  }, [tipoSelecionado]);

  function alternarProduto(numeroControle: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(numeroControle) ? next.delete(numeroControle) : next.add(numeroControle);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoSelecionado) { setErro('Escolha um tipo de produto.'); return; }

    setErro(null);
    setSucesso(null);
    setIsSubmitting(true);

    try {
      const novoLote = await apiService.criarLote(
        numeroSerie,
        tipoSelecionado,
        Array.from(selecionados)
      );
      setSucesso(novoLote);
      setNumeroSerie('');
      setSelecionados(new Set());
      // Recarrega a lista para refletir os produtos que acabaram de entrar no lote
      const atualizados = await apiService.listarProdutosDisponiveisPorTipo(tipoSelecionado);
      setProdutos(atualizados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível registrar o lote.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const podeSalvar =
    Boolean(tipoSelecionado) && selecionados.size > 0 && numeroSerie.trim().length > 0;

  return (
    <SectionCard
      icon={<IconPackage size={20} />}
      title="Cadastrar Lote"
      description="Agrupe produtos do mesmo tipo em um novo lote para iniciar o rastreamento."
    >
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        {/* Passo 1 — tipo */}
        <div style={styles.field}>
          <label style={styles.label} htmlFor="tipo-produto">1. Tipo de produto</label>
          <select
            id="tipo-produto"
            style={styles.select}
            value={tipoSelecionado}
            onChange={(e) => setTipoSelecionado(e.target.value as TipoProduto | '')}
          >
            <option value="">Selecione um tipo...</option>
            {TIPOS_PRODUTO.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Passo 2 — lista de produtos */}
        {tipoSelecionado && (
          <div style={styles.field}>
            <label style={styles.label}>2. Produtos disponíveis ({tipoSelecionado})</label>

            {isLoadingProdutos && (
              <StatusBanner variant="loading">Buscando produtos disponíveis...</StatusBanner>
            )}

            {!isLoadingProdutos && produtos.length === 0 && (
              <p style={styles.emptyState}>
                Não há produtos do tipo &quot;{tipoSelecionado}&quot; disponíveis no momento.
                Eles podem já estar em algum lote.
              </p>
            )}

            {!isLoadingProdutos && produtos.length > 0 && (
              <div style={styles.checkboxList}>
                {produtos.map((p) => (
                  <label key={p.numeroControle} className="ecotrack-checkbox-row" style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selecionados.has(p.numeroControle)}
                      onChange={() => alternarProduto(p.numeroControle)}
                    />
                    <span style={styles.checkboxLabel}>{p.numeroControle}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passo 3 — número de série */}
        {tipoSelecionado && produtos.length > 0 && (
          <div style={styles.field}>
            <label style={styles.label} htmlFor="numero-serie">3. Número de série do novo lote</label>
            <input
              id="numero-serie"
              style={styles.input}
              placeholder="ex.: LOTE-2026-001"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
            />
            <span style={styles.helperText}>{selecionados.size} produto(s) selecionado(s)</span>
          </div>
        )}

        {erro && <StatusBanner variant="error">{erro}</StatusBanner>}
        {sucesso && (
          <StatusBanner variant="success">
            Lote <strong>{sucesso.numeroSerie}</strong> criado com{' '}
            {sucesso.produtosNumeroControle.length} produto(s).
          </StatusBanner>
        )}

        <PrimaryButton type="submit" loading={isSubmitting} disabled={!podeSalvar}>
          <IconPlus size={15} /> Registrar lote
        </PrimaryButton>
      </form>
    </SectionCard>
  );
};

export default CadastroLote;