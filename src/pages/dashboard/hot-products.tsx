import { useMemo, useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Moon,
  Sun,
  User,
  X,
  TrendingDown,
} from "lucide-react";
import { NotificationPopover } from "../../components/ui/notification-popover";

/* ============================================================
   TIPOS E DADOS
   ============================================================ */

interface Product {
  id: string;
  name: string;
  category: string;
  marketplaceName: string;
  score: number;
  discountPercent: number;
  currentPrice: number;
  previousPrice: number;
  imageUrl?: string;
  affiliateUrl: string;
  updatedAt: string;
}

type SortKey = "score" | "discount" | "priceAsc" | "priceDesc" | "recent";

const CATEGORIES = ["Todas", "Eletrônicos", "Casa e Cozinha", "Moda", "Esportes", "Livros", "Brinquedos"] as const;
type Category = (typeof CATEGORIES)[number];

const MOCK_PRODUCTS: Product[] = [
  { id: "p-001", name: "iPhone 15 Pro 256GB Titanium", category: "Eletrônicos", marketplaceName: "Amazon", score: 151.0, discountPercent: 22, currentPrice: 7349.0, previousPrice: 9499.0, affiliateUrl: "https://example.com/aff/iphone15pro", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-002", name: "MacBook Air M2 13\" 256GB SSD", category: "Eletrônicos", marketplaceName: "Magazine Luiza", score: 138.99, discountPercent: 18, currentPrice: 8199.0, previousPrice: 9999.0, affiliateUrl: "https://example.com/aff/macbookair", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-003", name: "AirPods Pro 2ª Geração USB-C", category: "Eletrônicos", marketplaceName: "Amazon", score: 122.4, discountPercent: 30, currentPrice: 1399.0, previousPrice: 1999.0, affiliateUrl: "https://example.com/aff/airpods", updatedAt: "2024-04-18T13:10:00-03:00" },
  { id: "p-004", name: "Aspirador Robô Xiaomi S10+ com Mopa", category: "Casa e Cozinha", marketplaceName: "AliExpress", score: 118.7, discountPercent: 35, currentPrice: 1899.0, previousPrice: 2920.0, affiliateUrl: "https://example.com/aff/xiaomi-s10", updatedAt: "2024-04-18T12:45:00-03:00" },
  { id: "p-005", name: "Smart TV 65\" 4K QLED 120Hz", category: "Eletrônicos", marketplaceName: "Casas Bahia", score: 112.1, discountPercent: 28, currentPrice: 3799.0, previousPrice: 5276.0, affiliateUrl: "https://example.com/aff/tv65", updatedAt: "2024-04-18T11:20:00-03:00" },
  { id: "p-006", name: "Cafeteira Nespresso Vertuo Next", category: "Casa e Cozinha", marketplaceName: "Amazon", score: 98.3, discountPercent: 41, currentPrice: 699.0, previousPrice: 1185.0, affiliateUrl: "https://example.com/aff/nespresso", updatedAt: "2024-04-17T22:00:00-03:00" },
  { id: "p-007", name: "Tênis de Corrida Nike Pegasus 40", category: "Esportes", marketplaceName: "Nike", score: 94.6, discountPercent: 25, currentPrice: 599.0, previousPrice: 799.0, affiliateUrl: "https://example.com/aff/pegasus40", updatedAt: "2024-04-17T20:14:00-03:00" },
  { id: "p-008", name: "Kit 3 Panelas Antiaderente Tramontina", category: "Casa e Cozinha", marketplaceName: "Mercado Livre", score: 88.9, discountPercent: 33, currentPrice: 289.0, previousPrice: 431.0, affiliateUrl: "https://example.com/aff/tramontina", updatedAt: "2024-04-17T18:30:00-03:00" },
  { id: "p-009", name: "PlayStation 5 Slim + 2 Controles", category: "Eletrônicos", marketplaceName: "Magazine Luiza", score: 86.2, discountPercent: 15, currentPrice: 3999.0, previousPrice: 4704.0, affiliateUrl: "https://example.com/aff/ps5", updatedAt: "2024-04-17T16:00:00-03:00" },
  { id: "p-010", name: "Fone Bluetooth JBL Tune 770NC", category: "Eletrônicos", marketplaceName: "Amazon", score: 82.4, discountPercent: 27, currentPrice: 429.0, previousPrice: 587.0, affiliateUrl: "https://example.com/aff/jbl770", updatedAt: "2024-04-17T14:22:00-03:00" },
  { id: "p-011", name: "Luminária de Mesa Articulada LED", category: "Casa e Cozinha", marketplaceName: "Mercado Livre", score: 74.1, discountPercent: 38, currentPrice: 129.0, previousPrice: 208.0, affiliateUrl: "https://example.com/aff/luminaria", updatedAt: "2024-04-17T12:10:00-03:00" },
  { id: "p-012", name: "Mochila Casual Impermeável 25L", category: "Moda", marketplaceName: "Shopee", score: 68.5, discountPercent: 45, currentPrice: 159.0, previousPrice: 289.0, affiliateUrl: "https://example.com/aff/mochila", updatedAt: "2024-04-17T10:00:00-03:00" },
  { id: "p-013", name: "Livro — Hábitos Atômicos (James Clear)", category: "Livros", marketplaceName: "Amazon", score: 61.2, discountPercent: 32, currentPrice: 45.9, previousPrice: 67.5, affiliateUrl: "https://example.com/aff/habitos", updatedAt: "2024-04-16T22:00:00-03:00" },
  { id: "p-014", name: "Lego City Bombeiros 60375 (310 peças)", category: "Brinquedos", marketplaceName: "Ri Happy", score: 54.8, discountPercent: 20, currentPrice: 199.0, previousPrice: 248.7, affiliateUrl: "https://example.com/aff/lego", updatedAt: "2024-04-16T19:00:00-03:00" },
];

/* ============================================================
   HELPERS
   ============================================================ */

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

/* ============================================================
   TELA
   ============================================================ */

interface HotProductsContentProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function HotProductsContent({ isDark, setIsDark }: HotProductsContentProps) {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [category, setCategory] = useState<Category>("Todas");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [minDiscount, setMinDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(MOCK_PRODUCTS[0]?.updatedAt ?? new Date().toISOString());

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
        case "recent": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return list;
  }, [products, category, search, minDiscount, sortKey]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date().toISOString());
    }, 800);
  };

  const hasActiveFilters = category !== "Todas" || search !== "" || minDiscount > 0;

  const clearFilters = () => {
    setCategory("Todas");
    setSearch("");
    setMinDiscount(0);
    setSortKey("score");
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto p-6">
      {/* CABEÇALHO PADRONIZADO */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Produtos em Alta
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ranking por desconto, variação de preço e recência. Última atualização {formatRelative(lastUpdate)}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Recalcular
          </button>

          <NotificationPopover isDark={isDark} />

          <button
            onClick={() => setIsDark && setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none shadow-xs"
            title="Alternar tema"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none shadow-xs">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto"
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === "Todas" ? "Categoria" : c}</option>
          ))}
        </select>

        <select
          value={minDiscount}
          onChange={(e) => setMinDiscount(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
        >
          <option value={0}>Desconto</option>
          <option value={10}>≥ 10%</option>
          <option value={20}>≥ 20%</option>
          <option value={30}>≥ 30%</option>
          <option value={40}>≥ 40%</option>
        </select>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
        >
          <option value="score">Ordenar por pontuação</option>
          <option value="discount">Maior desconto</option>
          <option value="priceAsc">Menor preço</option>
          <option value="priceDesc">Maior preço</option>
          <option value="recent">Atualizados recentemente</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-1"
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} produtos
        </span>
      </div>

      {/* LISTA DE OPORTUNIDADES */}
      {loading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <ul className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((p, idx) => (
            <ProductRow key={p.id} product={p} rank={idx + 1} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductRow({ product, rank }: { product: Product; rank: number }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const savings = Math.max(0, product.previousPrice - product.currentPrice);

  const copyAffiliate = () => {
    navigator.clipboard.writeText(product.affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
      <span className="w-6 text-xs text-slate-400 dark:text-slate-500 tabular-nums text-right shrink-0">
        {rank}
      </span>

      <div className="h-10 w-10 shrink-0 rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <ImageIcon className="h-4 w-4 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {product.name}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
          {product.marketplaceName} · {product.category}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
        <TrendingDown className="h-3 w-3" />
        {product.discountPercent}%
      </div>

      <div className="text-right shrink-0 min-w-[110px]">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatBRL(product.currentPrice)}
        </p>
        {savings > 0 && (
          <p className="text-[11px] text-green-600 dark:text-green-400 tabular-nums">
            −{formatBRL(savings)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        <button
          onClick={copyAffiliate}
          className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Copiar link"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Abrir link de afiliado"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {hasFilters ? "Nenhum produto encontrado" : "Sem produtos no ranking"}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {hasFilters
          ? "Ajuste os filtros para ver mais resultados."
          : "Aguarde a próxima coleta para popular o ranking."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-3 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

export default HotProductsContent;