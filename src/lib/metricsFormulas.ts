/**
 * Fórmulas puras e definições das 12 métricas do RF013 para a tela "Métricas".
 */

export interface MetricsInput {
  valorInvestido: number;
  faturamentoBruto: number;
  produtosVendidos: number;
  linksAtivos: number;
  cliquesTotais: number;
  checkouts: number;
  visitantes: number;
  conversoes: number;
  reembolsos: number;
}

export interface MetricsDataPoint {
  dateLabel: string;
  fullDate: string;
  input: MetricsInput;
}

export type MetricFormatType = "currency" | "percent" | "integer";

export type StandardMetricId =
  | "roi"
  | "taxaCheckout"
  | "taxaConversao"
  | "valorInvestido"
  | "produtosVendidos"
  | "lucroLiquido"
  | "faturamentoBruto"
  | "linksAtivos"
  | "cpc"
  | "cpa"
  | "cliquesTotais"
  | "taxaReembolso";

export interface StandardMetricDefinition {
  id: StandardMetricId;
  title: string;
  shortDescription: string;
  formulaLabel: string;
  format: MetricFormatType;
  chartColor: string;
  /** Define se aparece direto na grade principal (9) ou fica disponível para seleção (3) */
  defaultVisible: boolean;
  semanticColor?: boolean;
  compute: (input: MetricsInput) => number | null;
}

export function safeDivide(
  numerator: number,
  denominator: number
): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  if (denominator === 0) {
    return null;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function calcLucroLiquido(input: MetricsInput): number {
  return input.faturamentoBruto - input.valorInvestido - input.reembolsos;
}

export function calcROI(input: MetricsInput): number | null {
  const lucro = calcLucroLiquido(input);
  const ratio = safeDivide(lucro, input.valorInvestido);
  return ratio === null ? null : ratio * 100;
}

export function calcTaxaCheckout(input: MetricsInput): number | null {
  const ratio = safeDivide(input.checkouts, input.cliquesTotais);
  return ratio === null ? null : ratio * 100;
}

export function calcTaxaConversao(input: MetricsInput): number | null {
  const ratio = safeDivide(input.conversoes, input.visitantes);
  return ratio === null ? null : ratio * 100;
}

export function calcCPC(input: MetricsInput): number | null {
  return safeDivide(input.valorInvestido, input.cliquesTotais);
}

export function calcCPA(input: MetricsInput): number | null {
  return safeDivide(input.valorInvestido, input.conversoes);
}

export function calcTaxaReembolso(input: MetricsInput): number | null {
  const ratio = safeDivide(input.reembolsos, input.produtosVendidos);
  return ratio === null ? null : ratio * 100;
}

/**
 * Exatamente as 12 métricas definidas no RF013:
 * - 9 exibidas por padrão na grade principal (`defaultVisible: true`)
 * - 3 reservadas para o usuário selecionar na seção personalizada (`defaultVisible: false`)
 */
export const STANDARD_METRICS: readonly StandardMetricDefinition[] = [
  {
    id: "roi",
    title: "Retorno sobre investimentos",
    shortDescription: "Percentual de ganho ou perda em relação ao capital investido.",
    formulaLabel: "(Lucro líquido ÷ Valor investido) × 100",
    format: "percent",
    chartColor: "#10b981",
    defaultVisible: true,
    semanticColor: true,
    compute: calcROI,
  },
  {
    id: "taxaCheckout",
    title: "Taxa de checkout",
    shortDescription: "Proporção de cliques que avançaram até a etapa de pagamento.",
    formulaLabel: "(Checkouts ÷ Cliques totais) × 100",
    format: "percent",
    chartColor: "#3b82f6",
    defaultVisible: true,
    compute: calcTaxaCheckout,
  },
  {
    id: "taxaConversao",
    title: "Taxa de conversão",
    shortDescription: "Percentual de visitantes únicos que concluíram uma compra.",
    formulaLabel: "(Número de conversões ÷ Total de visitantes) × 100",
    format: "percent",
    chartColor: "#8b5cf6",
    defaultVisible: true,
    compute: calcTaxaConversao,
  },
  {
    id: "valorInvestido",
    title: "Valor investido",
    shortDescription: "Soma total aplicada em anúncios e ações de divulgação no período.",
    formulaLabel: "Soma dos gastos com anúncios e divulgação",
    format: "currency",
    chartColor: "#f59e0b",
    defaultVisible: true,
    compute: (input) => input.valorInvestido,
  },
  {
    id: "produtosVendidos",
    title: "Quantidade de produtos vendidos",
    shortDescription: "Total de unidades comercializadas através dos seus links.",
    formulaLabel: "Total de itens vendidos no período",
    format: "integer",
    chartColor: "#06b6d4",
    defaultVisible: true,
    compute: (input) => Math.round(input.produtosVendidos),
  },
  {
    id: "lucroLiquido",
    title: "Lucro líquido",
    shortDescription: "Resultado final após descontar investimento e reembolsos.",
    formulaLabel: "Faturamento bruto − Valor investido − Reembolsos",
    format: "currency",
    chartColor: "#10b981",
    defaultVisible: true,
    semanticColor: true,
    compute: calcLucroLiquido,
  },
  {
    id: "faturamentoBruto",
    title: "Faturamento Bruto",
    shortDescription: "Receita total gerada pelas vendas antes das deduções.",
    formulaLabel: "Soma total das vendas confirmadas",
    format: "currency",
    chartColor: "#2563eb",
    defaultVisible: true,
    compute: (input) => input.faturamentoBruto,
  },
  {
    id: "linksAtivos",
    title: "Quantidade de links ativos",
    shortDescription: "Links de afiliado publicados e recebendo tráfego no período.",
    formulaLabel: "Total de links ativos na operação",
    format: "integer",
    chartColor: "#6366f1",
    defaultVisible: true,
    compute: (input) => Math.round(input.linksAtivos),
  },
  {
    id: "cpc",
    title: "Custo por clique",
    shortDescription: "Valor médio pago por cada clique gerado nas campanhas.",
    formulaLabel: "Valor investido ÷ Cliques totais",
    format: "currency",
    chartColor: "#f97316",
    defaultVisible: true,
    compute: calcCPC,
  },
  // 3 métricas extras do RF013 reservadas para o usuário selecionar na seção personalizada
  {
    id: "cpa",
    title: "Custo por Aquisição",
    shortDescription: "Investimento médio necessário para conquistar uma conversão.",
    formulaLabel: "Valor investido ÷ Número de conversões",
    format: "currency",
    chartColor: "#ec4899",
    defaultVisible: false,
    compute: calcCPA,
  },
  {
    id: "cliquesTotais",
    title: "Cliques totais",
    shortDescription: "Volume acumulado de cliques registrados em todos os links.",
    formulaLabel: "Soma de cliques no período",
    format: "integer",
    chartColor: "#0ea5e9",
    defaultVisible: false,
    compute: (input) => Math.round(input.cliquesTotais),
  },
  {
    id: "taxaReembolso",
    title: "Taxa de reembolso",
    shortDescription: "Percentual de produtos vendidos que tiveram devolução.",
    formulaLabel: "(Reembolsos ÷ Produtos vendidos) × 100",
    format: "percent",
    chartColor: "#ef4444",
    defaultVisible: false,
    compute: calcTaxaReembolso,
  },
] as const;

export function formatMetricValue(
  value: number | null,
  format: MetricFormatType
): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  if (format === "currency") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (format === "percent") {
    return `${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  }

  return Math.round(value).toLocaleString("pt-BR");
}

export function formatMetricAxisValue(
  value: number,
  format: MetricFormatType
): string {
  if (!Number.isFinite(value)) return "";
  if (format === "currency") {
    if (Math.abs(value) >= 1000) {
      return `R$${(value / 1000).toFixed(1)}k`;
    }
    return `R$${value.toFixed(0)}`;
  }
  if (format === "percent") {
    return `${value.toFixed(0)}%`;
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${Math.round(value)}`;
}