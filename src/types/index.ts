export type TipoPagamento = "pix" | "deposito" | "transferencia";

export interface Pessoa {
  id: string;
  nome: string;
  nomeBusca: string; // lowercase, sem acento, usado para prefix-search
  criadoEm: string; // ISO string
}

export interface Venda {
  id: string;
  tipoPagamento: TipoPagamento;
  pagtNome: string;
  pagtNomeId: string | null;
  clienteNome: string | null;
  clienteNomeId: string | null;
  data: string; // ISO string (yyyy-mm-dd)
  vendaConsig: string | null;
  valorCentavos: number;
  baixada: boolean;
  baixadaEm: string | null;
  criadoEm: string;
}

export interface NovaVendaInput {
  tipoPagamento: TipoPagamento;
  pagtNome: string;
  clienteNome?: string;
  data: string; // dd/mm/aaaa vindo do form
  vendaConsig?: string;
  valorCentavos: number;
}

export interface FiltrosBaixaInput {
  dataInicio?: string; // yyyy-mm-dd
  dataFim?: string; // yyyy-mm-dd
  nome?: string;
  tipoPagamento?: TipoPagamento;
}

export interface SessionPayload {
  usuario: string;
  loginEm: number;
  [key: string]: unknown;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  message?: string;
  data?: T;
}
