import type { LucideIcon } from "lucide-react";

/* ============================================================
   TIPOS DA PÁGINA DE CONFIGURAÇÕES
   ============================================================ */

export type SettingsTab =
  | "integrations"
  | "account"
  | "preferences"
  | "notifications"
  | "security";

export type PlatformCategory =
  | "marketplace"
  | "afiliados"
  | "rede"
  | "ecommerce";

export type IntegrationStatus =
  | "connected"
  | "disconnected"
  | "pending"
  | "developing"
  | "error";

export type CapabilityKey =
  | "links"
  | "products"
  | "sales"
  | "commissions"
  | "clicks"
  | "conversions"
  | "reports";

export type CapabilityLevel =
  | "available"
  | "api_dependent"
  | "planned"
  | "unsupported";

export interface PlatformCapability {
  key: CapabilityKey;
  level: CapabilityLevel;
}

export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
  description: string;
  color: string;
  icon: LucideIcon;
  status: IntegrationStatus;
  connectedAt?: string;
  lastSyncAt?: string;
  capabilities: PlatformCapability[];
}

export interface PlatformFilters {
  search: string;
  category: PlatformCategory | "all";
  status: IntegrationStatus | "all";
}

export interface AccountPreferences {
  displayName: string;
  email: string;
}

export interface GeneralPreferences {
  currency: "BRL" | "USD" | "EUR";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  compactDashboard: boolean;
}

export interface NotificationPreferences {
  newConversions: boolean;
  syncFailures: boolean;
  financialGoals: boolean;
  productUpdates: boolean;
}

/* ============================================================
   LABELS / ESTILOS
   ============================================================ */

export const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  marketplace: "Marketplace",
  afiliados: "Afiliados",
  rede: "Rede de afiliados",
  ecommerce: "E-commerce",
};

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: "Conectada",
  disconnected: "Desconectada",
  pending: "Aguardando configuração",
  developing: "Em desenvolvimento",
  error: "Com erro",
};

export const STATUS_STYLES: Record<IntegrationStatus, string> = {
  connected:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  disconnected:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  pending:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  developing:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  error: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  links: "Links",
  products: "Produtos",
  sales: "Vendas",
  commissions: "Comissões",
  clicks: "Cliques",
  conversions: "Conversões",
  reports: "Relatórios",
};

export const CAPABILITY_LEVEL_LABELS: Record<CapabilityLevel, string> = {
  available: "Disponível",
  api_dependent: "Depende da API",
  planned: "Planejado",
  unsupported: "Não suportado",
};

export const CAPABILITY_LEVEL_STYLES: Record<CapabilityLevel, string> = {
  available: "text-green-600 dark:text-green-400",
  api_dependent: "text-amber-600 dark:text-amber-400",
  planned: "text-slate-500 dark:text-slate-400",
  unsupported: "text-red-500 dark:text-red-400",
};