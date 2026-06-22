// ============================================================================
//  FEATURE: CADASTRO DE TRANSPORTE
//  Registra o envio de um lote entre remetente e destinatário.
// ============================================================================

import React, { useEffect, useState } from "react";
import type { Lote, Transporte } from "../../types";
import { apiService } from "../../services/apiService";
import { styles } from "../../design/tokens";
import { IconTruck, IconPlus } from "../../icons";
import {
  SectionCard,
  StatusBanner,
  PrimaryButton,
  TipoBadge,
  formatarCNPJ,
} from "../ui";

const CadastroTransporte: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [isLoadingLotes, setIsLoadingLotes] = useState(true);

  const [loteId, setLoteId] = useState("");
  const [nomeTransporte, setNomeTransporte] = useState("");
  const [cnpjRemetente, setCnpjRemetente] = useState("");
  const [cnpjDestinatario, setCnpjDestinatario] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<Transporte | null>(null);

  useEffect(() => {
    let ativo = true;
    apiService
      .listarLotes()
      .then((l) => {
        if (ativo) setLotes(l);
      })
      .catch((e: Error) => {
        if (ativo) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setIsLoadingLotes(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSubmitting(true);

    try {
      const novo = await apiService.criarTransporte({
        loteId,
        codigoEnvio: "",
        nome: nomeTransporte,
        cnpjRemetente,
        cnpjDestinatario,
      });
      setSucesso(novo);
      setNomeTransporte("");
      setCnpjRemetente("");
      setCnpjDestinatario("");
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar o transporte.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const loteSelecionado = lotes.find((l) => l.id === loteId) ?? null;
  const podeSalvar =
    Boolean(loteId) &&
    nomeTransporte.trim().length > 0 &&
    cnpjRemetente.trim().length > 0 &&
    cnpjDestinatario.trim().length > 0;

  return (
    <SectionCard
      icon={<IconTruck size={20} />}
      title="Cadastrar Transporte"
      description="Registre o envio de um lote entre um remetente e um destinatário."
    >
      {isLoadingLotes ? (
        <StatusBanner variant="loading">
          Carregando lotes disponíveis...
        </StatusBanner>
      ) : lotes.length === 0 ? (
        <p style={styles.emptyState}>
          Nenhum lote foi criado ainda. Cadastre um lote primeiro na aba
          &quot;Cadastrar Lote&quot;.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          {/* Passo 1 — lote */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="lote-transporte">
              1. Lote
            </label>
            <select
              id="lote-transporte"
              style={styles.select}
              value={loteId}
              onChange={(e) => setLoteId(e.target.value)}
            >
              <option value="">Selecione um lote...</option>
              {lotes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome || l.numeroSerie} — {l.tipoProduto} (
                  {l.qtdProdutos ?? l.produtosNumeroControle.length} produtos)
                </option>
              ))}
            </select>
            {loteSelecionado && (
              <div style={{ marginTop: 8 }}>
                <TipoBadge tipo={loteSelecionado.tipoProduto} />
              </div>
            )}
          </div>

          {/* Passo 2 — nome do transporte */}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="nome-transporte">
              2. Nome do transporte
            </label>
            <input
              id="nome-transporte"
              style={styles.input}
              placeholder="ex.: ENV-ECO-2026-001"
              value={nomeTransporte}
              onChange={(e) => setNomeTransporte(e.target.value)}
            />
          </div>

          {/* Passo 3 & 4 — CNPJs lado a lado */}
          <div className="ecotrack-field-row" style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="cnpj-remetente">
                3. CNPJ do remetente
              </label>
              <input
                id="cnpj-remetente"
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={cnpjRemetente}
                onChange={(e) => setCnpjRemetente(formatarCNPJ(e.target.value))}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="cnpj-destinatario">
                4. CNPJ do destinatário
              </label>
              <input
                id="cnpj-destinatario"
                style={styles.input}
                placeholder="00.000.000/0000-00"
                value={cnpjDestinatario}
                onChange={(e) =>
                  setCnpjDestinatario(formatarCNPJ(e.target.value))
                }
              />
            </div>
          </div>

          {erro && <StatusBanner variant="error">{erro}</StatusBanner>}
          {sucesso && (
            <StatusBanner variant="success">
              Transporte <strong>{sucesso.nome || sucesso.codigoEnvio}</strong>{" "}
              registrado com sucesso.
            </StatusBanner>
          )}

          <PrimaryButton
            type="submit"
            loading={isSubmitting}
            disabled={!podeSalvar}
          >
            <IconPlus size={15} /> Registrar transporte
          </PrimaryButton>
        </form>
      )}
    </SectionCard>
  );
};

export default CadastroTransporte;
