import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  Search,
  Flame,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { motion, Variants, useReducedMotion } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";
import type {
  AdvancedFilters,
  Marketplace,
  Product,
  ProductWithMetrics,
  SortKey,
} from "../../types/hotProductsTypes";
import { getHotProducts, refreshHotProducts } from "../../services/hotProductsApi";
import { enrichProductsWithMetrics } from "../../lib/profitability";
import {
  FiltersPanel,
  IndexInfoButton,
  MarketplaceChips,
  ProductCard,
  ProductCardSkeleton,
  ProductPreviewModal,
  ProfitMatrix,
  TopPicks,
  formatRelative,
} from "../../components/layout/hot-products/HotProductsComponents";

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

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: "valueScore", label: "Mais vale a pena" },
  { value: "commissionRate", label: "Maior comissão (%)" },
  { value: "commissionPerSale", label: "Maior comissão (R$)" },
  { value: "salesCount30d", label: "Mais vendidos" },
  { value: "estimatedEarnings30d", label: "Maior potencial de ganho" },
  { value: "discountPercent", label: "Maior desconto" },
  { value: "priceAsc", label: "Menor preço" },
  { value: "priceDesc", label: "Maior preço" },
  { value: "recent", label: "Mais recentes" },
];

const INITIAL_ADVANCED_FILTERS: AdvancedFilters = {
  minCommissionRate: "",
  minSales30d: "",
  minValueScore: "",
  minPrice: "",
  maxPrice: "",
};

interface HotProductsProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function HotProducts({ isDark }: HotProductsProps) {
  const prefersReducedMotion = useReducedMotion();

  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<Category>("Todas");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Marketplace[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("valueScore");

  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(
    INITIAL_ADVANCED_FILTERS
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const copyTimeout = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getHotProducts();
      setRawProducts(data);
      setLastUpdated(new Date());
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar os produtos."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const enrichedCatalog = useMemo<ProductWithMetrics[]>(
    () => enrichProductsWithMetrics(rawProducts),
    [rawProducts]
  );

  const availableMarketplaces = useMemo<Marketplace[]>(() => {
    const unique = new Set<Marketplace>();
    for (const p of enrichedCatalog) {
      unique.add(p.marketplaceName);
    }
    return Array.from(unique);
  }, [enrichedCatalog]);

  const baseFilteredWithoutMarketplace = useMemo(() => {
    const minComm =
      advancedFilters.minCommissionRate !== ""
        ? Number(advancedFilters.minCommissionRate)
        : null;
    const minSales =
      advancedFilters.minSales30d !== ""
        ? Number(advancedFilters.minSales30d)
        : null;
    const minScore =
      advancedFilters.minValueScore !== ""
        ? Number(advancedFilters.minValueScore)
        : null;
    const minPrice =
      advancedFilters.minPrice !== "" ? Number(advancedFilters.minPrice) : null;
    const maxPrice =
      advancedFilters.maxPrice !== "" ? Number(advancedFilters.maxPrice) : null;

    return enrichedCatalog.filter((p) => {
      const matchesSearch =
        debouncedSearch === "" ||
        p.name.toLowerCase().includes(debouncedSearch) ||
        p.marketplaceName.toLowerCase().includes(debouncedSearch);

      const matchesCategory =
        activeCategory === "Todas" || p.category === activeCategory;

      if (!matchesSearch || !matchesCategory) return false;

      if (minComm !== null && Number.isFinite(minComm) && p.commissionRate < minComm) {
        return false;
      }

      if (minSales !== null && Number.isFinite(minSales)) {
        if (p.salesCount30d === null || p.salesCount30d < minSales) return false;
      }

      if (minScore !== null && Number.isFinite(minScore)) {
        if (p.valueScore === null || p.valueScore < minScore) return false;
      }

      if (
        minPrice !== null &&
        Number.isFinite(minPrice) &&
        p.currentPrice < minPrice
      ) {
        return false;
      }

      if (
        maxPrice !== null &&
        Number.isFinite(maxPrice) &&
        p.currentPrice > maxPrice
      ) {
        return false;
      }

      return true;
    });
  }, [enrichedCatalog, debouncedSearch, activeCategory, advancedFilters]);

  const countsByMarketplace = useMemo(() => {
    const map = new Map<Marketplace, number>();
    for (const p of baseFilteredWithoutMarketplace) {
      map.set(p.marketplaceName, (map.get(p.marketplaceName) ?? 0) + 1);
    }
    return map;
  }, [baseFilteredWithoutMarketplace]);

  const filteredAndSorted = useMemo(() => {
    const byMarketplace =
      selectedMarketplaces.length === 0
        ? baseFilteredWithoutMarketplace
        : baseFilteredWithoutMarketplace.filter((p) =>
            selectedMarketplaces.includes(p.marketplaceName)
          );

    const copy = [...byMarketplace];

    switch (sortKey) {
      case "valueScore":
        copy.sort((a, b) => {
          if (a.valueScore === null && b.valueScore === null) return 0;
          if (a.valueScore === null) return 1;
          if (b.valueScore === null) return -1;
          return b.valueScore - a.valueScore;
        });
        break;
      case "commissionRate":
        copy.sort((a, b) => b.commissionRate - a.commissionRate);
        break;
      case "commissionPerSale":
        copy.sort((a, b) => b.commissionPerSale - a.commissionPerSale);
        break;
      case "salesCount30d":
        copy.sort((a, b) => {
          if (a.salesCount30d === null && b.salesCount30d === null) return 0;
          if (a.salesCount30d === null) return 1;
          if (b.salesCount30d === null) return -1;
          return b.salesCount30d - a.salesCount30d;
        });
        break;
      case "estimatedEarnings30d":
        copy.sort((a, b) => {
          if (a.estimatedEarnings30d === null && b.estimatedEarnings30d === null)
            return 0;
          if (a.estimatedEarnings30d === null) return 1;
          if (b.estimatedEarnings30d === null) return -1;
          return b.estimatedEarnings30d - a.estimatedEarnings30d;
        });
        break;
      case "discountPercent":
        copy.sort((a, b) => b.discountPercent - a.discountPercent);
        break;
      case "priceAsc":
        copy.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case "priceDesc":
        copy.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case "recent":
        copy.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
    }

    return copy;
  }, [baseFilteredWithoutMarketplace, selectedMarketplaces, sortKey]);

  const activeAdvancedFiltersCount = useMemo(() => {
    return Object.values(advancedFilters).filter((v) => v.trim() !== "").length;
  }, [advancedFilters]);

  const previewProduct = useMemo(
    () =>
      previewProductId
        ? enrichedCatalog.find((p) => p.id === previewProductId) ?? null
        : null,
    [enrichedCatalog, previewProductId]
  );

  const handleToggleMarketplace = (mp: Marketplace) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(mp) ? prev.filter((item) => item !== mp) : [...prev, mp]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const updated = await refreshHotProducts();
      setRawProducts(updated);
      setLastUpdated(new Date());
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao recalcular os produtos em alta."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyLink = async (product: ProductWithMetrics) => {
    try {
      await navigator.clipboard.writeText(product.affiliateUrl);
      setCopiedId(product.id);
      if (copyTimeout.current) window.clearTimeout(copyTimeout.current);
      copyTimeout.current = window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeout.current) window.clearTimeout(copyTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!previewProductId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewProductId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewProductId]);

  const handleResetAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setActiveCategory("Todas");
    setSelectedMarketplaces([]);
    setAdvancedFilters(INITIAL_ADVANCED_FILTERS);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }}
      className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
        className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              Produtos em Alta
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>
              Compare comissão por venda, volume mensal e índice de rentabilidade entre marketplaces.
            </span>
            <IndexInfoButton />
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.35,
          delay: prefersReducedMotion ? 0 : 0.08,
        }}
        className="flex flex-col lg:flex-row lg:items-center gap-2.5 mb-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              aria-label="Buscar por produto ou marketplace"
              placeholder="Buscar por produto ou marketplace..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full pl-9 pr-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              aria-label="Filtrar por categoria"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value as Category)}
              className="h-9 w-full sm:w-auto appearance-none pl-3 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Todas" ? "Todas as categorias" : cat}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>

          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select
              aria-label="Ordenar oportunidades"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 w-full sm:w-auto appearance-none pl-8 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>

          <button
            type="button"
            aria-expanded={isFiltersOpen}
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={`h-9 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium rounded-md border transition-colors shadow-2xs whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              isFiltersOpen || activeAdvancedFiltersCount > 0
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {activeAdvancedFiltersCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                {activeAdvancedFiltersCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span
            aria-live="polite"
            className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
          >
            {filteredAndSorted.length}{" "}
            {filteredAndSorted.length === 1 ? "oportunidade" : "oportunidades"}
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors shadow-2xs whitespace-nowrap disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            title={`Atualizado ${formatRelative(lastUpdated.toISOString())}`}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Recalcular</span>
          </button>
        </div>
      </motion.div>

      {isFiltersOpen && (
        <FiltersPanel
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onClear={() => setAdvancedFilters(INITIAL_ADVANCED_FILTERS)}
          onClose={() => setIsFiltersOpen(false)}
        />
      )}

      {!isLoading && !errorMessage && availableMarketplaces.length > 0 && (
        <MarketplaceChips
          marketplaces={availableMarketplaces}
          countsByMarketplace={countsByMarketplace}
          totalCount={baseFilteredWithoutMarketplace.length}
          selectedMarketplaces={selectedMarketplaces}
          onToggleMarketplace={handleToggleMarketplace}
          onSelectAll={() => setSelectedMarketplaces([])}
        />
      )}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 dark:border-red-900/60 bg-white dark:bg-gray-900 p-8 text-center shadow-xs space-y-3"
        >
          <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Erro ao carregar oportunidades
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => void loadProducts()}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Tentar novamente</span>
          </button>
        </div>
      ) : isLoading ? (
        <div
          aria-busy="true"
          aria-label="Carregando produtos em alta"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center shadow-xs space-y-2.5">
          <Search className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Nenhum produto encontrado
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ajuste a busca, os marketplaces selecionados ou os filtros de rentabilidade.
          </p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="h-9 inline-flex items-center justify-center px-3.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <>
          <TopPicks
            products={filteredAndSorted}
            copiedId={copiedId}
            onCopy={handleCopyLink}
            onPreview={(p) => setPreviewProductId(p.id)}
          />

          <ProfitMatrix
            products={filteredAndSorted}
            onSelectProduct={(p) => setPreviewProductId(p.id)}
          />

          <motion.div
            variants={prefersReducedMotion ? undefined : containerVars}
            initial={prefersReducedMotion ? false : "hidden"}
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredAndSorted.map((p) => (
              <motion.div
                key={p.id}
                variants={prefersReducedMotion ? undefined : itemVars}
              >
                <ProductCard
                  product={p}
                  isCopied={copiedId === p.id}
                  onCopy={() => handleCopyLink(p)}
                  onPreview={() => setPreviewProductId(p.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProductId(null)}
          isCopied={copiedId === previewProduct.id}
          onCopy={() => handleCopyLink(previewProduct)}
        />
      )}
    </motion.div>
  );
}

export default HotProducts;