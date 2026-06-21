// ============================================================================
//  CAMADA DE SERVIÇO (in-memory mock)
//
//  Os arrays abaixo simulam tabelas de banco de dados.
//  Para substituir por um backend real, reescreva o corpo de cada função
//  usando fetch() / axios — os componentes dependem apenas de ApiService.
//
//  Exemplo de migração:
//
//    criarLote: async (numeroSerie, tipoProduto, numerosControle) => {
//      const res = await fetch('/api/lotes', {
//        method: 'POST',
//        headers: { 'Content-Type': 'application/json' },
//        body: JSON.stringify({ numeroSerie, tipoProduto, numerosControle }),
//      });
//      if (!res.ok) throw new Error((await res.json()).message);
//      return res.json();
//    }
// ============================================================================

import type { ApiService, Lote, Produto, Transporte, NovoTransporteInput, TipoProduto } from '../types';

// ---------- helpers internos -------------------------------------------------

function delayDeRede(min = 500, max = 950): Promise<void> {
  const tempo = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, tempo));
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizarDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

// ---------- "banco de dados" em memória -------------------------------------

let _produtos: Produto[] = [
  { numeroControle: 'REC-7741', tipo: 'Reciclável' },
  { numeroControle: 'REC-7742', tipo: 'Reciclável' },
  { numeroControle: 'REC-7743', tipo: 'Reciclável' },
  { numeroControle: 'REC-7744', tipo: 'Reciclável' },
  { numeroControle: 'ORG-3310', tipo: 'Orgânico' },
  { numeroControle: 'ORG-3311', tipo: 'Orgânico' },
  { numeroControle: 'ORG-3312', tipo: 'Orgânico' },
  { numeroControle: 'TEC-9001', tipo: 'Tecnologia' },
  { numeroControle: 'TEC-9002', tipo: 'Tecnologia' },
  { numeroControle: 'TEC-9003', tipo: 'Tecnologia' },
];

let _lotes: Lote[] = [];
let _transportes: Transporte[] = [];

// ---------- implementação do contrato ----------------------------------------

export const apiService: ApiService = {
  async listarProdutosDisponiveisPorTipo(tipo: TipoProduto) {
    await delayDeRede();
    return _produtos
      .filter((p) => p.tipo === tipo && !p.loteId)
      .map((p) => ({ ...p }));
  },

  async listarLotes() {
    await delayDeRede();
    return [..._lotes]
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao))
      .map((l) => ({ ...l, produtosNumeroControle: [...l.produtosNumeroControle] }));
  },

  async criarLote(numeroSerie, tipoProduto, numerosControle) {
    await delayDeRede();

    const numeroSerieLimpo = numeroSerie.trim();
    if (!numeroSerieLimpo) throw new Error('Informe um número de série para o lote.');
    if (numerosControle.length === 0) throw new Error('Selecione ao menos um produto para compor o lote.');

    const jaExiste = _lotes.some(
      (l) => l.numeroSerie.toLowerCase() === numeroSerieLimpo.toLowerCase()
    );
    if (jaExiste) throw new Error(`Já existe um lote com o número de série "${numeroSerieLimpo}".`);

    const idsValidos = new Set(
      _produtos
        .filter((p) => p.tipo === tipoProduto && !p.loteId)
        .map((p) => p.numeroControle)
    );
    if (!numerosControle.every((nc) => idsValidos.has(nc))) {
      throw new Error(
        'Um ou mais produtos selecionados não estão mais disponíveis. Atualize a lista e tente novamente.'
      );
    }

    const novoLote: Lote = {
      id: gerarId('lote'),
      numeroSerie: numeroSerieLimpo,
      tipoProduto,
      produtosNumeroControle: [...numerosControle],
      dataCriacao: new Date().toISOString(),
    };

    _lotes.push(novoLote);
    _produtos = _produtos.map((p) =>
      numerosControle.includes(p.numeroControle) ? { ...p, loteId: novoLote.id } : p
    );

    return { ...novoLote };
  },

  async criarTransporte(input: NovoTransporteInput) {
    await delayDeRede();

    const codigoEnvio = input.codigoEnvio.trim();
    const cnpjRemetente = input.cnpjRemetente.trim();
    const cnpjDestinatario = input.cnpjDestinatario.trim();

    if (!input.loteId) throw new Error('Selecione um lote para registrar o transporte.');
    if (!codigoEnvio || !cnpjRemetente || !cnpjDestinatario)
      throw new Error('Preencha o código de envio e os CNPJs de remetente e destinatário.');
    if (normalizarDigitos(cnpjRemetente) === normalizarDigitos(cnpjDestinatario))
      throw new Error('O CNPJ do remetente não pode ser igual ao do destinatário.');

    const lote = _lotes.find((l) => l.id === input.loteId);
    if (!lote) throw new Error('O lote selecionado não foi encontrado. Ele pode ter sido removido.');

    const novoTransporte: Transporte = {
      id: gerarId('transp'),
      loteId: lote.id,
      codigoEnvio,
      cnpjRemetente,
      cnpjDestinatario,
      dataRegistro: new Date().toISOString(),
    };

    _transportes.push(novoTransporte);
    return { ...novoTransporte };
  },

  async rastrearLote(numeroSerie) {
    await delayDeRede();

    const termo = numeroSerie.trim();
    if (!termo) throw new Error('Digite o número de série de um lote para iniciar a busca.');

    const lote = _lotes.find(
      (l) => l.numeroSerie.toLowerCase() === termo.toLowerCase()
    );
    if (!lote) throw new Error(`Não encontramos nenhum lote com o número de série "${termo}".`);

    const produtos = _produtos.filter((p) => p.loteId === lote.id).map((p) => ({ ...p }));
    const transportes = _transportes
      .filter((t) => t.loteId === lote.id)
      .sort((a, b) => a.dataRegistro.localeCompare(b.dataRegistro))
      .map((t) => ({ ...t }));

    return { lote: { ...lote }, produtos, transportes };
  },

  async obterResumo() {
    await delayDeRede(350, 650);

    const ultimosLotes = [..._lotes]
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao))
      .slice(0, 5)
      .map((l) => ({ ...l }));

    return {
      totalProdutos: _produtos.length,
      produtosDisponiveis: _produtos.filter((p) => !p.loteId).length,
      totalLotes: _lotes.length,
      totalTransportes: _transportes.length,
      ultimosLotes,
    };
  },
};