import React, { useState } from 'react';
import type { TipoProduto } from '../../types';
import { apiService } from '../../services/apiService';
import { styles } from '../../design/tokens';
import { IconPackage, IconPlus } from '../../icons';
import {
  SectionCard,
  StatusBanner,
  PrimaryButton,
} from '../ui';

const TIPOS_PRODUTO: TipoProduto[] = ['Reciclável', 'Orgânico', 'Tecnologia'];

function formatarCPF(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
  if (d.length > 6) return d.replace(/^(\d{3})(\d{3})(\d{0,3})$/, '$1.$2.$3');
  if (d.length > 3) return d.replace(/^(\d{3})(\d{0,3})$/, '$1.$2');
  return d;
}

const CadastroProduto: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoProduto | ''>('');
  const [qtd, setQtd] = useState<number>(1);
  const [creditos, setCreditos] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) { setErro('Escolha um tipo de produto.'); return; }
    if (cpf.replace(/\D/g, '').length < 11) { setErro('CPF inválido.'); return; }
    if (qtd < 1) { setErro('A quantidade deve ser no mínimo 1.'); return; }

    setErro(null);
    setSucesso(null);
    setIsSubmitting(true);

    try {
      await apiService.criarProduto(nome, tipo, qtd, cpf, creditos);
      setSucesso(`Produto "${nome}" registrado com sucesso.`);
      setNome('');
      setTipo('');
      setQtd(1);
      setCreditos(0);
      setCpf('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao registrar produto.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const podeSalvar =
    cpf.replace(/\D/g, '').length >= 11 && nome.trim().length > 0 && Boolean(tipo) && qtd >= 1;

  return (
    <SectionCard
      icon={<IconPackage size={20} />}
      title="Cadastrar Produto"
      description="Registre um novo produto descartado para iniciar o rastreamento."
    >
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="cpf-produto">CPF do cidadão</label>
          <input
            id="cpf-produto"
            style={styles.input}
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
          />
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="nome-produto">Nome do produto</label>
            <input
              id="nome-produto"
              style={styles.input}
              placeholder="ex.: Garrafa PET"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="tipo-produto">Tipo</label>
            <select
              id="tipo-produto"
              style={styles.select}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoProduto | '')}
            >
              <option value="">Selecione um tipo...</option>
              {TIPOS_PRODUTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="qtd-produto">Quantidade</label>
            <input
              id="qtd-produto"
              type="number"
              min={1}
              style={styles.input}
              value={qtd}
              onChange={(e) => setQtd(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="creditos-produto">Créditos (valor)</label>
            <input
              id="creditos-produto"
              type="number"
              min={0}
              style={styles.input}
              value={creditos}
              onChange={(e) => setCreditos(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>

        {erro && <StatusBanner variant="error">{erro}</StatusBanner>}
        {sucesso && <StatusBanner variant="success">{sucesso}</StatusBanner>}

        <PrimaryButton type="submit" loading={isSubmitting} disabled={!podeSalvar}>
          <IconPlus size={15} /> Registrar produto
        </PrimaryButton>
      </form>
    </SectionCard>
  );
};

export default CadastroProduto;
