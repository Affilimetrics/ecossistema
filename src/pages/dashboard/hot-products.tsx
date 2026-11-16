import { useMemo, useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  X,
  TrendingDown,
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

/* ============================================================
   VARIANTS DE ANIMAÇÃO DE ENTRADA
   ============================================================ */

const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, ease: "easeOut" },
  },
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

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
  {
    id: "p-001",
    name: "iPhone 15 Pro 256GB Titanium",
    category: "Eletrônicos",
    marketplaceName: "Amazon",
    score: 151.0,
    discountPercent: 22,
    currentPrice: 7349.0,
    previousPrice: 9499.0,
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/iphone15pro",
    updatedAt: "2024-04-18T14:32:00-03:00",
  },
  {
    id: "p-002",
    name: "MacBook Air M2 13\" 256GB SSD",
    category: "Eletrônicos",
    marketplaceName: "Magazine Luiza",
    score: 138.99,
    discountPercent: 18,
    currentPrice: 8199.0,
    previousPrice: 9999.0,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/macbookair",
    updatedAt: "2024-04-18T14:32:00-03:00",
  },
  {
    id: "p-003",
    name: "AirPods Pro 2ª Geração USB-C",
    category: "Eletrônicos",
    marketplaceName: "Amazon",
    score: 122.4,
    discountPercent: 30,
    currentPrice: 1399.0,
    previousPrice: 1999.0,
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/airpods",
    updatedAt: "2024-04-18T13:10:00-03:00",
  },
  {
    id: "p-004",
    name: "Aspirador Robô Xiaomi S10+ com Mopa",
    category: "Casa e Cozinha",
    marketplaceName: "AliExpress",
    score: 118.7,
    discountPercent: 35,
    currentPrice: 1899.0,
    previousPrice: 2920.0,
    imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/xiaomi-s10",
    updatedAt: "2024-04-18T12:45:00-03:00",
  },
  {
    id: "p-005",
    name: "Smart TV 65\" 4K QLED 120Hz",
    category: "Eletrônicos",
    marketplaceName: "Casas Bahia",
    score: 112.1,
    discountPercent: 28,
    currentPrice: 3799.0,
    previousPrice: 5276.0,
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/tv65",
    updatedAt: "2024-04-18T11:20:00-03:00",
  },
  {
    id: "p-006",
    name: "Cafeteira Nespresso Vertuo Next",
    category: "Casa e Cozinha",
    marketplaceName: "Amazon",
    score: 98.3,
    discountPercent: 41,
    currentPrice: 699.0,
    previousPrice: 1185.0,
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/nespresso",
    updatedAt: "2024-04-17T22:00:00-03:00",
  },
  {
    id: "p-007",
    name: "Tênis de Corrida Nike Pegasus 40",
    category: "Esportes",
    marketplaceName: "Nike",
    score: 94.6,
    discountPercent: 25,
    currentPrice: 599.0,
    previousPrice: 799.0,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/pegasus40",
    updatedAt: "2024-04-17T20:14:00-03:00",
  },
  {
    id: "p-008",
    name: "Kit 3 Panelas Antiaderente Tramontina",
    category: "Casa e Cozinha",
    marketplaceName: "Mercado Livre",
    score: 88.9,
    discountPercent: 33,
    currentPrice: 289.0,
    previousPrice: 431.0,
    imageUrl: "https://images.unsplash.com/photo-1584990347449-fd98bc063110?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/tramontina",
    updatedAt: "2024-04-17T18:30:00-03:00",
  },
  {
    id: "p-009",
    name: "PlayStation 5 Slim + 2 Controles",
    category: "Eletrônicos",
    marketplaceName: "Magazine Luiza",
    score: 86.2,
    discountPercent: 15,
    currentPrice: 3999.0,
    previousPrice: 4704.0,
    imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/ps5",
    updatedAt: "2024-04-17T16:00:00-03:00",
  },
  {
    id: "p-010",
    name: "Fone Bluetooth JBL Tune 770NC",
    category: "Eletrônicos",
    marketplaceName: "Amazon",
    score: 82.4,
    discountPercent: 27,
    currentPrice: 429.0,
    previousPrice: 587.0,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/jbl770",
    updatedAt: "2024-04-17T14:22:00-03:00",
  },
  {
    id: "p-011",
    name: "Luminária de Mesa Articulada LED",
    category: "Casa e Cozinha",
    marketplaceName: "Mercado Livre",
    score: 74.1,
    discountPercent: 38,
    currentPrice: 129.0,
    previousPrice: 208.0,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/luminaria",
    updatedAt: "2024-04-17T12:10:00-03:00",
  },
  {
    id: "p-012",
    name: "Mochila Casual Impermeável 25L",
    category: "Moda",
    marketplaceName: "Shopee",
    score: 68.5,
    discountPercent: 45,
    currentPrice: 159.0,
    previousPrice: 289.0,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/mochila",
    updatedAt: "2024-04-17T10:00:00-03:00",
  },
  {
    id: "p-013",
    name: "Livro — Hábitos Atômicos (James Clear)",
    category: "Livros",
    marketplaceName: "Amazon",
    score: 61.2,
    discountPercent: 32,
    currentPrice: 45.9,
    previousPrice: 67.5,
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/habitos",
    updatedAt: "2024-04-16T22:00:00-03:00",
  },
  {
    id: "p-014",
    name: "Lego City Bombeiros 60375 (310 peças)",
    category: "Brinquedos",
    marketplaceName: "Ri Happy",
    score: 54.8,
    discountPercent: 20,
    currentPrice: 199.0,
    previousPrice: 248.7,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=80",
    affiliateUrl: "https://example.com/aff/lego",
    updatedAt: "2024-04-16T19:00:00-03:00",
  },
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
      if (q && !p.name.toLowerCase().includes(q) && !p.marketplaceName.toLowerCase().includes(q)) return false;
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
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto p-6"
    >
      {/* CABEÇALHO PADRONIZADO */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between mb-8"
      >
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
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {/* BARRA DE FILTROS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6 shadow-xs"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto ou marketplace..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === "Todas" ? "Todas as categorias" : c}</option>
              ))}
            </select>

            <select
              value={minDiscount}
              onChange={(e) => setMinDiscount(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value={0}>Qualquer desconto</option>
              <option value={10}>Desconto ≥ 10%</option>
              <option value={20}>Desconto ≥ 20%</option>
              <option value={30}>Desconto ≥ 30%</option>
              <option value={40}>Desconto ≥ 40%</option>
            </select>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="score">Maior pontuação (Score)</option>
              <option value="discount">Maior desconto (%)</option>
              <option value="priceAsc">Menor preço</option>
              <option value="priceDesc">Maior preço</option>
              <option value="recent">Atualizados recentemente</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>

          <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
            {filtered.length} {filtered.length === 1 ? "oportunidade" : "oportunidades"}
          </span>
        </div>
      </motion.div>

      {/* GRID DE PRODUTOS */}
      {loading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {filtered.map((p, idx) => (
            <ProductCard key={p.id} product={p} rank={idx + 1} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ============================================================
   CARD DE PRODUTO COM IMAGEM EM DESTAQUE
   ============================================================ */

function ProductCard({ product, rank }: { product: Product; rank: number }) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const savings = Math.max(0, product.previousPrice - product.currentPrice);

  const copyAffiliate = () => {
    navigator.clipboard.writeText(product.affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const rankStyle =
    rank === 1
      ? "bg-amber-500 text-white shadow-sm"
      : rank === 2
      ? "bg-slate-600 text-white shadow-sm"
      : rank === 3
      ? "bg-orange-700 text-white shadow-sm"
      : "bg-slate-900/75 text-white backdrop-blur-xs";

  return (
    <motion.div
      variants={itemVars}
      className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
    >
      {/* ÁREA DA IMAGEM AMPLIADA */}
      <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800/60 overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-400">
            <ImageIcon className="h-9 w-9 stroke-[1.5]" />
            <span className="text-[11px]">Sem imagem</span>
          </div>
        )}

        {/* Badge de Posição no Ranking */}
        <span
          className={`absolute top-3 left-3 inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums ${rankStyle}`}
        >
          #{rank}
        </span>

        {/* Badge de Desconto */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
          <TrendingDown className="h-3.5 w-3.5" />
          -{product.discountPercent}%
        </span>

        {/* Badge do Marketplace */}
        <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-950/85 backdrop-blur-xs text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-xs">
          {product.marketplaceName}
        </span>
      </div>

      {/* CONTEÚDO DO CARD */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Categoria e Score */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
            {product.category}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0"
            title="Pontuação de relevância da oferta"
          >
            <Flame className="h-3 w-3" />
            {product.score.toFixed(1)}
          </span>
        </div>

        {/* Nome do Produto */}
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3 min-h-[2.5rem]"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Bloco de Preços */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.previousPrice > product.currentPrice && (
                <p className="text-xs text-slate-400 dark:text-slate-500 line-through tabular-nums">
                  {formatBRL(product.previousPrice)}
                </p>
              )}
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {formatBRL(product.currentPrice)}
              </p>
            </div>

            {savings > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md tabular-nums">
                Economia {formatBRL(savings)}
              </span>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={copyAffiliate}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Link copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar link
                </>
              )}
            </button>

            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Abrir link de afiliado"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   SKELETON E EMPTY STATE
   ============================================================ */

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden animate-pulse"
        >
          <div className="h-52 bg-slate-200 dark:bg-slate-800" />
          <div className="p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-9 w-full bg-slate-200 dark:bg-slate-800 rounded-lg mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
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
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}

export default HotProductsContent;