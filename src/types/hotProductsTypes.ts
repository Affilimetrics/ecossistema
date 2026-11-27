export type Marketplace = string;

export type Tier = "excellent" | "good" | "regular" | "weak" | "unknown";

export type Flag =
  | "high_commission_low_sales"
  | "high_sales_low_commission"
  | "low_confidence";

export type SortKey =
  | "valueScore"
  | "commissionRate"
  | "commissionPerSale"
  | "salesCount30d"
  | "estimatedEarnings30d"
  | "discountPercent"
  | "priceAsc"
  | "priceDesc"
  | "recent";

export interface Product {
  id: string;
  name: string;
  category: string;
  marketplaceName: Marketplace;
  currentPrice: number;
  previousPrice: number;
  discountPercent: number;
  imageUrl?: string;
  affiliateUrl: string;
  updatedAt: string;
  commissionRate: number; // porcentagem (ex: 8.5 = 8,5%)
  salesCount30d: number | null; // null = sem dados de vendas

  // Campos derivados opcionais (podem vir pré-calculados do back-end no futuro)
  commissionPerSale?: number;
  estimatedEarnings30d?: number | null;
  commissionScore?: number;
  salesScore?: number | null;
  confidence?: number | null;
  valueScore?: number | null;
  tier?: Tier;
  flags?: Flag[];
}

export interface ProductWithMetrics
  extends Omit<
    Product,
    | "commissionPerSale"
    | "estimatedEarnings30d"
    | "commissionScore"
    | "salesScore"
    | "confidence"
    | "valueScore"
    | "tier"
    | "flags"
  > {
  commissionPerSale: number;
  estimatedEarnings30d: number | null;
  commissionScore: number; // 0 a 1
  salesScore: number | null; // 0 a 1 ou null
  confidence: number | null; // 0 a 1 ou null
  valueScore: number | null; // 0 a 100 ou null
  tier: Tier;
  flags: Flag[];
}

export interface AdvancedFilters {
  minCommissionRate: string;
  minSales30d: string;
  minValueScore: string;
  minPrice: string;
  maxPrice: string;
}