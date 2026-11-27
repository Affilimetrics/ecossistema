import type {
  Flag,
  Product,
  ProductWithMetrics,
  Tier,
} from "../types/hotProductsTypes";

/**
 * Calcula a posição relativa (0 a 1) de um valor dentro de uma amostra.
 * - Com 1 único item, retorna 0.5.
 * - Empates recebem exatamente o mesmo valor (média dos ranks).
 */
export function percentRank(value: number, sample: readonly number[]): number {
  const n = sample.length;
  if (n <= 1) return 0.5;

  let below = 0;
  let equal = 0;

  for (let i = 0; i < n; i++) {
    const item = sample[i];
    if (item < value) {
      below++;
    } else if (item === value) {
      equal++;
    }
  }

  const avgRank = below + (equal - 1) / 2;
  return Math.max(0, Math.min(1, avgRank / (n - 1)));
}

export function getTierFromScore(valueScore: number | null): Tier {
  if (valueScore === null) return "unknown";
  if (valueScore >= 75) return "excellent";
  if (valueScore >= 50) return "good";
  if (valueScore >= 30) return "regular";
  return "weak";
}

export const TIER_LABELS: Record<Tier, string> = {
  excellent: "Vale muito a pena",
  good: "Bom",
  regular: "Regular",
  weak: "Fraco",
  unknown: "Sem dados de vendas",
};

export const FLAG_LABELS: Record<Flag, string> = {
  high_commission_low_sales: "Comissão alta, vende pouco",
  high_sales_low_commission: "Vende muito, comissão baixa",
  low_confidence: "Poucas vendas (dados incertos)",
};

/**
 * Enriquece todo o catálogo carregado com métricas comparáveis entre marketplaces.
 * Importante: deve ser chamado ANTES de qualquer filtro de visão.
 * Se o produto já vier com `valueScore` definido pelo serviço (back-end), preserva os valores prontos.
 */
export function enrichProductsWithMetrics(
  products: readonly Product[]
): ProductWithMetrics[] {
  if (products.length === 0) return [];

  const allCommissionRates = products.map((p) => p.commissionRate);
  const allCommissionPerSale = products.map(
    (p) => (p.currentPrice * p.commissionRate) / 100
  );

  const salesByMarketplace = new Map<string, number[]>();
  for (const product of products) {
    if (product.salesCount30d !== null) {
      const list = salesByMarketplace.get(product.marketplaceName) ?? [];
      list.push(product.salesCount30d);
      salesByMarketplace.set(product.marketplaceName, list);
    }
  }

  return products.map((product, index) => {
    const commissionPerSale =
      product.commissionPerSale ?? allCommissionPerSale[index];

    const commissionRateRank = percentRank(
      product.commissionRate,
      allCommissionRates
    );
    const commissionBrlRank = percentRank(
      commissionPerSale,
      allCommissionPerSale
    );
    const commissionScore =
      product.commissionScore ??
      0.5 * commissionRateRank + 0.5 * commissionBrlRank;

    if (product.salesCount30d === null) {
      const valueScore =
        product.valueScore !== undefined ? product.valueScore : null;
      return {
        ...product,
        commissionPerSale,
        estimatedEarnings30d: product.estimatedEarnings30d ?? null,
        commissionScore,
        salesScore: product.salesScore ?? null,
        confidence: product.confidence ?? null,
        valueScore,
        tier: product.tier ?? getTierFromScore(valueScore),
        flags: product.flags ?? [],
      };
    }

    const marketplaceSalesSample =
      salesByMarketplace.get(product.marketplaceName) ?? [product.salesCount30d];

    const salesScore =
      product.salesScore ??
      percentRank(product.salesCount30d, marketplaceSalesSample);

    const confidence =
      product.confidence ?? Math.min(1, product.salesCount30d / 20) ** 0.5;

    const estimatedEarnings30d =
      product.estimatedEarnings30d ?? commissionPerSale * product.salesCount30d;

    const valueScore =
      product.valueScore !== undefined
        ? product.valueScore
        : Math.round(100 * Math.sqrt(commissionScore * salesScore) * confidence);

    const tier = product.tier ?? getTierFromScore(valueScore);

    const flags: Flag[] =
      product.flags ??
      computeFlags({
        commissionScore,
        salesScore,
        salesCount30d: product.salesCount30d,
      });

    return {
      ...product,
      commissionPerSale,
      estimatedEarnings30d,
      commissionScore,
      salesScore,
      confidence,
      valueScore,
      tier,
      flags,
    };
  });
}

function computeFlags(params: {
  commissionScore: number;
  salesScore: number;
  salesCount30d: number;
}): Flag[] {
  const flags: Flag[] = [];
  const { commissionScore, salesScore, salesCount30d } = params;

  if (commissionScore >= 0.75 && salesScore <= 0.25) {
    flags.push("high_commission_low_sales");
  }

  if (salesScore >= 0.75 && commissionScore <= 0.25) {
    flags.push("high_sales_low_commission");
  }

  if (salesCount30d < 20) {
    flags.push("low_confidence");
  }

  return flags;
}