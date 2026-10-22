/**
 * ⚠️  DADOS DE DEMONSTRAÇÃO
 *
 * Este arquivo concentra os dados simulados do módulo de Remarketing.
 * Quando o backend Django estiver pronto, basta trocar `MOCK_REMARKETING`
 * pela resposta da API mantendo o mesmo formato `RemarketingRecord`.
 *
 * REGRAS DE NEGÓCIO representadas aqui:
 *  - `clicked` é sempre true (é o ponto de partida do módulo).
 *  - `converted` SÓ é true quando existe um `conversionId` (evidência de compra).
 *  - Nunca inferimos identidade pessoal — usamos `visitorId` anônimo.
 */

export type RemarketingStatus =
  | "pending"       // Pendente de análise
  | "following"     // Em acompanhamento
  | "converted"     // Convertido
  | "closed";       // Encerrado

export type ConversionStatus =
  | "no_conversion"     // Sem conversão registrada
  | "converted"         // Conversão registrada
  | "unknown";          // Dados insuficientes

export interface RemarketingEvent {
  at: string;
  type: "click" | "page_view" | "status_change" | "note" | "conversion";
  description: string;
}

export interface RemarketingRecord {
  id: string;
  visitorId: string;
  productName: string;
  productSku: string;
  affiliateLinkId: string;
  affiliateLinkLabel: string;
  clickedAt: string;
  conversionStatus: ConversionStatus;
  conversionId?: string;
  convertedAt?: string;
  recoveredRevenue?: number;
  status: RemarketingStatus;
  note?: string;
  events: RemarketingEvent[];
}

/* ============================================================
   DADOS
   ============================================================ */

export const MOCK_REMARKETING: RemarketingRecord[] = [
  {
    id: "RMK-2024-0001",
    visitorId: "vis_8f3a2c",
    productName: "iPhone 15 Pro 256GB",
    productSku: "APPL-IP15P-256",
    affiliateLinkId: "lnk_9a1b",
    affiliateLinkLabel: "iPhone 15 Pro — Amazon",
    clickedAt: "2024-04-18T14:22:00-03:00",
    conversionStatus: "converted",
    conversionId: "ord_58201",
    convertedAt: "2024-04-18T16:05:00-03:00",
    recoveredRevenue: 1299.0,
    status: "converted",
    events: [
      { at: "2024-04-18T14:22:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-18T14:25:00-03:00", type: "page_view", description: "Visualizou página do produto" },
      { at: "2024-04-18T16:05:00-03:00", type: "conversion", description: "Conversão registrada (ord_58201)" },
    ],
  },
  {
    id: "RMK-2024-0002",
    visitorId: "vis_2d7e19",
    productName: "MacBook Air M2 13\"",
    productSku: "APPL-MBA-M2",
    affiliateLinkId: "lnk_4c8d",
    affiliateLinkLabel: "MacBook Air M2 — Magazine Luiza",
    clickedAt: "2024-04-18T09:14:00-03:00",
    conversionStatus: "no_conversion",
    status: "pending",
    events: [
      { at: "2024-04-18T09:14:00-03:00", type: "click", description: "Clique no link de afiliado" },
    ],
  },
  {
    id: "RMK-2024-0003",
    visitorId: "vis_5b1f84",
    productName: "AirPods Pro 2ª geração",
    productSku: "APPL-APP2",
    affiliateLinkId: "lnk_7e2a",
    affiliateLinkLabel: "AirPods Pro — Amazon",
    clickedAt: "2024-04-17T20:48:00-03:00",
    conversionStatus: "no_conversion",
    status: "following",
    note: "Visitante recorrente — 3º clique no mesmo link em 7 dias.",
    events: [
      { at: "2024-04-17T20:48:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-17T22:10:00-03:00", type: "note", description: "Observação adicionada pelo afiliado" },
      { at: "2024-04-18T08:00:00-03:00", type: "status_change", description: "Status alterado para Em acompanhamento" },
    ],
  },
  {
    id: "RMK-2024-0004",
    visitorId: "vis_a91c0e",
    productName: "iPad Air 5ª geração",
    productSku: "APPL-IPA5",
    affiliateLinkId: "lnk_1f9c",
    affiliateLinkLabel: "iPad Air — Mercado Livre",
    clickedAt: "2024-04-17T11:03:00-03:00",
    conversionStatus: "no_conversion",
    status: "closed",
    note: "Sem interação após 5 dias. Encerrado.",
    events: [
      { at: "2024-04-17T11:03:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-22T10:00:00-03:00", type: "status_change", description: "Status alterado para Encerrado" },
    ],
  },
  {
    id: "RMK-2024-0005",
    visitorId: "vis_c07b2d",
    productName: "Galaxy S24 Ultra",
    productSku: "SAMS-GS24U",
    affiliateLinkId: "lnk_bb01",
    affiliateLinkLabel: "Galaxy S24 Ultra — Samsung",
    clickedAt: "2024-04-16T17:32:00-03:00",
    conversionStatus: "converted",
    conversionId: "ord_58107",
    convertedAt: "2024-04-17T09:12:00-03:00",
    recoveredRevenue: 8999.0,
    status: "converted",
    events: [
      { at: "2024-04-16T17:32:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-17T09:12:00-03:00", type: "conversion", description: "Conversão registrada (ord_58107)" },
    ],
  },
  {
    id: "RMK-2024-0006",
    visitorId: "vis_44e1a9",
    productName: "Echo Dot 5ª geração",
    productSku: "AMZN-ED5",
    affiliateLinkId: "lnk_3d7f",
    affiliateLinkLabel: "Echo Dot — Amazon",
    clickedAt: "2024-04-16T08:15:00-03:00",
    conversionStatus: "no_conversion",
    status: "pending",
    events: [
      { at: "2024-04-16T08:15:00-03:00", type: "click", description: "Clique no link de afiliado" },
    ],
  },
  {
    id: "RMK-2024-0007",
    visitorId: "vis_f8c3b5",
    productName: "Smart TV 55\" 4K",
    productSku: "TV55-4K-01",
    affiliateLinkId: "lnk_6a2b",
    affiliateLinkLabel: "Smart TV 55\" — Casas Bahia",
    clickedAt: "2024-04-15T21:47:00-03:00",
    conversionStatus: "unknown",
    status: "following",
    note: "Clique registrado, mas sem dados suficientes para confirmar conversão.",
    events: [
      { at: "2024-04-15T21:47:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-16T10:00:00-03:00", type: "status_change", description: "Status alterado para Em acompanhamento" },
    ],
  },
  {
    id: "RMK-2024-0008",
    visitorId: "vis_1b6d02",
    productName: "Cafeteira Nespresso Vertuo",
    productSku: "NES-VERTUO",
    affiliateLinkId: "lnk_9c1a",
    affiliateLinkLabel: "Nespresso Vertuo — Amazon",
    clickedAt: "2024-04-15T13:20:00-03:00",
    conversionStatus: "no_conversion",
    status: "closed",
    events: [
      { at: "2024-04-15T13:20:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-20T09:00:00-03:00", type: "status_change", description: "Status alterado para Encerrado" },
    ],
  },
  {
    id: "RMK-2024-0009",
    visitorId: "vis_6e4a71",
    productName: "PlayStation 5 Slim",
    productSku: "SONY-PS5S",
    affiliateLinkId: "lnk_ee42",
    affiliateLinkLabel: "PS5 Slim — Mercado Livre",
    clickedAt: "2024-04-14T19:05:00-03:00",
    conversionStatus: "no_conversion",
    status: "pending",
    events: [
      { at: "2024-04-14T19:05:00-03:00", type: "click", description: "Clique no link de afiliado" },
    ],
  },
  {
    id: "RMK-2024-0010",
    visitorId: "vis_38b9f4",
    productName: "Fone JBL Tune 770NC",
    productSku: "JBL-T770NC",
    affiliateLinkId: "lnk_72cc",
    affiliateLinkLabel: "JBL Tune 770NC — Magazine Luiza",
    clickedAt: "2024-04-14T11:42:00-03:00",
    conversionStatus: "converted",
    conversionId: "ord_57990",
    convertedAt: "2024-04-14T12:30:00-03:00",
    recoveredRevenue: 549.9,
    status: "converted",
    events: [
      { at: "2024-04-14T11:42:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-14T12:30:00-03:00", type: "conversion", description: "Conversão registrada (ord_57990)" },
    ],
  },
  {
    id: "RMK-2024-0011",
    visitorId: "vis_92d1c7",
    productName: "Kindle Paperwhite 11ª",
    productSku: "AMZN-KPW11",
    affiliateLinkId: "lnk_aa10",
    affiliateLinkLabel: "Kindle Paperwhite — Amazon",
    clickedAt: "2024-04-13T22:18:00-03:00",
    conversionStatus: "no_conversion",
    status: "pending",
    events: [
      { at: "2024-04-13T22:18:00-03:00", type: "click", description: "Clique no link de afiliado" },
    ],
  },
  {
    id: "RMK-2024-0012",
    visitorId: "vis_7c5e03",
    productName: "Aspirador Robô Xiaomi",
    productSku: "XIAO-VAC-S10",
    affiliateLinkId: "lnk_d3f8",
    affiliateLinkLabel: "Aspirador Xiaomi — AliExpress",
    clickedAt: "2024-04-13T15:50:00-03:00",
    conversionStatus: "no_conversion",
    status: "following",
    note: "Clicou 2x em 3 dias. Vale monitorar.",
    events: [
      { at: "2024-04-13T15:50:00-03:00", type: "click", description: "Clique no link de afiliado" },
      { at: "2024-04-15T09:00:00-03:00", type: "note", description: "Observação adicionada pelo afiliado" },
    ],
  },
];

/* ============================================================
   LABELS / STYLES
   ============================================================ */

export const STATUS_LABELS: Record<RemarketingStatus, string> = {
  pending: "Pendente de análise",
  following: "Em acompanhamento",
  converted: "Convertido",
  closed: "Encerrado",
};

export const STATUS_STYLES: Record<RemarketingStatus, string> = {
  pending: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  following: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  converted: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20",
};

export const CONVERSION_LABELS: Record<ConversionStatus, string> = {
  no_conversion: "Sem conversão",
  converted: "Convertida",
  unknown: "Dados insuficientes",
};

export const CONVERSION_STYLES: Record<ConversionStatus, string> = {
  no_conversion: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  converted: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  unknown: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

/* ============================================================
   HELPERS
   ============================================================ */

export interface RemarketingFilters {
  search: string;
  product: string | "all";
  link: string | "all";
  status: RemarketingStatus | "all";
  from: string;
  to: string;
}

export const emptyFilters: RemarketingFilters = {
  search: "",
  product: "all",
  link: "all",
  status: "all",
  from: "",
  to: "",
};

export function filterRecords(
  records: RemarketingRecord[],
  filters: RemarketingFilters
): RemarketingRecord[] {
  const q = filters.search.trim().toLowerCase();
  const fromTs = filters.from ? new Date(filters.from + "T00:00:00").getTime() : null;
  const toTs = filters.to ? new Date(filters.to + "T23:59:59").getTime() : null;

  return records.filter((r) => {
    if (q) {
      const haystack = `${r.id} ${r.productName} ${r.affiliateLinkLabel} ${r.visitorId}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.product !== "all" && r.productName !== filters.product) return false;
    if (filters.link !== "all" && r.affiliateLinkId !== filters.link) return false;
    if (filters.status !== "all" && r.status !== filters.status) return false;

    const clickedTs = new Date(r.clickedAt).getTime();
    if (fromTs != null && clickedTs < fromTs) return false;
    if (toTs != null && clickedTs > toTs) return false;

    return true;
  });
}

export interface RemarketingKpis {
  totalClicks: number;
  clicksWithoutConversion: number;
  recoveredConversions: number;
  recoveryRate: number | null;
  recoveredRevenue: number;
}

export function computeKpis(records: RemarketingRecord[]): RemarketingKpis {
  const totalClicks = records.length;
  const clicksWithoutConversion = records.filter(
    (r) => r.conversionStatus !== "converted"
  ).length;

  const convertedRecords = records.filter((r) => r.conversionStatus === "converted");
  const recoveredConversions = convertedRecords.length;

  const recoveryRate =
    totalClicks > 0 && recoveredConversions > 0
      ? (recoveredConversions / totalClicks) * 100
      : null;

  const recoveredRevenue = convertedRecords.reduce(
    (s, r) => s + (r.recoveredRevenue ?? 0),
    0
  );

  return {
    totalClicks,
    clicksWithoutConversion,
    recoveredConversions,
    recoveryRate,
    recoveredRevenue,
  };
}

export function getUniqueProducts(records: RemarketingRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.productName))).sort();
}

export function getUniqueLinks(
  records: RemarketingRecord[]
): { id: string; label: string }[] {
  const map = new Map<string, string>();
  records.forEach((r) => map.set(r.affiliateLinkId, r.affiliateLinkLabel));
  return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

/* ============================================================
   FORMATADORES (pt-BR)
   ============================================================ */

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });