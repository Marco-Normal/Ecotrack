// ============================================================================
//  TIPOS DE DOMÍNIO
//  Única fonte da verdade para todas as interfaces e type aliases do EcoTrack.
//  Nenhum componente ou serviço define seus próprios tipos de negócio.
// ============================================================================

export type TipoProduto = 'Reciclável' | 'Orgânico' | 'Tecnologia';

export interface Produto {
  numeroControle: string;
  nome: string;
  tipo: TipoProduto;
  loteId?: string;
  /** CPF do cidadão que realizou o descarte. Opcional para produtos sem vínculo. */
  pessoaCpf?: string;
  /** Data em que o produto foi entregue no centro de coleta. */
  dataDescarte?: string;
}

export interface Lote {
  id: string;
  numeroSerie: string;
  nome?: string;
  tipoProduto: TipoProduto;
  produtosNumeroControle: string[];
  qtdProdutos?: number;
  dataCriacao: string;
}

export interface Transporte {
  id: string;
  loteId: string;
  codigoEnvio: string;
  nome?: string;
  cnpjRemetente: string;
  cnpjDestinatario: string;
  nomeRemetente?: string;
  nomeDestinatario?: string;
  dataRegistro: string;
}

export interface ResultadoRastreio {
  lote: Lote;
  produtos: Produto[];
  transportes: Transporte[];
}

export interface ResumoPainel {
  totalProdutos: number;
  produtosDisponiveis: number;
  totalLotes: number;
  totalTransportes: number;
  ultimosLotes: Lote[];
}

export interface NovoTransporteInput {
  loteId: string;
  codigoEnvio: string;
  nome?: string;
  cnpjRemetente: string;
  cnpjDestinatario: string;
}

// ---------- Área do Cidadão --------------------------------------------------

/** Um passo da linha do tempo logística de um produto. */
export interface EventoLogistico {
  tipo: 'coleta' | 'agrupamento' | 'transporte' | 'aguardando';
  data: string;
  titulo: string;
  descricao: string;
}

/** Resposta completa do rastreio de um produto individual do cidadão. */
export interface LogisticaProduto {
  produto: Produto;
  lote: Lote | null;
  transportes: Transporte[];
  /** Linha do tempo ordenada cronologicamente, pronta para renderizar. */
  timeline: EventoLogistico[];
}

/**
 * Contrato da camada de serviço.
 * Para conectar um backend real, basta reimplementar esta interface —
 * nenhum componente precisa mudar.
 */
export interface ApiService {
  listarProdutosDisponiveisPorTipo(tipo: TipoProduto): Promise<Produto[]>;
  listarLotes(): Promise<Lote[]>;
  criarLote(
    numeroSerie: string,
    tipoProduto: TipoProduto,
    numerosControle: string[]
  ): Promise<Lote>;
  criarProduto(
    nome: string,
    tipo: TipoProduto,
    qtd: number,
    pessoa: string,
    creditos: number
  ): Promise<Produto>;
  criarTransporte(input: NovoTransporteInput): Promise<Transporte>;
  rastrearLote(numeroSerie: string): Promise<ResultadoRastreio>;
  obterResumo(): Promise<ResumoPainel>;
  /** Área do Cidadão: retorna todos os produtos descartados pelo CPF informado. */
  buscarProdutosPorCpf(cpf: string): Promise<Produto[]>;
  /** Área do Cidadão: retorna a linha do tempo logística completa de um produto. */
  obterLogisticaProduto(numeroControle: string): Promise<LogisticaProduto>;
  // para restade dos credtios
  buscarCidadao: (cpf: string) => Promise<{ cpf: string; nome: string; creditos: number }>;
  listarEstoque: () => Promise<{ cnpj: string; empresa_nome: string; tipo: string; valor: number; quantidade: number }[]>;
  realizarResgate: (cpf: string, cnpj: string, tipo: string) => Promise<{ sucesso: boolean; novo_saldo: number }>;
}