// ============================================================================
//  TIPOS DE DOMÍNIO
//  Única fonte da verdade para todas as interfaces e type aliases do EcoTrack.
//  Nenhum componente ou serviço define seus próprios tipos de negócio.
// ============================================================================

export type TipoProduto = 'Reciclável' | 'Orgânico' | 'Tecnologia';

export interface Produto {
  numeroControle: string;
  tipo: TipoProduto;
  loteId?: string;
}

export interface Lote {
  id: string;
  numeroSerie: string;
  tipoProduto: TipoProduto;
  produtosNumeroControle: string[];
  dataCriacao: string;
}

export interface Transporte {
  id: string;
  loteId: string;
  codigoEnvio: string;
  cnpjRemetente: string;
  cnpjDestinatario: string;
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
  cnpjRemetente: string;
  cnpjDestinatario: string;
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
  criarTransporte(input: NovoTransporteInput): Promise<Transporte>;
  rastrearLote(numeroSerie: string): Promise<ResultadoRastreio>;
  obterResumo(): Promise<ResumoPainel>;
}