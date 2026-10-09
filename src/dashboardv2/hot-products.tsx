import { useState, useMemo, Dispatch, SetStateAction } from "react";
import {
  ChevronDown,
  RefreshCw,
  Flame,
  TrendingDown,
  ExternalLink,
  Bell,
  Sun,
  Moon,
  User,
} from "lucide-react";

/* ============================================================
   TIPOS
   ============================================================ */

interface HotProduct {
  id: string;
  discount: number;
  score: number;
  category: "cozinha" | "quarto" | "sala" | "banheiro";
  title: string;
  description: string;
  currentPrice: number;
  previousPrice: number;
  affiliateUrl: string;
}

interface HotProductsContentProps {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

/* ============================================================
   DADOS DE EXEMPLO
   ============================================================ */

const PRODUCTS: HotProduct[] = [
  {
    id: "1",
    discount: 48,
    score: 151.0,
    category: "cozinha",
    title:
      "Armário de Cozinha 12 Portas 1 Gaveta com Nichos Clarice Yescasa Freijó/Grafite Acetinado Marrom/Freijo",
    description: "48% de desconto. coletado recentemente",
    currentPrice: 654.53,
    previousPrice: 1259.97,
    affiliateUrl: "#",
  },
  {
    id: "2",
    discount: 42,
    score: 138.99,
    category: "cozinha",
    title:
      "Armário de Cozinha 8 Portas 2 Gavetas Branco/Freijo/Soft - Kits Paraná",
    description: "42% de desconto. coletado recentemente",
    currentPrice: 367.04,
    previousPrice: 642.32,
    affiliateUrl: "#",
  },
  {
    id: "3",
    discount: 42,
    score: 138.95,
    category: "quarto",
    title:
      "Quarto de Bebê Completo Berço 3 em 1, Cômoda e Guarda Roupa MDF Nina Espresso Móveis Branco/Amêndoa",
    description: "42% de desconto. coletado recentemente",
    currentPrice: 1499.98,
    previousPrice: 2624.97,
    affiliateUrl: "#",
  },
  {
    id: "4",
    discount: 40,
    score: 134.95,
    category: "quarto",
    title:
      "Quarto de Bebê Completo com Berço 3 em 1 para Colchão 130x60cm Sol Multimóveis MP4526",
    description: "40% de desconto. coletado recentemente",
    currentPrice: 1299.99,
    previousPrice: 2189.99,
    affiliateUrl: "#",
  },
  {
    id: "5",
    discount: 37,
    score: 128.97,
    category: "cozinha",
    title: "Armário de Cozinha Compacta Sofia Multimóveis Preta",
    description: "37% de desconto. coletado recentemente",
    currentPrice: 499.99,
    previousPrice: 799.99,
    affiliateUrl: "#",
  },
  {
    id: "6",
    discount: 36,
    score: 126.99,
    category: "cozinha",
    title: "Armário de Cozinha Compacta Smart Multimóveis MP2183",
    description: "36% de desconto. coletado recentemente",
    currentPrice: 594.99,
    previousPrice: 939.99,
    affiliateUrl: "#",
  },
];

const CATEGORIES = [
  { value: "todas", label: "Todas" },
  { value: "cozinha", label: "Cozinha" },
  { value: "quarto", label: "Quarto" },
  { value: "sala", label: "Sala" },
  { value: "banheiro", label: "Banheiro" },
];

/* ============================================================
   HELPERS
   ============================================================ */

const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

const HotProductsContent = ({ isDark, setIsDark }: HotProductsContentProps) => {
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (selectedCategory === "todas") return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const lastUpdate = "29/09/2026 10:06";

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* ============ HEADER ============ */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Produtos Em Alta
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ranking para reforço/repotagem. É recalculado automaticamente a cada
            5 dias com desconto, queda de preço e recência.
          </p>
        </div>

        {/* Ações no topo: Bell + Tema + User */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ============ FILTROS ============ */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Categoria
            </label>
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <span>
                  {CATEGORIES.find((c) => c.value === selectedCategory)
                    ?.label ?? "Todas"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedCategory === cat.value
                          ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Última atualização: {lastUpdate}
            </span>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
              <RefreshCw className="h-4 w-4" />
              Recalcular agora
            </button>
          </div>
        </div>
      </div>

      {/* ============ ESTATÍSTICAS (movidas para cima) ============ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          Icon={Flame}
          label="Produtos Em Alta"
          value={filtered.length.toString()}
          hint="na categoria selecionada"
          color="orange"
        />
        <StatCard
          Icon={TrendingDown}
          label="Desconto médio"
          value={`${Math.round(
            filtered.reduce((s, p) => s + p.discount, 0) / (filtered.length || 1)
          )}%`}
          hint="nos itens listados"
          color="green"
        />
        <StatCard
          Icon={RefreshCw}
          label="Atualização"
          value="5 dias"
          hint="ciclo automático"
          color="blue"
        />
      </div>

      {/* ============ GRID DE PRODUTOS ============ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((product) => (
          <HotProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          Nenhum produto encontrado nessa categoria.
        </div>
      )}
    </div>
  );
};

/* ============================================================
   CARD DE PRODUTO
   ============================================================ */

const HotProductCard = ({ product }: { product: HotProduct }) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-md bg-yellow-500 text-black text-xs font-bold px-2.5 py-1">
            {product.discount}% OFF
          </span>
          <span className="inline-flex items-center rounded-md bg-blue-600 text-white text-xs font-semibold px-2.5 py-1">
            Score {product.score.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-1 capitalize">
          {product.category}
        </span>
      </div>

      <h3 className="text-sm md:text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug mb-2 line-clamp-3">
        {product.title}
      </h3>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {product.description}
      </p>

      <div className="flex items-center gap-3 text-sm mb-4">
        <span className="text-gray-500 dark:text-gray-400">
          Atual:{" "}
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            {formatBRL(product.currentPrice)}
          </span>
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          Anterior:{" "}
          <span className="line-through">
            {formatBRL(product.previousPrice)}
          </span>
        </span>
      </div>

      <a
        href={product.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
        Abrir link afiliado
      </a>
    </div>
  );
};

/* ============================================================
   STAT CARD
   ============================================================ */

interface StatCardProps {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  color: "orange" | "green" | "blue";
}

const StatCard = ({ Icon, label, value, hint, color }: StatCardProps) => {
  const colors = {
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600 dark:text-orange-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-600 dark:text-green-400",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
    },
  }[color];

  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>
      <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>
    </div>
  );
};

export default HotProductsContent;