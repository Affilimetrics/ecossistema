import {
  ShoppingBag,
  Package,
  Store,
  ShoppingCart,
  Globe,
  Music2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Layers,
  Coins,
  Share2,
  Shirt,
  ShoppingBasket,
  Play,
} from "lucide-react";
import type { Platform, PlatformFilters } from "../types/settingsTypes";

/* ============================================================
   CATÁLOGO DE PLATAFORMAS
   ⚠️  DADOS DE DEMONSTRAÇÃO — nenhuma conexão é real.
   ============================================================ */

export const MOCK_PLATFORMS: Platform[] = [
  /* --------- A. Marketplaces --------- */
  {
    id: "shopee",
    name: "Shopee Afiliados",
    category: "marketplace",
    description: "Programa de afiliados do marketplace Shopee.",
    color: "#ee4d2d",
    icon: ShoppingBag,
    status: "connected",
    connectedAt: "2024-04-10T10:15:00-03:00",
    lastSyncAt: "2024-04-18T14:00:00-03:00",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "available" },
      { key: "commissions", level: "available" },
      { key: "clicks", level: "available" },
      { key: "conversions", level: "available" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "amazon",
    name: "Amazon Associados",
    category: "marketplace",
    description: "Programa de associados da Amazon Brasil.",
    color: "#ff9900",
    icon: Package,
    status: "connected",
    connectedAt: "2024-03-28T09:30:00-03:00",
    lastSyncAt: "2024-04-18T12:45:00-03:00",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "available" },
      { key: "commissions", level: "available" },
      { key: "clicks", level: "api_dependent" },
      { key: "conversions", level: "available" },
      { key: "reports", level: "available" },
    ],
  },
  {
    id: "mercadolivre",
    name: "Mercado Livre Afiliados",
    category: "marketplace",
    description: "Programa de afiliados do Mercado Livre.",
    color: "#ffe600",
    icon: ShoppingCart,
    status: "disconnected",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "magalu",
    name: "Parceiro Magalu",
    category: "marketplace",
    description: "Programa de parceiros do Magazine Luiza.",
    color: "#0086ff",
    icon: Store,
    status: "pending",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "aliexpress",
    name: "AliExpress Portals",
    category: "marketplace",
    description: "Programa de afiliados do AliExpress.",
    color: "#ff4747",
    icon: Globe,
    status: "disconnected",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "tiktokshop",
    name: "TikTok Shop",
    category: "marketplace",
    description: "Programa de afiliados e vendas do TikTok.",
    color: "#000000",
    icon: Music2,
    status: "developing",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "api_dependent" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },

  /* --------- B. Redes de afiliados --------- */
  {
    id: "hotmart",
    name: "Hotmart",
    category: "rede",
    description: "Plataforma de produtos digitais e infoprodutos.",
    color: "#f04e23",
    icon: GraduationCap,
    status: "connected",
    connectedAt: "2024-02-15T14:00:00-03:00",
    lastSyncAt: "2024-04-18T11:10:00-03:00",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "available" },
      { key: "commissions", level: "available" },
      { key: "clicks", level: "available" },
      { key: "conversions", level: "available" },
      { key: "reports", level: "available" },
    ],
  },
  {
    id: "kiwify",
    name: "Kiwify",
    category: "rede",
    description: "Plataforma brasileira de produtos digitais.",
    color: "#00c2a8",
    icon: Sparkles,
    status: "disconnected",
    capabilities: [
      { key: "links", level: "available" },
      { key: "products", level: "available" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "eduzz",
    name: "Eduzz",
    category: "rede",
    description: "Plataforma de comercialização de produtos digitais.",
    color: "#6d28d9",
    icon: BookOpen,
    status: "pending",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "monetizze",
    name: "Monetizze",
    category: "rede",
    description: "Rede de afiliados de produtos digitais.",
    color: "#0e7c66",
    icon: Layers,
    status: "disconnected",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "braip",
    name: "Braip",
    category: "rede",
    description: "Plataforma de afiliados e produtores digitais.",
    color: "#ff5c00",
    icon: Coins,
    status: "error",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "awin",
    name: "Awin",
    category: "rede",
    description: "Rede global de marketing de afiliados.",
    color: "#ff5100",
    icon: Share2,
    status: "disconnected",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "rakuten",
    name: "Rakuten Advertising",
    category: "rede",
    description: "Rede internacional de publicidade e afiliados.",
    color: "#bf0000",
    icon: Globe,
    status: "developing",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "planned" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },

  /* --------- C. E-commerce / adicionais --------- */
  {
    id: "shein",
    name: "SHEIN Afiliados",
    category: "marketplace",
    description: "Programa de afiliados da SHEIN.",
    color: "#000000",
    icon: Shirt,
    status: "pending",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "planned" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "ecommerce",
    description:
      "Plataforma de lojas virtuais. Não é, por si só, uma rede de afiliados.",
    color: "#95bf47",
    icon: ShoppingBasket,
    status: "developing",
    capabilities: [
      { key: "links", level: "unsupported" },
      { key: "products", level: "planned" },
      { key: "sales", level: "planned" },
      { key: "commissions", level: "unsupported" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
  {
    id: "youtubeshopping",
    name: "YouTube Shopping",
    category: "ecommerce",
    description: "Recursos de afiliação e compras do YouTube.",
    color: "#ff0000",
    icon: Play,
    status: "developing",
    capabilities: [
      { key: "links", level: "planned" },
      { key: "products", level: "planned" },
      { key: "sales", level: "api_dependent" },
      { key: "commissions", level: "api_dependent" },
      { key: "clicks", level: "unsupported" },
      { key: "conversions", level: "planned" },
      { key: "reports", level: "planned" },
    ],
  },
];

/* ============================================================
   HELPERS
   ============================================================ */

export const emptyPlatformFilters: PlatformFilters = {
  search: "",
  category: "all",
  status: "all",
};

export function filterPlatforms(
  platforms: Platform[],
  filters: PlatformFilters
): Platform[] {
  const q = filters.search.trim().toLowerCase();
  return platforms.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
    if (filters.category !== "all" && p.category !== filters.category)
      return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    return true;
  });
}

export interface IntegrationKpis {
  total: number;
  connected: number;
  pending: number;
  lastSync: string | null;
}

export function computeIntegrationKpis(
  platforms: Platform[]
): IntegrationKpis {
  const connected = platforms.filter((p) => p.status === "connected");
  const pending = platforms.filter(
    (p) => p.status === "pending" || p.status === "developing"
  );

  const syncs = connected
    .map((p) => p.lastSyncAt)
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return {
    total: platforms.length,
    connected: connected.length,
    pending: pending.length,
    lastSync: syncs[0] ?? null,
  };
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
};