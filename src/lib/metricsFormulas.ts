/**
 * Fórmulas puras, série temporal e parser seguro de expressões matemáticas para a tela "Métricas".
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
  semanticColor?: boolean;
  compute: (input: MetricsInput) => number | null;
}

export const METRICS_VARIABLE_LABELS: Record<keyof MetricsInput, string> = {
  valorInvestido: "Valor investido (R$)",
  faturamentoBruto: "Faturamento bruto (R$)",
  produtosVendidos: "Produtos vendidos",
  linksAtivos: "Links ativos",
  cliquesTotais: "Cliques totais",
  checkouts: "Checkouts",
  visitantes: "Total de visitantes",
  conversoes: "Número de conversões",
  reembolsos: "Reembolsos",
};

export const METRICS_VARIABLE_KEYS = Object.keys(
  METRICS_VARIABLE_LABELS
) as Array<keyof MetricsInput>;

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

export const STANDARD_METRICS: readonly StandardMetricDefinition[] = [
  {
    id: "roi",
    title: "Retorno sobre Investimento",
    shortDescription: "Percentual de ganho ou perda em relação ao capital investido.",
    formulaLabel: "(Lucro líquido ÷ Valor investido) × 100",
    format: "percent",
    chartColor: "#10b981",
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
    compute: calcTaxaCheckout,
  },
  {
    id: "taxaConversao",
    title: "Taxa de conversão",
    shortDescription: "Percentual de visitantes únicos que concluíram uma compra.",
    formulaLabel: "(Número de conversões ÷ Total de visitantes) × 100",
    format: "percent",
    chartColor: "#8b5cf6",
    compute: calcTaxaConversao,
  },
  {
    id: "valorInvestido",
    title: "Valor investido",
    shortDescription: "Soma total aplicada em anúncios e ações de divulgação no período.",
    formulaLabel: "Soma dos gastos com anúncios e divulgação",
    format: "currency",
    chartColor: "#f59e0b",
    compute: (input) => input.valorInvestido,
  },
  {
    id: "produtosVendidos",
    title: "Quantidade de produtos vendidos",
    shortDescription: "Total de unidades comercializadas através dos seus links.",
    formulaLabel: "Total de itens vendidos no período",
    format: "integer",
    chartColor: "#06b6d4",
    compute: (input) => Math.round(input.produtosVendidos),
  },
  {
    id: "lucroLiquido",
    title: "Lucro líquido",
    shortDescription: "Resultado final após descontar investimento e reembolsos.",
    formulaLabel: "Faturamento bruto − Valor investido − Reembolsos",
    format: "currency",
    chartColor: "#10b981",
    semanticColor: true,
    compute: calcLucroLiquido,
  },
  {
    id: "faturamentoBruto",
    title: "Faturamento bruto",
    shortDescription: "Receita total gerada pelas vendas antes das deduções.",
    formulaLabel: "Soma total das vendas confirmadas",
    format: "currency",
    chartColor: "#2563eb",
    compute: (input) => input.faturamentoBruto,
  },
  {
    id: "linksAtivos",
    title: "Quantidade de links ativos",
    shortDescription: "Links de afiliado publicados e recebendo tráfego no período.",
    formulaLabel: "Total de links ativos na operação",
    format: "integer",
    chartColor: "#6366f1",
    compute: (input) => Math.round(input.linksAtivos),
  },
  {
    id: "cpc",
    title: "Custo por Clique",
    shortDescription: "Valor médio pago por cada clique gerado nas campanhas.",
    formulaLabel: "Valor investido ÷ Cliques totais",
    format: "currency",
    chartColor: "#f97316",
    compute: calcCPC,
  },
  {
    id: "cpa",
    title: "Custo por Aquisição",
    shortDescription: "Investimento médio necessário para conquistar uma conversão.",
    formulaLabel: "Valor investido ÷ Número de conversões",
    format: "currency",
    chartColor: "#ec4899",
    compute: calcCPA,
  },
  {
    id: "cliquesTotais",
    title: "Cliques totais",
    shortDescription: "Volume acumulado de cliques registrados em todos os links.",
    formulaLabel: "Soma de cliques no período",
    format: "integer",
    chartColor: "#0ea5e9",
    compute: (input) => Math.round(input.cliquesTotais),
  },
  {
    id: "taxaReembolso",
    title: "Taxa de reembolso",
    shortDescription: "Percentual de produtos vendidos que tiveram devolução.",
    formulaLabel: "(Reembolsos ÷ Produtos vendidos) × 100",
    format: "percent",
    chartColor: "#ef4444",
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

/* ============================================================================
   Parser Seguro de Expressões (Tokenizer + Descida Recursiva)
============================================================================ */

type Token =
  | { type: "number"; value: number; raw: string }
  | { type: "variable"; name: keyof MetricsInput }
  | { type: "operator"; op: "+" | "-" | "*" | "/"; raw: string }
  | { type: "lparen" }
  | { type: "rparen" };

export type FormulaValidationResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

type ParseResult = FormulaValidationResult;

const ALLOWED_VARS = new Set<string>(METRICS_VARIABLE_KEYS);

function tokenize(
  expression: string
): { ok: true; tokens: Token[] } | { ok: false; error: string } {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const ch = expression[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }

    if (ch === "+") {
      tokens.push({ type: "operator", op: "+", raw: "+" });
      i++;
      continue;
    }

    if (ch === "-" || ch === "−") {
      tokens.push({ type: "operator", op: "-", raw: "−" });
      i++;
      continue;
    }

    if (ch === "*" || ch === "×") {
      tokens.push({ type: "operator", op: "*", raw: "×" });
      i++;
      continue;
    }

    if (ch === "/" || ch === "÷") {
      tokens.push({ type: "operator", op: "/", raw: "÷" });
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      let hasDecimal = false;
      while (i < expression.length && /[0-9.,]/.test(expression[i])) {
        if (expression[i] === "." || expression[i] === ",") {
          if (hasDecimal) {
            return {
              ok: false,
              error: `Número inválido perto de '${expression.slice(start, i + 1)}'.`,
            };
          }
          hasDecimal = true;
        }
        i++;
      }
      const raw = expression.slice(start, i);
      const normalized = raw.replace(",", ".");
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) {
        return { ok: false, error: `Número inválido: '${raw}'.` };
      }
      tokens.push({ type: "number", value: parsed, raw });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      const start = i;
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        i++;
      }
      const ident = expression.slice(start, i);
      if (!ALLOWED_VARS.has(ident)) {
        return {
          ok: false,
          error: `Variável desconhecida: '${ident}'.`,
        };
      }
      tokens.push({ type: "variable", name: ident as keyof MetricsInput });
      continue;
    }

    return {
      ok: false,
      error: `Caractere não permitido: '${ch}'.`,
    };
  }

  return { ok: true, tokens };
}

function tokenLabel(token: Token | undefined): string {
  if (!token) return "fim da expressão";
  if (token.type === "number") return token.raw;
  if (token.type === "variable") return token.name;
  if (token.type === "operator") return token.raw;
  if (token.type === "lparen") return "(";
  return ")";
}

export function evaluateFormula(
  expression: string,
  input: MetricsInput
): FormulaValidationResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { ok: false, error: "Informe uma fórmula." };
  }

  const lexed = tokenize(trimmed);
  if (!lexed.ok) {
    return { ok: false, error: lexed.error };
  }

  const tokens = lexed.tokens;
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token | undefined => tokens[pos++];

  function parseExpression(): ParseResult {
    let left: ParseResult = parseTerm();
    if (!left.ok) return left;

    while (true) {
      const tok = peek();
      if (tok?.type === "operator" && (tok.op === "+" || tok.op === "-")) {
        consume();
        const right: ParseResult = parseTerm();
        if (!right.ok) return right;

        if (left.value === null || right.value === null) {
          left = { ok: true, value: null };
        } else {
          const nextVal: number =
            tok.op === "+" ? left.value + right.value : left.value - right.value;
          left = {
            ok: true,
            value: Number.isFinite(nextVal) ? nextVal : null,
          };
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseTerm(): ParseResult {
    let left: ParseResult = parseUnary();
    if (!left.ok) return left;

    while (true) {
      const tok = peek();
      if (tok?.type === "operator" && (tok.op === "*" || tok.op === "/")) {
        consume();
        const right: ParseResult = parseUnary();
        if (!right.ok) return right;

        if (left.value === null || right.value === null) {
          left = { ok: true, value: null };
        } else if (tok.op === "*") {
          const nextVal: number = left.value * right.value;
          left = {
            ok: true,
            value: Number.isFinite(nextVal) ? nextVal : null,
          };
        } else {
          left = { ok: true, value: safeDivide(left.value, right.value) };
        }
      } else {
        break;
      }
    }

    return left;
  }

  function parseUnary(): ParseResult {
    const tok = peek();
    if (tok?.type === "operator" && (tok.op === "+" || tok.op === "-")) {
      consume();
      const operand: ParseResult = parseUnary();
      if (!operand.ok) return operand;
      if (operand.value === null) return { ok: true, value: null };
      return {
        ok: true,
        value: tok.op === "-" ? -operand.value : operand.value,
      };
    }
    return parsePrimary();
  }

  function parsePrimary(): ParseResult {
    const tok = peek();
    if (!tok) {
      return { ok: false, error: "Expressão incompleta no final da fórmula." };
    }

    if (tok.type === "number") {
      consume();
      return { ok: true, value: tok.value };
    }

    if (tok.type === "variable") {
      consume();
      const val = input[tok.name];
      return { ok: true, value: Number.isFinite(val) ? val : null };
    }

    if (tok.type === "lparen") {
      consume();
      const inner: ParseResult = parseExpression();
      if (!inner.ok) return inner;
      const closing = peek();
      if (closing?.type !== "rparen") {
        return { ok: false, error: "Parêntese de fechamento ')' ausente." };
      }
      consume();
      return inner;
    }

    return {
      ok: false,
      error: `Elemento inesperado: '${tokenLabel(tok)}'.`,
    };
  }

  const parsed = parseExpression();
  if (!parsed.ok) return parsed;

  if (pos < tokens.length) {
    return {
      ok: false,
      error: `Token inesperado após a expressão: '${tokenLabel(tokens[pos])}'.`,
    };
  }

  return { ok: true, value: parsed.value };
}

export function formatFormulaDisplay(expression: string): string {
  return expression.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
    if (ALLOWED_VARS.has(match)) {
      return METRICS_VARIABLE_LABELS[match as keyof MetricsInput];
    }
    return match;
  });
}