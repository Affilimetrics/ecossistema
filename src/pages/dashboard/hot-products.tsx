import { useMemo, useState, useEffect, useRef } from "react";
import {
  RefreshCw, Search, ExternalLink, Copy, Check, Image as ImageIcon, X, TrendingDown, Flame, SlidersHorizontal, ChevronDown,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

const containerVars: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, ease: "easeOut" } } };
const itemVars: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

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
  { id: "p-001", name: "iPhone 15 Pro 256GB Titanium", category: "Eletrônicos", marketplaceName: "Amazon", score: 151.0, discountPercent: 22, currentPrice: 7349.0, previousPrice: 9499.0, imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/iphone15pro", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-002", name: "MacBook Air M2 13\" 256GB SSD", category: "Eletrônicos", marketplaceName: "Magazine Luiza", score: 138.99, discountPercent: 18, currentPrice: 8199.0, previousPrice: 9999.0, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/macbookair", updatedAt: "2024-04-18T14:32:00-03:00" },
  { id: "p-003", name: "AirPods Pro 2ª Geração USB-C", category: "Eletrônicos", marketplaceName: "Amazon", score: 122.4, discountPercent: 30, currentPrice: 1399.0, previousPrice: 1999.0, imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/airpods", updatedAt: "2024-04-18T13:10:00-03:00" },
  { id: "p-004", name: "Aspirador Robô Xiaomi S10+ com Mopa", category: "Casa e Cozinha", marketplaceName: "AliExpress", score: 118.7, discountPercent: 35, currentPrice: 1899.0, previousPrice: 2920.0, imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/xiaomi-s10", updatedAt: "2024-04-18T12:45:00-03:00" },
  { id: "p-005", name: "Smart TV 65\" 4K QLED 120Hz", category: "Eletrônicos", marketplaceName: "Casas Bahia", score: 112.1, discountPercent: 28, currentPrice: 3799.0, previousPrice: 5276.0, imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/tv65", updatedAt: "2024-04-18T11:20:00-03:00" },
  { id: "p-006", name: "Cafeteira Nespresso Vertuo Next", category: "Casa e Cozinha", marketplaceName: "Amazon", score: 98.3, discountPercent: 41, currentPrice: 699.0, previousPrice: 1185.0, imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/nespresso", updatedAt: "2024-04-17T22:00:00-03:00" },
  { id: "p-007", name: "Tênis de Corrida Nike Pegasus 40", category: "Esportes", marketplaceName: "Nike", score: 94.6, discountPercent: 25, currentPrice: 599.0, previousPrice: 799.0, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/pegasus40", updatedAt: "2024-04-17T20:14:00-03:00" },
  { id: "p-008", name: "Kit 3 Panelas Antiaderente Tramontina", category: "Casa e Cozinha", marketplaceName: "Mercado Livre", score: 88.9, discountPercent: 33, currentPrice: 289.0, previousPrice: 431.0, imageUrl: "https://images.unsplash.com/photo-1584990347449-fd98bc063110?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/tramontina", updatedAt: "2024-04-17T18:30:00-03:00" },
  { id: "p-009", name: "PlayStation 5 Slim + 2 Controles", category: "Eletrônicos", marketplaceName: "Magazine Luiza", score: 86.2, discountPercent: 15, currentPrice: 3999.0, previousPrice: 4704.0, imageUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/ps5", updatedAt: "2024-04-17T16:00:00-03:00" },
  { id: "p-010", name: "Fone Bluetooth JBL Tune 770NC", category: "Eletrônicos", marketplaceName: "Amazon", score: 82.4, discountPercent: 27, currentPrice: 429.0, previousPrice: 587.0, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/jbl770", updatedAt: "2024-04-17T14:22:00-03:00" },
  { id: "p-011", name: "Luminária de Mesa Articulada LED", category: "Casa e Cozinha", marketplaceName: "Mercado Livre", score: 74.1, discountPercent: 38, currentPrice: 129.0, previousPrice: 208.0, imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/luminaria", updatedAt: "2024-04-17T12:10:00-03:00" },
  { id: "p-012", name: "Mochila Casual Impermeável 25L", category: "Moda", marketplaceName: "Shopee", score: 68.5, discountPercent: 45, currentPrice: 159.0, previousPrice: 289.0, imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/mochila", updatedAt: "2024-04-17T10:00:00-03:00" },
  { id: "p-013", name: "Livro — Hábitos Atômicos (James Clear)", category: "Livros", marketplaceName: "Amazon", score: 61.2, discountPercent: 32, currentPrice: 45.9, previousPrice: 67.5, imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/habitos", updatedAt: "2024-04-16T22:00:00-03:00" },
  { id: "p-014", name: "Lego City Bombeiros 60375 (310 peças)", category: "Brinquedos", marketplaceName: "Ri Happy", score: 58.7, discountPercent: 20, currentPrice: 199.9, previousPrice: 249.9, imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/lego-bombeiros", updatedAt: "2024-04-16T20:15:00-03:00" },
  { id: "p-015", name: "Cadeira Gamer ThunderX3 Ergonômica", category: "Casa e Cozinha", marketplaceName: "Terabyte", score: 55.3, discountPercent: 29, currentPrice: 1249.0, previousPrice: 1759.0, imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/cadeira-gamer", updatedAt: "2024-04-16T18:00:00-03:00" },
  { id: "p-016", name: "Relógio Smartwatch Galaxy Watch 6", category: "Eletrônicos", marketplaceName: "Samsung", score: 52.8, discountPercent: 24, currentPrice: 1699.0, previousPrice: 2235.0, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80", affiliateUrl: "https://example.com/aff/galaxy-watch6", updatedAt: "2024-04-16T16:40:00-03:00" },
];

const formatBRL = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
};

interface HotProductsProps { isDark?: boolean; setIsDark?: (value: boolean) => void; }

export function HotProducts({ isDark }: HotProductsProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("Todas");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const copyTimeout = useRef<number | null>(null);

  const filtered = useMemo(() => {
    let list = MOCK_PRODUCTS.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.marketplaceName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "Todas" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
    switch (sortKey) {
      case "score": list = [...list].sort((a, b) => b.score - a.score); break;
      case "discount": list = [...list].sort((a, b) => b.discountPercent - a.discountPercent); break;
      case "priceAsc": list = [...list].sort((a, b) => a.currentPrice - b.currentPrice); break;
      case "priceDesc": list = [...list].sort((a, b) => b.currentPrice - a.currentPrice); break;
      case "recent": list = [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); break;
    }
    return list;
  }, [search, activeCategory, sortKey]);

  const handleRefresh = async () => { setIsRefreshing(true); await new Promise((r) => setTimeout(r, 900)); setLastUpdated(new Date()); setIsRefreshing(false); };
  const handleCopyLink = async (product: Product) => {
    try {
      await navigator.clipboard.writeText(product.affiliateUrl);
      setCopiedId(product.id);
      if (copyTimeout.current) window.clearTimeout(copyTimeout.current);
      copyTimeout.current = window.setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  useEffect(() => () => { if (copyTimeout.current) window.clearTimeout(copyTimeout.current); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Produtos em Alta</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-[11px] font-medium text-orange-600 dark:text-orange-400">
              <Flame className="h-3 w-3" />
              <span>{filtered.length} em destaque</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Descubra oportunidades com base em score, desconto e atualizações recentes.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-6">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por produto ou marketplace..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full pl-9 pr-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" />
        </div>

        <div className="relative">
          <select aria-label="Filtrar por categoria" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value as Category)} className="h-9 appearance-none pl-3 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer">
            {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat === "Todas" ? "Todas as categorias" : cat}</option>))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>

        <button type="button" className="h-9 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors shadow-2xs whitespace-nowrap">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filtros</span>
        </button>

        <div className="flex items-center gap-3 sm:ml-auto">
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{filtered.length} oportunidades</span>
          <button type="button" onClick={handleRefresh} disabled={isRefreshing} className="h-9 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors shadow-2xs whitespace-nowrap disabled:opacity-60" title={`Atualizado ${formatRelative(lastUpdated.toISOString())}`}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Recalcular</span>
          </button>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow-xs">
          <Search className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nenhum produto encontrado</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ajuste a busca ou o filtro de categoria.</p>
        </div>
      ) : (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <motion.div key={p.id} variants={itemVars}>
              <ProductCard product={p} isCopied={copiedId === p.id} onCopy={() => handleCopyLink(p)} onPreview={() => setPreviewProduct(p)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {previewProduct && (
        <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} isCopied={copiedId === previewProduct.id} onCopy={() => handleCopyLink(previewProduct)} />
      )}
    </motion.div>
  );
}

function ProductCard({ product, isCopied, onCopy, onPreview }: { product: Product; isCopied: boolean; onCopy: () => void; onPreview: () => void; }) {
  return (
    <div className="group rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <button type="button" onClick={onPreview} className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-950 focus:outline-none" aria-label={`Ver detalhes de ${product.name}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600" /></div>
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold shadow-sm"><TrendingDown className="h-3 w-3" />-{product.discountPercent}%</span>
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-semibold backdrop-blur-sm"><Flame className="h-3 w-3 text-orange-400" />{product.score.toFixed(1)}</span>
      </button>

      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{product.marketplaceName} · {product.category}</p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mt-0.5 leading-snug">{product.name}</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatBRL(product.currentPrice)}</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 line-through">{formatBRL(product.previousPrice)}</span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">Atualizado {formatRelative(product.updatedAt)}</p>
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer" className="h-8 flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors shadow-xs"><ExternalLink className="h-3.5 w-3.5" /><span>Abrir</span></a>
          <button type="button" onClick={onCopy} className={`h-8 inline-flex items-center justify-center gap-1 px-2.5 rounded-md border text-[11px] font-medium transition-colors ${isCopied ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`} title="Copiar link de afiliado">
            {isCopied ? <><Check className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copiado</span></> : <><Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline">Copiar</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductPreviewModal({ product, onClose, isCopied, onCopy }: { product: Product; onClose: () => void; isCopied: boolean; onCopy: () => void; }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 min-w-0"><Flame className="h-4 w-4 text-orange-500 shrink-0" /><h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Detalhes do Produto</h2></div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0" aria-label="Fechar"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
          <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950 aspect-square flex items-center justify-center">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{product.marketplaceName} · {product.category}</p>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1 leading-snug">{product.name}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[11px] font-semibold"><TrendingDown className="h-3 w-3" />-{product.discountPercent}% OFF</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[11px] font-semibold"><Flame className="h-3 w-3" />Score {product.score.toFixed(1)}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatBRL(product.currentPrice)}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">{formatBRL(product.previousPrice)}</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Última atualização: {formatRelative(product.updatedAt)}</p>
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer" className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"><ExternalLink className="h-3.5 w-3.5" /><span>Abrir link de afiliado</span></a>
              <button type="button" onClick={onCopy} className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${isCopied ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {isCopied ? <><Check className="h-3.5 w-3.5" /><span>Link copiado!</span></> : <><Copy className="h-3.5 w-3.5" /><span>Copiar link de afiliado</span></>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default HotProducts;