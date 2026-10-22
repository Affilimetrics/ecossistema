/* ============================================================
   TIPOS — PRODUTOS
   ============================================================ */

export type ProductOrigin =
  | "auto"       // encontrado automaticamente por integração
  | "manual"     // cadastrado manualmente pelo usuário
  | "imported";  // importado de outra funcionalidade

export type ProductAvailability =
  | "available"
  | "unavailable"
  | "unknown";

export interface Product {
  id: string;
  name: string;
  marketplaceId: string | null;
  marketplaceName: string | null;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  affiliateUrl: string | null;
  currentPrice: number | null;
  previousPrice: number | null;
  currency: string;              // "BRL"
  origin: ProductOrigin;
  availability: ProductAvailability;
  /** ID estável do marketplace (evita duplicatas em sync) */
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search: string;
  marketplaceId: string | "all";
  category: string | "all";
  origin: ProductOrigin | "all";
  availability: ProductAvailability | "all";
  from: string;
  to: string;
}

export const emptyProductFilters: ProductFilters = {
  search: "",
  marketplaceId: "all",
  category: "all",
  origin: "all",
  availability: "all",
  from: "",
  to: "",
};

export type ProductSortKey =
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc"
  | "price_asc"
  | "price_desc"
  | "updated_desc";

export const ORIGIN_LABELS: Record<ProductOrigin, string> = {
  auto: "Encontrado automaticamente",
  manual: "Cadastrado manualmente",
  imported: "Importado",
};

export const ORIGIN_STYLES: Record<ProductOrigin, string> = {
  auto: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  manual:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  imported:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
  available: "Disponível",
  unavailable: "Indisponível",
  unknown: "Não informado",
};

export const AVAILABILITY_STYLES: Record<ProductAvailability, string> = {
  available:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  unavailable:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  unknown:
    "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

export interface NewProductInput {
  name: string;
  marketplaceId: string | null;
  category: string;
  description: string;
  productUrl: string;
  affiliateUrl: string;
  currentPrice: number | null;
  previousPrice: number | null;
  imageUrl: string;
}

export interface ProductKpis {
  total: number;
  auto: number;
  manual: number;
  marketplaces: number;
}