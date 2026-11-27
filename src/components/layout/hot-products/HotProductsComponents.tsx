import { useState, useId } from "react";
import {
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  X,
  Flame,
  Info,
  Trophy,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import type {
  AdvancedFilters,
  Flag,
  Marketplace,
  ProductWithMetrics,
  Tier,
} from "../../../types/hotProductsTypes";
import { FLAG_LABELS, TIER_LABELS } from "../../../lib/profitability";

export const formatBRL = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatInt = (val: number) => val.toLocaleString("pt-BR");

export const formatPercent = (val: number) =>
  `${val.toLocaleString("pt-BR", {
    minimumFractionDigits: val % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })}%`;

export const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
};

const TIER_STYLES: Record<
  Tier,
  {
    bar: string;
    badge: string;
    text: string;
    dot: string;
    hex: string;
  }
> = {
  excellent: {
    bar: "bg-emerald-500 dark:bg-emerald-400",
    badge:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  good: {
    bar: "bg-blue-500 dark:bg-blue-400",
    badge:
      "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    hex: "#3b82f6",
  },
  regular: {
    bar: "bg-amber-500 dark:bg-amber-400",
    badge:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  weak: {
    bar: "bg-red-500 dark:bg-red-400",
    badge:
      "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    hex: "#ef4444",
  },
  unknown: {
    bar: "bg-gray-300 dark:bg-gray-700",
    badge:
      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
    hex: "#9ca3af",
  },
};

/* =========================================================
   1. ValueBar — Barra do Índice de Rentabilidade (0–100)
========================================================= */
export function ValueBar({
  valueScore,
  tier,
  showInfoTooltip = false,
}: {
  valueScore: number | null;
  tier: Tier;
  showInfoTooltip?: boolean;
}) {
  const style = TIER_STYLES[tier];
  const widthPercent =
    valueScore === null ? 0 : Math.max(4, Math.min(100, valueScore));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400">
          <span>Índice de rentabilidade</span>
          {showInfoTooltip && <IndexInfoButton />}
        </span>
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${style.badge}`}
        >
          <span>{TIER_LABELS[tier]}</span>
          {valueScore !== null && <span>· {valueScore}/100</span>}
        </span>
      </div>

      <div
        className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden"
        role="progressbar"
        aria-label="Índice de rentabilidade"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valueScore ?? 0}
        aria-valuetext={
          valueScore === null
            ? "Sem dados de vendas"
            : `${valueScore} de 100 — ${TIER_LABELS[tier]}`
        }
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Ícone Info com explicação curta do índice
========================================================= */
export function IndexInfoButton() {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="Como funciona o índice de rentabilidade"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex items-center justify-center h-5 w-5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-[11px] font-normal leading-snug text-gray-700 dark:text-gray-200 shadow-lg z-30 pointer-events-none"
        >
          Combina comissão e volume de vendas. Se um dos dois for baixo, o índice cai.
        </span>
      )}
    </span>
  );
}

/* =========================================================
   2. FlagBadge — Alertas de Perfil do Produto
========================================================= */
export function FlagBadge({ flag }: { flag: Flag }) {
  if (flag === "high_commission_low_sales") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
        <AlertTriangle className="h-3 w-3 shrink-0" />
        <span>{FLAG_LABELS[flag]}</span>
      </span>
    );
  }

  if (flag === "high_sales_low_commission") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-medium">
        <TrendingUp className="h-3 w-3 shrink-0" />
        <span>{FLAG_LABELS[flag]}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-medium">
      <HelpCircle className="h-3 w-3 shrink-0" />
      <span>{FLAG_LABELS[flag]}</span>
    </span>
  );
}

/* =========================================================
   3. MarketplaceChips — Seleção Múltipla com Contagem
========================================================= */
export function MarketplaceChips({
  marketplaces,
  countsByMarketplace,
  totalCount,
  selectedMarketplaces,
  onToggleMarketplace,
  onSelectAll,
}: {
  marketplaces: Marketplace[];
  countsByMarketplace: Map<Marketplace, number>;
  totalCount: number;
  selectedMarketplaces: Marketplace[];
  onToggleMarketplace: (mp: Marketplace) => void;
  onSelectAll: () => void;
}) {
  const isAllSelected = selectedMarketplaces.length === 0;

  return (
    <div
      role="group"
      aria-label="Filtrar por marketplace"
      className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 no-scrollbar"
    >
      <button
        type="button"
        aria-pressed={isAllSelected}
        onClick={onSelectAll}
        className={`h-9 shrink-0 inline-flex items-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
          isAllSelected
            ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <span>Todos</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
            isAllSelected
              ? "bg-blue-500 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          {totalCount}
        </span>
      </button>

      {marketplaces.map((mp) => {
        const active = selectedMarketplaces.includes(mp);
        const count = countsByMarketplace.get(mp) ?? 0;

        return (
          <button
            key={mp}
            type="button"
            aria-pressed={active}
            onClick={() => onToggleMarketplace(mp)}
            className={`h-9 shrink-0 inline-flex items-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              active
                ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <span>{mp}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                active
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================
   4. FiltersPanel — Painel de Filtros Numéricos Avançados
========================================================= */
export function FiltersPanel({
  filters,
  onChange,
  onClear,
  onClose,
}: {
  filters: AdvancedFilters;
  onChange: (next: AdvancedFilters) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const updateField = (key: keyof AdvancedFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div
      role="region"
      aria-label="Filtros avançados de rentabilidade"
      className="mb-5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          Filtros de Rentabilidade e Preço
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="h-9 inline-flex items-center gap-1 px-2.5 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel de filtros"
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Comissão mínima (%)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.5"
            placeholder="Ex: 5"
            value={filters.minCommissionRate}
            onChange={(e) => updateField("minCommissionRate", e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Vendas mínimas (30d)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step="10"
            placeholder="Ex: 100"
            value={filters.minSales30d}
            onChange={(e) => updateField("minSales30d", e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Índice mínimo (0–100)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step="5"
            placeholder="Ex: 50"
            value={filters.minValueScore}
            onChange={(e) => updateField("minValueScore", e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Preço mínimo (R$)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="10"
            placeholder="Ex: 100"
            value={filters.minPrice}
            onChange={(e) => updateField("minPrice", e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Preço máximo (R$)
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="10"
            placeholder="Ex: 2000"
            value={filters.maxPrice}
            onChange={(e) => updateField("maxPrice", e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>
      </div>
    </div>
  );
}

/* =========================================================
   5. TopPicks — "Os 3 que mais valem a pena agora"
========================================================= */
export function TopPicks({
  products,
  copiedId,
  onCopy,
  onPreview,
}: {
  products: ProductWithMetrics[];
  copiedId: string | null;
  onCopy: (product: ProductWithMetrics) => void;
  onPreview: (product: ProductWithMetrics) => void;
}) {
  const topThree = products
    .filter((p) => p.valueScore !== null)
    .sort((a, b) => (b.valueScore ?? -1) - (a.valueScore ?? -1))
    .slice(0, 3);

  if (topThree.length === 0) return null;

  const MEDALS = [
    {
      rank: "1º",
      badgeClass:
        "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
    },
    {
      rank: "2º",
      badgeClass:
        "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700",
    },
    {
      rank: "3º",
      badgeClass:
        "bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700",
    },
  ];

  return (
    <section
      aria-labelledby="top-picks-heading"
      className="mb-6 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          <h2
            id="top-picks-heading"
            className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100"
          >
            Os 3 que mais valem a pena agora
          </h2>
        </div>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          Equilíbrio entre comissão e vendas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topThree.map((product, index) => {
          const medal = MEDALS[index];
          const isCopied = copiedId === product.id;

          return (
            <div
              key={product.id}
              className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onPreview(product)}
                  className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  aria-label={`Ver detalhes de ${product.name}`}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${medal.badgeClass}`}
                    >
                      {medal.rank} lugar
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                      {product.marketplaceName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPreview(product)}
                    className="text-left text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:underline"
                  >
                    {product.name}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-md border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-2.5 py-2">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Comissão ({formatPercent(product.commissionRate)})
                  </p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatBRL(product.commissionPerSale)}
                    <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                      /venda
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Vendas (30d)
                  </p>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {product.salesCount30d !== null
                      ? `${formatInt(product.salesCount30d)} un.`
                      : "Sem dados"}
                  </p>
                </div>
              </div>

              <ValueBar valueScore={product.valueScore} tier={product.tier} />

              <div className="flex items-center gap-1.5 pt-0.5">
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Divulgar</span>
                </a>
                <button
                  type="button"
                  onClick={() => onCopy(product)}
                  aria-label={`Copiar link de ${product.name}`}
                  className={`h-9 inline-flex items-center justify-center gap-1 px-2.5 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                    isCopied
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   6. ProfitMatrix — Matriz Comissão × Vendas (SVG Inline + Tabela sr-only)
========================================================= */
export function ProfitMatrix({
  products,
  onSelectProduct,
}: {
  products: ProductWithMetrics[];
  onSelectProduct: (product: ProductWithMetrics) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] =
    useState<ProductWithMetrics | null>(null);

  const validProducts = products.filter(
    (p): p is ProductWithMetrics & { salesCount30d: number } =>
      p.salesCount30d !== null && p.salesCount30d > 0
  );

  const W = 680;
  const H = 310;
  const PAD_L = 48;
  const PAD_R = 24;
  const PAD_T = 24;
  const PAD_B = 40;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const minSales = Math.min(10, ...validProducts.map((p) => p.salesCount30d));
  const maxSales = Math.max(3000, ...validProducts.map((p) => p.salesCount30d));
  const minLog = Math.log10(Math.max(1, minSales));
  const maxLog = Math.log10(Math.max(10, maxSales));

  const maxComm = Math.max(16, ...validProducts.map((p) => p.commissionRate + 1));

  const getX = (sales: number) => {
    const ratio =
      maxLog === minLog
        ? 0.5
        : (Math.log10(Math.max(1, sales)) - minLog) / (maxLog - minLog);
    return PAD_L + ratio * plotW;
  };

  const getY = (comm: number) => {
    const ratio = Math.max(0, Math.min(1, comm / maxComm));
    return PAD_T + plotH - ratio * plotH;
  };

  const midX = getX(250);
  const midY = getY(7.5);
  const xTicks = [15, 50, 200, 800, 3000].filter(
    (v) => v >= minSales && v <= maxSales * 1.1
  );
  const yTicks = [0, 4, 8, 12, 16].filter((v) => v <= maxComm);

  return (
    <div className="mb-6 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {validProducts.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-6">
              Nenhum produto com dados de vendas nos filtros atuais para exibir na matriz.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  Eixo X: Vendas em 30 dias (escala logarítmica) · Eixo Y: Comissão (%)
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {(["excellent", "good", "regular", "weak"] as const).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${TIER_STYLES[t].dot}`} />
                      <span>{TIER_LABELS[t]}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full min-w-[520px] h-auto select-none"
                  role="img"
                  aria-label="Gráfico de dispersão comparando comissão percentual e volume de vendas em 30 dias"
                >
                  <rect
                    x={midX}
                    y={PAD_T}
                    width={PAD_L + plotW - midX}
                    height={midY - PAD_T}
                    className="fill-emerald-500/5"
                  />
                  <rect
                    x={PAD_L}
                    y={PAD_T}
                    width={midX - PAD_L}
                    height={midY - PAD_T}
                    className="fill-amber-500/5"
                  />
                  <rect
                    x={midX}
                    y={midY}
                    width={PAD_L + plotW - midX}
                    height={PAD_T + plotH - midY}
                    className="fill-blue-500/5"
                  />
                  <rect
                    x={PAD_L}
                    y={midY}
                    width={midX - PAD_L}
                    height={PAD_T + plotH - midY}
                    className="fill-red-500/5"
                  />

                  {yTicks.map((tick) => {
                    const y = getY(tick);
                    return (
                      <g key={tick}>
                        <line
                          x1={PAD_L}
                          y1={y}
                          x2={PAD_L + plotW}
                          y2={y}
                          className="stroke-gray-200 dark:stroke-gray-800"
                          strokeWidth="1"
                        />
                        <text
                          x={PAD_L - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          className="fill-gray-500 dark:fill-gray-400 text-[10px]"
                        >
                          {tick}%
                        </text>
                      </g>
                    );
                  })}

                  {xTicks.map((tick) => {
                    const x = getX(tick);
                    return (
                      <g key={tick}>
                        <line
                          x1={x}
                          y1={PAD_T}
                          x2={x}
                          y2={PAD_T + plotH}
                          className="stroke-gray-200 dark:stroke-gray-800"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={PAD_T + plotH + 16}
                          textAnchor="middle"
                          className="fill-gray-500 dark:fill-gray-400 text-[10px]"
                        >
                          {formatInt(tick)}
                        </text>
                      </g>
                    );
                  })}

                  <line
                    x1={midX}
                    y1={PAD_T}
                    x2={midX}
                    y2={PAD_T + plotH}
                    className="stroke-gray-400/50 dark:stroke-gray-600"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={PAD_L}
                    y1={midY}
                    x2={PAD_L + plotW}
                    y2={midY}
                    className="stroke-gray-400/50 dark:stroke-gray-600"
                    strokeDasharray="4 4"
                  />

                  <text
                    x={PAD_L + 8}
                    y={PAD_T + 14}
                    className="fill-amber-600/80 dark:fill-amber-400/80 text-[10px] font-semibold"
                  >
                    Armadilha
                  </text>
                  <text
                    x={PAD_L + plotW - 8}
                    y={PAD_T + 14}
                    textAnchor="end"
                    className="fill-emerald-600/80 dark:fill-emerald-400/80 text-[10px] font-semibold"
                  >
                    Estrelas
                  </text>
                  <text
                    x={PAD_L + 8}
                    y={PAD_T + plotH - 8}
                    className="fill-red-600/80 dark:fill-red-400/80 text-[10px] font-semibold"
                  >
                    Evitar
                  </text>
                  <text
                    x={PAD_L + plotW - 8}
                    y={PAD_T + plotH - 8}
                    textAnchor="end"
                    className="fill-blue-600/80 dark:fill-blue-400/80 text-[10px] font-semibold"
                  >
                    Volume
                  </text>

                  <text
                    x={PAD_L + plotW / 2}
                    y={H - 6}
                    textAnchor="middle"
                    className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium"
                  >
                    Vendas nos últimos 30 dias (escala log)
                  </text>

                  {validProducts.map((p) => {
                    const cx = getX(p.salesCount30d);
                    const cy = getY(p.commissionRate);
                    const isHovered = hoveredProduct?.id === p.id;
                    const fillHex = TIER_STYLES[p.tier].hex;

                    return (
                      <g
                        key={p.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredProduct(p)}
                        onMouseLeave={() => setHoveredProduct(null)}
                        onClick={() => onSelectProduct(p)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 8 : 6}
                          fill={fillHex}
                          fillOpacity={0.9}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2 : 1.5}
                        />
                      </g>
                    );
                  })}
                </svg>

                {hoveredProduct && (
                  <div className="mt-2 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {hoveredProduct.name} ({hoveredProduct.marketplaceName})
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300">
                      <span>
                        Comissão:{" "}
                        <strong>{formatPercent(hoveredProduct.commissionRate)}</strong>
                      </span>
                      <span>
                        Vendas (30d):{" "}
                        <strong>
                          {hoveredProduct.salesCount30d !== null
                            ? formatInt(hoveredProduct.salesCount30d)
                            : "Sem dados"}
                        </strong>
                      </span>
                      <span>
                        Índice: <strong>{hoveredProduct.valueScore ?? "—"}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <table className="sr-only">
                <caption>
                  Relação entre comissão, vendas em 30 dias e índice de rentabilidade dos produtos
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Produto</th>
                    <th scope="col">Marketplace</th>
                    <th scope="col">Comissão</th>
                    <th scope="col">Vendas (30d)</th>
                    <th scope="col">Índice</th>
                  </tr>
                </thead>
                <tbody>
                  {validProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.marketplaceName}</td>
                      <td>{formatPercent(p.commissionRate)}</td>
                      <td>{formatInt(p.salesCount30d)}</td>
                      <td>{p.valueScore ?? "Sem dados"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   7. ProductCard — Card de Produto com Métricas e Flags
========================================================= */
export function ProductCard({
  product,
  isCopied,
  onCopy,
  onPreview,
}: {
  product: ProductWithMetrics;
  isCopied: boolean;
  onCopy: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="group rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={onPreview}
        className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/50"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600" />
          </div>
        )}

        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-sm">
          -{product.discountPercent}%
        </span>

        <span
          className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-semibold backdrop-blur-sm"
          title={`Índice de rentabilidade: ${TIER_LABELS[product.tier]}`}
        >
          <Flame className="h-3 w-3 text-orange-400" />
          {product.valueScore !== null ? product.valueScore : "—"}
        </span>
      </button>

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {product.marketplaceName}
            </span>{" "}
            · {product.category}
          </p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mt-0.5 leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {formatBRL(product.currentPrice)}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 line-through">
            {formatBRL(product.previousPrice)}
          </span>
        </div>

        <div className="rounded-md border border-gray-200/80 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 p-2.5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Comissão ({formatPercent(product.commissionRate)})
              </p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {formatBRL(product.commissionPerSale)}
                <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                  /venda
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Vendas (30d)
              </p>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {product.salesCount30d !== null
                  ? `${formatInt(product.salesCount30d)} un.`
                  : "Sem dados"}
              </p>
            </div>
          </div>

          <ValueBar valueScore={product.valueScore} tier={product.tier} />
        </div>

        {product.flags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.flags.map((flag) => (
              <FlagBadge key={flag} flag={flag} />
            ))}
          </div>
        )}

        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Atualizado {formatRelative(product.updatedAt)}
        </p>

        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Abrir</span>
          </a>
          <button
            type="button"
            onClick={onCopy}
            className={`h-9 inline-flex items-center justify-center gap-1 px-2.5 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              isCopied
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            title="Copiar link de afiliado"
          >
            {isCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   8. ProductPreviewModal — Detalhes, Quebra do Índice e Simulador
========================================================= */
export function ProductPreviewModal({
  product,
  onClose,
  isCopied,
  onCopy,
}: {
  product: ProductWithMetrics;
  onClose: () => void;
  isCopied: boolean;
  onCopy: () => void;
}) {
  const [simulatedUnits, setSimulatedUnits] = useState<number>(10);

  const commissionPct = Math.round(product.commissionScore * 100);
  const salesPct =
    product.salesScore !== null ? Math.round(product.salesScore * 100) : null;
  const confidencePct =
    product.confidence !== null ? Math.round(product.confidence * 100) : null;

  const safeUnits =
    Number.isFinite(simulatedUnits) && simulatedUnits >= 0 ? simulatedUnits : 0;
  const simulatedTotal = safeUnits * product.commissionPerSale;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="h-4 w-4 text-orange-500 shrink-0" />
            <h2
              id="preview-modal-title"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
            >
              Detalhes do Produto
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
          <div className="space-y-3">
            <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 aspect-square flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              )}
            </div>

            <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 space-y-2">
              <label
                htmlFor="sim-units-input"
                className="block text-xs font-semibold text-gray-900 dark:text-gray-100"
              >
                Simulador de ganho
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Se eu vender
                </span>
                <input
                  id="sim-units-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  value={simulatedUnits}
                  onChange={(e) => setSimulatedUnits(Number(e.target.value))}
                  className="h-9 w-20 px-2.5 text-xs font-semibold text-center rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  unidades
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ganho estimado:{" "}
                <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                  {formatBRL(simulatedTotal)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {product.marketplaceName} · {product.category}
              </p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 leading-snug">
                {product.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-semibold">
                -{product.discountPercent}% OFF
              </span>
              {product.flags.map((flag) => (
                <FlagBadge key={flag} flag={flag} />
              ))}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatBRL(product.currentPrice)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                {formatBRL(product.previousPrice)}
              </span>
            </div>

            <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                  Por que este produto?
                </span>
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {product.valueScore !== null
                    ? `${product.valueScore}/100`
                    : "Sem dados"}
                </span>
              </div>

              <ValueBar valueScore={product.valueScore} tier={product.tier} />

              <div className="space-y-2 pt-1">
                <BreakdownRow
                  label="Comissão"
                  detail={`${formatPercent(product.commissionRate)} (${formatBRL(
                    product.commissionPerSale
                  )}/venda)`}
                  percent={commissionPct}
                  barClass="bg-emerald-500"
                />
                <BreakdownRow
                  label={`Vendas (${product.marketplaceName})`}
                  detail={
                    product.salesCount30d !== null
                      ? `${formatInt(product.salesCount30d)} un. em 30d`
                      : "Sem dados de vendas"
                  }
                  percent={salesPct}
                  barClass="bg-blue-500"
                />
                <BreakdownRow
                  label="Confiança da amostra"
                  detail={
                    confidencePct !== null
                      ? `${confidencePct}% (baseado em 30d)`
                      : "Indisponível"
                  }
                  percent={confidencePct}
                  barClass="bg-amber-500"
                />
              </div>

              {product.estimatedEarnings30d !== null && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-800">
                  Potencial total do mercado (30d):{" "}
                  <strong className="text-gray-800 dark:text-gray-200">
                    {formatBRL(product.estimatedEarnings30d)}
                  </strong>
                </p>
              )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Última atualização: {formatRelative(product.updatedAt)}
            </p>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir link de afiliado</span>
              </a>
              <button
                type="button"
                onClick={onCopy}
                className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isCopied
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Link copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar link de afiliado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BreakdownRow({
  label,
  detail,
  percent,
  barClass,
}: {
  label: string;
  detail: string;
  percent: number | null;
  barClass: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{detail}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            percent === null ? "bg-gray-300 dark:bg-gray-700" : barClass
          }`}
          style={{ width: `${percent === null ? 0 : Math.max(4, percent)}%` }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   Skeleton de Carregamento com a altura aproximada dos cards
========================================================= */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col overflow-hidden animate-pulse"
    >
      <div className="aspect-[4/3] w-full bg-gray-200 dark:bg-gray-800" />
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-20 w-full rounded-md bg-gray-100 dark:bg-gray-800/80" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-9 flex-1 rounded-md bg-gray-200 dark:bg-gray-800" />
          <div className="h-9 w-20 rounded-md bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}