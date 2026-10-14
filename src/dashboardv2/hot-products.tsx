import { useMemo, useState, useEffect } from "react";
import {
  Flame,
  Tag,
  Percent,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ExternalLink,
  TrendingDown,
  Sparkles,
  PackageOpen,
  AlertTriangle,
  X,
  Image as ImageIcon,
  Star,
  Bell,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { motion } from "framer-motion";

/* ============================================================
   TIPOS
   ============================================================ */

interface Product {
  id: string;
  name: string;
  category: string;
  score: number;
  discountPercent: number;
  currentPrice: number;
  previousPrice: number;
  imageUrl?: string;
  affiliateUrl: string;
  updatedAt: string;
}

type SortKey = "score" | "discount" | "priceAsc" | "priceDesc" | "recent";

/* ============================================================
   DADOS DE DEMONSTRAÇÃO
   ============================================================ */

const CATEGORIES = [
  "Todas",
  "Eletrônicos",
  "Casa e Cozinha",
  "Moda",
  "Esportes",
  "Livros",
  "Brinquedos",
] as const;

type Category = (typeof CATEGORIES)[number];

const MOCK_PRODUCTS: Product[] = [
  { id: "p-001", name: "iPhone 15 Pro 256GB Titanium", category: "Eletrônicos", score: 151.0, discountPercent: 22, currentPrice: 7349.0, previousPrice: 9499.0, affiliateUrl: "https://example.com/aff/iphone15pro", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-002", name: "MacBook Air M2 13\" 256GB SSD", category: "Eletrônicos", score: 138.99, discountPercent: 18, currentPrice: 8199.0, previousPrice: 9999.0, affiliateUrl: "https://example.com/aff/macbookair", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-003", name: "AirPods Pro 2ª Geração USB-C", category: "Eletrônicos", score: 122.4, discountPercent: 30, currentPrice: 1399.0, previousPrice: 1999.0, affiliateUrl: "https://example.com/aff/airpods", updatedAt: "2024-04-18T13:10:00-03:00" },
  { id: "p-004", name: "Aspirador Robô Xiaomi S10+ com Mopa", category: "Casa e Cozinha", score: 118.7, discountPercent: 35, currentPrice: 1899.0, previousPrice: 2920.0, affiliateUrl: "https://example.com/aff/xiaomi-s10", updatedAt: "2024-04-18T12:45:00-03:00" },
  { id: "p-005", name: "Smart TV 65\" 4K QLED 120Hz", category: "Eletrônicos", score: 112.1, discountPercent: 28, currentPrice: 3799.0, previousPrice: 5276.0, affiliateUrl: "https://example.com/aff/tv65", updatedAt: "2024-04-18T11:20:00-03:00" },
  { id: "p-006", name: "Cafeteira Nespresso Vertuo Next", category: "Casa e Cozinha", score: 98.3, discountPercent: 41, currentPrice: 699.0, previousPrice: 1185.0, affiliateUrl: "https://example.com/aff/nespresso", updatedAt: "2024-04-17T22:00:00-03:00" },
  { id: "p-007", name: "Tênis de Corrida Nike Pegasus 40", category: "Esportes", score: 94.6, discountPercent: 25, currentPrice: 599.0, previousPrice: 799.0, affiliateUrl: "https://example.com/aff/pegasus40", updatedAt: "2024-04-17T20:14:00-03:00" },
  { id: "p-008", name: "Kit 3 Panelas Antiaderente Tramontina", category: "Casa e Cozinha", score: 88.9, discountPercent: 33, currentPrice: 289.0, previousPrice: 431.0, affiliateUrl: "https://example.com/aff/tramontina", updatedAt: "2024-04-17T18:30:00-03:00" },
  { id: "p-009", name: "PlayStation 5 Slim + 2 Controles", category: "Eletrônicos", score: 86.2, discountPercent: 15, currentPrice: 3999.0, previousPrice: 4704.0, affiliateUrl: "https://example.com/aff/ps5", updatedAt: "2024-04-17T16:00:00-03:00" },
  { id: "p-010", name: "Fone Bluetooth JBL Tune 770NC", category: "Eletrônicos", score: 82.4, discountPercent: 27, currentPrice: 429.0, previousPrice: 587.0, affiliateUrl: "https://example.com/aff/jbl770", updatedAt: "2024-04-17T14:22:00-03:00" },
  { id: "p-011", name: "Luminária de Mesa Articulada LED", category: "Casa e Cozinha", score: 74.1, discountPercent: 38, currentPrice: 129.0, previousPrice: 208.0, affiliateUrl: "https://example.com/aff/luminaria", updatedAt: "2024-04-17T12:10:00-03:00" },
  { id: "p-012", name: "Mochila Casual Impermeável 25L", category: "Moda", score: 68.5, discountPercent: 45, currentPrice: 159.0, previousPrice: 289.0, affiliateUrl: "https://example.com/aff/mochila", updatedAt: "2024-04-17T10:00:00-03:00" },
  { id: "p-013", name: "Livro — Hábitos Atômicos (James Clear)", category: "Livros", score: 61.2, discountPercent: 32, currentPrice: 45.9, previousPrice: 67.5, affiliateUrl: "https://example.com/aff/habitos", updatedAt: "2024-04-16T22:00:00-03:00" },
  { id: "p-014", name: "Lego City Bombeiros 60375 (310 peças)", category: "Brinquedos", score: 54.8, discountPercent: 20, currentPrice: 199.0, previousPrice: 248.7, affiliateUrl: "https://example.com/aff/lego", updatedAt: "2024-04-16T19:00:00-03:00" },
];

/* ============================================================
   HELPERS
   ============================================================ */

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
};

const calcSavings = (p: Product) => Math.max(0, p.previousPrice - p.currentPrice);

/* ============================================================
   PÁGINA
   ============================================================ */

interface HotProductsContentProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HotProductsContent({
  isDark,
  setIsDark,
}: HotProductsContentProps) {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [category, setCategory] = useState<Category>("Todas");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [minDiscount, setMinDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(
    MOCK_PRODUCTS[0]?.updatedAt ?? new Date().toISOString()
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category !== "Todas" && p.category !== category) return false;
      if (p.discountPercent < minDiscount) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "score": return b.score - a.score;
        case "discount": return b.discountPercent - a.discountPercent;
        case "priceAsc": return a.currentPrice - b.currentPrice;
        case "priceDesc": return b.currentPrice - a.currentPrice;
        case "recent":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default: return 0;
      }
    });

    return list;
  }, [products, category, search, minDiscount, sortKey]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const avgDiscount =
      total > 0 ? filtered.reduce((s, p) => s + p.discountPercent, 0) / total : 0;
    const maxDiscount =
      total > 0 ? Math.max(...filtered.map((p) => p.discountPercent)) : 0;
    return { total, avgDiscount, maxDiscount };
  }, [filtered]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date().toISOString());
    }, 900);
  };

  const hasActiveFilters =
    category !== "Todas" || search !== "" || minDiscount > 0;

  const clearFilters = () => {
    setCategory("Todas");
    setSearch("");
    setMinDiscount(0);
    setSortKey("score");
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Produtos em Alta
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            Ranking inteligente de oportunidades com maior desconto e potencial
            de conversão.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Atualizado {formatRelative(lastUpdate)}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span>{formatDateTime(lastUpdate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Recalculando..." : "Recalcular"}
          </button>

          <TopActions isDark={isDark} setIsDark={setIsDark} />
        </div>
      </div>

      {/* ============ KPIs ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard icon={Flame} label="Produtos em alta" value={kpis.total.toString()} hint="Produtos no ranking após filtros aplicados" tone="amber" />
        <KpiCard icon={Percent} label="Desconto médio" value={`${kpis.avgDiscount.toFixed(1)}%`} hint="Média dos descontos dos produtos filtrados" tone="blue" />
        <KpiCard icon={Sparkles} label="Maior desconto" value={`${kpis.maxDiscount.toFixed(0)}%`} hint="Maior desconto entre os produtos filtrados" tone="green" />
      </div>

      {/* ============ FILTROS ============ */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Filtros e ordenação
          </h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <X className="h-3.5 w-3.5" />
              Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative xl:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "Todas" ? "Todas as categorias" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="score">Pontuação (maior primeiro)</option>
              <option value="discount">Maior desconto</option>
              <option value="priceAsc">Menor preço</option>
              <option value="priceDesc">Maior preço</option>
              <option value="recent">Mais recente</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value={0}>Qualquer desconto</option>
              <option value={10}>≥ 10%</option>
              <option value={20}>≥ 20%</option>
              <option value={30}>≥ 30%</option>
              <option value={40}>≥ 40%</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============ GRID ============ */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState onClear={clearFilters} hasRecords={products.length > 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} rank={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AÇÕES DO TOPO (Bell / Tema / User)
   ============================================================ */

interface TopActionsProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

function TopActions({ isDark, setIsDark }: TopActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
      </button>
      <button
        onClick={() => setIsDark(!isDark)}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <button
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        aria-label="Perfil"
      >
        <User className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES
   ============================================================ */

type Tone = "amber" | "blue" | "green";

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
}

const toneStyles: Record<Tone, { bg: string; text: string }> = {
  amber: { bg: "bg-amber-500/10 dark:bg-amber-500/15", text: "text-amber-600 dark:text-amber-400" },
  blue: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400" },
  green: { bg: "bg-green-500/10 dark:bg-green-500/15", text: "text-green-600 dark:text-green-400" },
};

function KpiCard({ icon: Icon, label, value, hint, tone }: KpiCardProps) {
  const t = toneStyles[tone];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${t.bg}`}>
          <Icon className={`h-4.5 w-4.5 ${t.text}`} />
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">{value}</p>
      {hint && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  rank: number;
}

function ProductCard({ product, rank }: ProductCardProps) {
  const savings = calcSavings(product);
  const [imgError, setImgError] = useState(false);

  const isTop3 = rank <= 3;
  const rankStyles = isTop3
    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/25"
    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(rank * 0.03, 0.4) }}
      className="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden"
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-slate-400 dark:text-slate-600" />
          </div>
        )}

        <div className={`absolute top-3 left-3 inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg text-xs font-bold tabular-nums ${rankStyles}`}>
          #{rank}
        </div>

        {product.discountPercent > 0 && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-400 text-amber-950 text-xs font-bold shadow-sm">
            <TrendingDown className="h-3 w-3" />
            -{product.discountPercent}%
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            <Tag className="h-2.5 w-2.5" />
            {product.category}
          </span>
          <ScorePill score={product.score} />
        </div>

        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-3">
          {product.name}
        </h3>

        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatBRL(product.currentPrice)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="line-through">{formatBRL(product.previousPrice)}</span>
            {savings > 0 && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                Economize {formatBRL(savings)}
              </span>
            )}
          </div>

          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white text-sm font-semibold transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir link de afiliado
          </a>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
            Atualizado em {formatDateTime(product.updatedAt)}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full"
      title="Pontuação interna do ranking (fatores: desconto, queda de preço e recência)."
    >
      <Star className="h-2.5 w-2.5 text-amber-500" />
      Score {score.toFixed(1)}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse"
        >
          <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  hasRecords: boolean;
  onClear: () => void;
}

function EmptyState({ hasRecords, onClear }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 px-6 text-center">
      <div className="mx-auto p-3 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mb-4">
        {hasRecords ? (
          <PackageOpen className="h-6 w-6 text-slate-400" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-slate-400" />
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {hasRecords ? "Nenhum produto encontrado" : "Sem produtos no ranking"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
        {hasRecords
          ? "Ajuste os filtros para encontrar produtos que correspondam à sua busca."
          : "Aguarde a próxima coleta ou verifique a integração com a fonte de dados."}
      </p>
      {hasRecords && (
        <button
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}