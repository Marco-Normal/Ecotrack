import axios from 'axios';
import type {
  ApiService,
  EventoLogistico,
  Lote,
  Produto,
  Transporte,
  NovoTransporteInput,
  TipoProduto,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const API = axios.create({ baseURL: API_BASE });
const centroColeta = '33444555000103';

// Interceptor para transformar erros HTTP em mensagens amigáveis
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    }
    const status = err.response.status;
    if (status === 404) {
      const detail = err.response.data?.detail;
      throw new Error(detail ?? 'Nenhum registro encontrado.');
    }
    if (status === 500) {
      throw new Error('Erro.');
    }
    throw new Error(err.response.data?.detail ?? `Erro inesperado (${status}).`);
  }
);

// DB: 'Reciclavel' (sem acento) -> Frontend: 'Reciclável'
const TIPO_BACKEND: Record<string, string> = {
  'Orgânico': 'Orgânico',
  'Reciclável': 'Reciclavel',
  'Tecnologia': 'Tecnologia',
};

const TIPO_FRONTEND: Record<string, TipoProduto> = {
  'Orgânico': 'Orgânico',
  'Reciclavel': 'Reciclável',
  'Tecnologia': 'Tecnologia',
  // fallback
  'Reciclável': 'Reciclável',
};

function asTipoProduto(valor: string): TipoProduto {
  return TIPO_FRONTEND[valor] ?? (valor as TipoProduto);
}

function montarProduto(row: any): Produto {
  return {
    numeroControle: row.nroControle ?? '',
    nome: row.nome ?? '',
    tipo: asTipoProduto(row.tipo),
    pessoaCpf: row.pessoa ?? undefined,
    dataDescarte: row.dataHora ?? undefined,
  };
}

function montarLote(row: any, produtosNro: string[]): Lote {
  return {
    id: row.nroSerie ?? '',
    numeroSerie: row.nroSerie ?? '',
    nome: row.nome ?? undefined,
    tipoProduto: asTipoProduto(row.tipo),
    produtosNumeroControle: produtosNro,
    qtdProdutos: row.qtd_produtos ?? undefined,
    dataCriacao: row.dataHora ?? new Date().toISOString(),
  };
}

function montarTransporte(row: any): Transporte {
  return {
    id: row.codEnvio ?? '',
    loteId: row.lote ?? '',
    codigoEnvio: row.codEnvio ?? '',
    nome: row.nome ?? undefined,
    cnpjRemetente: row.remetente ?? '',
    cnpjDestinatario: row.destinatario ?? '',
    nomeRemetente: row.remetente_nome ?? undefined,
    nomeDestinatario: row.destinatario_nome ?? undefined,
    dataRegistro: '',
  };
}

export const apiService: ApiService = {

  async listarProdutosDisponiveisPorTipo(tipo: TipoProduto) {
    const { data } = await API.get('/api/produtos', {
      params: { tipo: TIPO_BACKEND[tipo] ?? tipo },
    });
    if (!Array.isArray(data)) return [];
    return data.map(montarProduto);
  },

  async listarLotes() {
    const { data } = await API.get('/api/lotes');
    if (!Array.isArray(data)) return [];
    const lotes: Lote[] = [];
    for (const row of data) {
      let produtosNro: string[] = [];
      try {
        const resp = await API.get(`/api/lotes/${row.nroSerie}/produtos`);
        produtosNro = resp.data.produtos ?? [];
      } catch { /* ignora */ }
      lotes.push(montarLote(row, produtosNro.map(String)));
    }
    return lotes;
  },

  async criarLote(numeroSerie: string, tipoProduto: TipoProduto, numerosControle: string[]) {
    const { data } = await API.post('/api/lotes', {
      nroSerie: numeroSerie,
      tipo: TIPO_BACKEND[tipoProduto] ?? tipoProduto,
      produtos: numerosControle,
    });
    return {
      id: data.nroSerie ?? '',
      numeroSerie: data.nroSerie ?? '',
      nome: data.nome ?? undefined,
      tipoProduto,
      produtosNumeroControle: numerosControle,
      dataCriacao: data.dataHora ?? new Date().toISOString(),
    };
  },

  async criarProduto(nome: string, tipo: TipoProduto, qtd: number, pessoa: string, creditos: number) {
    const { data } = await API.post('/api/produtos', {
      nome,
      tipo: TIPO_BACKEND[tipo] ?? tipo,
      centroColeta,
      qtd,
      pessoa,
      creditos,
    });
    return montarProduto(data);
  },

  async criarTransporte(input: NovoTransporteInput) {
    const { data } = await API.post('/api/transportes', {
      codEnvio: undefined,
      nome: input.nome,
      destinatario: input.cnpjDestinatario.replace(/\D/g, ''),
      remetente: input.cnpjRemetente.replace(/\D/g, ''),
      lote: input.loteId,
    });
    return montarTransporte(data);
  },

  async rastrearLote(numeroSerie: string) {
    const { data } = await API.get(`/api/rastrear/${numeroSerie}`);
    if (!data || !data.lote) throw new Error('Lote não encontrado');
    const lote = data.lote;
    const produtosNro = (data.produtos ?? []).map((p: any) => String(p.nroControle));
    return {
      lote: montarLote(lote, produtosNro),
      produtos: (data.produtos ?? []).map(montarProduto),
      transportes: (data.transportes ?? []).map(montarTransporte),
    };
  },

  async obterResumo() {
    const { data } = await API.get('/api/resumo');
    const c = data.contagens ?? {};
    const ultimos: Lote[] = (data.ultimos_lotes ?? []).map((row: any) => montarLote(row, []));
    return {
      totalProdutos: c.total_produtos ?? 0,
      produtosDisponiveis: c.produtos_disponiveis ?? 0,
      totalLotes: c.total_lotes ?? 0,
      totalTransportes: c.total_transportes ?? 0,
      ultimosLotes: ultimos,
    };
  },

  async buscarProdutosPorCpf(cpf: string) {
    const { data } = await API.get(`/api/produtos/${cpf}`);
    if (!Array.isArray(data)) return [];
    return data.map(montarProduto);
  },

  async obterLogisticaProduto(numeroControle: string) {
    const { data: rows } = await API.get(`/api/produtos/${numeroControle}/logistica`);
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Timeline não encontrada');
    }
    const produto: Produto = {
      numeroControle,
      nome: rows[0]?.nome_cidadao ?? '',
      tipo: asTipoProduto(rows[0]?.tipo_produto ?? 'Reciclavel'),
      dataDescarte: rows[0]?.horario_entrega ?? undefined,
    };
    const timeline: EventoLogistico[] = [
      {
        tipo: 'coleta',
        data: produto.dataDescarte ?? new Date().toISOString(),
        titulo: 'Recebido no Centro de Coleta',
        descricao: `Entregue e registrado no sistema.`,
      },

      ...rows
        .filter((r: any) => r.empresa_destino != null)
        .map((r: any) => {
          const data =
            r.horario_entrega ??
            r.data_transporte ??
            new Date().toISOString();

          const entregue = Boolean(r.horario_entrega);

          return {
            tipo: 'transporte' as const,
            data,
            titulo: entregue
              ? `Em trânsito para ${r.empresa_destino}`
              : `Entregue para ${r.empresa_destino}`,
            descricao: `${r.tipo_produto} — ${r.quantidade} unidade(s)${
              entregue ? ' (entrega pendente)' : ''
            }`,
          };
        }),
    ];
    return {
      produto,
      lote: null,
      transportes: rows.map((r: any) => ({
        id: '',
        loteId: '',
        codigoEnvio: '',
        cnpjRemetente: '',
        cnpjDestinatario: r.empresa_destino ?? '',
        dataRegistro: r.horario_entrega ?? '',
      })),
      timeline,
    };
  },
  // ... (dentro de export const apiService: ApiService = { ... )

  async buscarCidadao(cpf: string) {
    const { data } = await API.get(`/api/cidadao/${cpf}`);
    return data;
  },

  async listarEstoque() {
    const { data } = await API.get('/api/estoque');
    return data;
  },

  async realizarResgate(cpf: string, cnpj: string, tipo: string) {
    const { data } = await API.post('/api/resgatar', {
      cpf,
      cnpj: cnpj.replace(/\D/g, ''), // Limpa máscara de CNPJ se vier
      tipo: TIPO_BACKEND[tipo] ?? tipo,
    });
    return data;
  },
};
