/* ============================================================
   TIPOS — COLETA GERAL
   ============================================================ */

export type MarketplaceId =
  | "magalu"
  | "mercadolivre"
  | "amazon"
  | "shopee"
  | "tiktokshop";

export type MarketplaceStatus =
  | "connected"      // integração já funcional
  | "available"      // suportada no backend, mas usuário ainda não conectou
  | "developing"     // em desenvolvimento no backend
  | "unavailable";   // sem suporte

export interface Marketplace {
  id: MarketplaceId;
  name: string;
  description: string;
  color: string;
  status: MarketplaceStatus;
}

export type CollectionStatus =
  | "idle"
  | "starting"
  | "running"
  | "paused"
  | "stopping"
  | "error";

export interface Category {
  id: string;
  name: string;
  isNative: boolean;
  /** Coleta recorrente habilitada para essa categoria */
  loop: boolean;
  /** Palavras-chave (só para categorias personalizadas) */
  keywords?: string[];
}

export interface CollectionState {
  status: CollectionStatus;
  marketplaceId: MarketplaceId | null;
  categoryIds: string[];
  lastRunAt: string | null;
  processedProducts: number | null;
  error: string | null;
}

export type LogLevel = "info" | "success" | "warning" | "error";

export interface CollectionLog {
  id: string;
  at: string;
  level: LogLevel;
  message: string;
}

export interface NewCategoryInput {
  name: string;
  keywords: string[];
}