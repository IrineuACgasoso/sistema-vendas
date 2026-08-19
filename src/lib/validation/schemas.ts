import { z } from "zod";

export const tipoPagamentoSchema = z.enum(["pix", "deposito", "transferencia"]);

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Informe o usuário").max(100),
  senha: z.string().min(1, "Informe a senha").max(200),
});

export const brDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const novaVendaSchema = z.object({
  tipoPagamento: tipoPagamentoSchema,
  promissoria: z.boolean().default(false),
  pagtNome: z.string().trim().min(1, "Informe o nome do pagante").max(200),
  clienteNome: z.string().trim().max(200).optional().or(z.literal("")),
  data: z
    .string()
    .regex(brDateRegex, "Data deve estar no formato dd/mm/aaaa"),
  vendaConsig: z.string().trim().max(100).optional().or(z.literal("")),
  valorCentavos: z
    .number()
    .int("Valor inválido")
    .min(1, "Informe um valor maior que zero")
    .max(100_000_000_00, "Valor excede o limite permitido"),
});

export const filtrosBaixaSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  nome: z.string().trim().max(200).optional(),
  tipoPagamento: tipoPagamentoSchema.optional(),
  promissoria: z.boolean().optional(),
});

export const darBaixaSchema = z.object({
  vendaIds: z.array(z.string().min(1)).min(1, "Selecione ao menos uma venda"),
  senhaConfirmacao: z.string().min(1, "Senha obrigatória para confirmar"),
});

export const fecharVendasSchema = z.object({
  vendaIds: z.array(z.string().min(1)).min(1, "Selecione ao menos uma venda"),
});

export const adicionarNumeroVendaSchema = z.object({
  vendaId: z.string().min(1),
  vendaConsig: z.string().trim().min(1, "Informe o número da venda").max(100),
});

export const editarVendaSchema = z.object({
  vendaId: z.string().min(1),
  pagtNome: z.string().trim().min(1, "Informe o nome do pagante").max(200),
  vendaConsig: z.string().trim().max(100).optional().or(z.literal("")),
  valorCentavos: z
    .number()
    .int("Valor inválido")
    .min(1, "Informe um valor maior que zero")
    .max(100_000_000_00, "Valor excede o limite permitido"),
});

export const excluirVendasSchema = z.object({
  vendaIds: z.array(z.string().min(1)).min(1, "Selecione ao menos uma venda"),
  senhaConfirmacao: z.string().min(1, "Senha obrigatória para confirmar"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type NovaVendaFormInput = z.infer<typeof novaVendaSchema>;
export type FiltrosBaixaFormInput = z.infer<typeof filtrosBaixaSchema>;
export type DarBaixaInput = z.infer<typeof darBaixaSchema>;
export type FecharVendasInput = z.infer<typeof fecharVendasSchema>;
export type AdicionarNumeroVendaInput = z.infer<typeof adicionarNumeroVendaSchema>;
export type EditarVendaInput = z.infer<typeof editarVendaSchema>;
export type ExcluirVendasInput = z.infer<typeof excluirVendasSchema>;