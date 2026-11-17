import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, RefreshCw, Plus, Copy, Check, Trash2, Edit2, ExternalLink, AlertCircle, Package, X, ChevronLeft, ChevronRight, Layers, Link2, SlidersHorizontal, List, LayoutGrid, ChevronDown } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { productsApi, Product, ProductStats, ProductFilters, CreateProductInput } from "../../services/productApi";
import { ProductFormModal } from "../../components/layout/products/ProductFormModal";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

interface ProductsPageProps { isDark?: boolean; setIsDark?: (value: boolean) => void; }

const PLATFORM_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  shopee: { label: "Shopee", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400" },
  mercadolivre: { label: "Mercado Livre", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-400" },
  amazon: { label: "Amazon", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  magalu: { label: "Magalu", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
  outros: { label: "Outros", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todas as categorias" },
  { value: "Eletrônicos", label: "Eletrônicos" },
  { value: "Casa e Cozinha", label: "Casa e Cozinha" },
  { value: "Moda", label: "Moda" },
  { value: "Esportes", label: "Esportes" },
  { value: "Beleza", label: "Beleza" },
  { value: "Outros", label: "Outros" },
];

const containerVars: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, ease: "easeOut" } } };
const itemVars: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

export const ProductsPage: React.FC<ProductsPageProps> = ({ isDark }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ProductFilters>({ search: "", platform: "all", category: "all", status: "all", page: 1, page_size: 10 });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setAdvancedFiltersOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [data, statsData] = await Promise.all([productsApi.getProducts(filters), productsApi.getStats()]);
      setProducts(data.results); setTotalCount(data.count); setStats(statsData);
    } catch { setError("Falha ao carregar o catálogo de produtos. Tente novamente."); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSync = async () => {
    try { setSyncing(true); await productsApi.syncProducts(); await loadProducts(); }
    catch { alert("Não foi possível sincronizar com as plataformas externas no momento."); }
    finally { setSyncing(false); }
  };

  const handleCopyLink = (id: string, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Tem certeza que deseja remover "${product.name}" do seu catálogo local?`)) {
      try { await productsApi.deleteProduct(product.id); await loadProducts(); }
      catch { alert("Erro ao remover o produto."); }
    }
  };

  const handleFormSubmit = async (data: CreateProductInput) => {
    if (editingProduct) await productsApi.updateProduct(editingProduct.id, data);
    else await productsApi.createProduct(data);
    await loadProducts();
  };

  const handleClearFilters = () => setFilters({ search: "", platform: "all", category: "all", status: "all", page: 1, page_size: 10 });
  const activeAdvancedCount = (filters.platform !== "all" ? 1 : 0) + (filters.status !== "all" ? 1 : 0);
  const hasActiveFilters = filters.search !== "" || filters.category !== "all" || activeAdvancedCount > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-wrap items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Produtos</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Gerencie os produtos que você divulga nas suas plataformas de afiliados.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {stats && (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div variants={itemVars} className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium"><Package className="h-4 w-4 text-blue-500 shrink-0" /><span>Total de Produtos</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{stats.total_products}</p>
          </motion.div>
          <motion.div variants={itemVars} className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium"><Layers className="h-4 w-4 text-emerald-500 shrink-0" /><span>Plataformas Integradas</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{stats.total_platforms}</p>
          </motion.div>
          <motion.div variants={itemVars} className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium"><Check className="h-4 w-4 text-green-500 shrink-0" /><span>Produtos Ativos</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{stats.active_products}</p>
          </motion.div>
          <motion.div variants={itemVars} className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium"><Link2 className="h-4 w-4 text-amber-500 shrink-0" /><span>Sem Link de Afiliado</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{stats.missing_affiliate_links}</p>
          </motion.div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar produto pelo nome..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} className="h-9 w-full pl-9 pr-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" />
          </div>

          <div className="relative shrink-0">
            <select aria-label="Filtrar por categoria" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })} className="h-9 appearance-none pl-3 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer">
              {CATEGORY_OPTIONS.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>

          <div className="relative shrink-0" ref={popoverRef}>
            <button type="button" onClick={() => setAdvancedFiltersOpen((prev) => !prev)} className={`h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-md border shadow-2xs transition-colors focus:outline-none ${advancedFiltersOpen || activeAdvancedCount > 0 ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeAdvancedCount > 0 && <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold bg-blue-600 text-white rounded-md">{activeAdvancedCount}</span>}
            </button>

            {advancedFiltersOpen && (
              <div className="absolute left-0 mt-1.5 w-64 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-30 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Plataforma</label>
                  <select value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value, page: 1 })} className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500">
                    <option value="all">Todas as Plataformas</option>
                    <option value="shopee">Shopee</option>
                    <option value="mercadolivre">Mercado Livre</option>
                    <option value="amazon">Amazon</option>
                    <option value="magalu">Magalu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">Situação</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })} className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500">
                    <option value="all">Todas as Situações</option>
                    <option value="active">Ativos</option>
                    <option value="pending_link">Pendente de Link</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <button type="button" onClick={() => { handleClearFilters(); setAdvancedFiltersOpen(false); }} className="w-full py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors">Limpar filtros</button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button type="button" onClick={handleClearFilters} title="Limpar filtros" className="h-9 inline-flex items-center gap-1 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors shrink-0">
              <X className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Limpar</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <button type="button" onClick={handleSync} disabled={syncing} title="Sincronizar produtos com as plataformas" className="h-9 inline-flex items-center gap-1.5 px-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden xl:inline">{syncing ? "Sincronizando..." : "Sincronizar"}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 inline-flex items-center p-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-2xs">
              <button type="button" onClick={() => setViewMode("list")} aria-label="Visualização em lista" className={`h-7 w-7 inline-flex items-center justify-center rounded-sm transition-colors ${viewMode === "list" ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><List className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => setViewMode("grid")} aria-label="Visualização em grade" className={`h-7 w-7 inline-flex items-center justify-center rounded-sm transition-colors ${viewMode === "grid" ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
            </div>
            <button type="button" onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs whitespace-nowrap">
              <Plus className="h-3.5 w-3.5" /><span>Novo Produto</span>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" /><p className="text-xs">Carregando produtos...</p></div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 dark:text-red-400 space-y-3">
            <AlertCircle className="h-6 w-6 mx-auto" /><p className="text-xs font-medium">{error}</p>
            <button type="button" onClick={() => loadProducts()} className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">Tentar novamente</button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
            <Package className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{hasActiveFilters ? "Nenhum produto encontrado" : "Seu catálogo está vazio"}</p>
            <p className="text-xs max-w-sm mx-auto">{hasActiveFilters ? "Tente ajustar os filtros de busca ou remover as restrições aplicadas." : "Conecte uma plataforma nas Configurações ou cadastre seus produtos manualmente."}</p>
            {hasActiveFilters ? (
              <button type="button" onClick={handleClearFilters} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Limpar filtros</button>
            ) : (
              <button type="button" onClick={() => setIsModalOpen(true)} className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700">Cadastrar primeiro produto</button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "list" && (
              <div className="hidden md:block w-full overflow-hidden">
                <table className="w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="w-[34%] px-3 py-3">Produto</th><th className="w-[15%] px-2.5 py-3">Plataforma</th><th className="w-[13%] px-2.5 py-3">Preço</th><th className="w-[11%] px-2.5 py-3">Comissão</th><th className="w-[15%] px-2.5 py-3">Link</th><th className="w-[12%] px-3 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    {products.map((product) => {
                      const badge = PLATFORM_BADGES[product.platform] || PLATFORM_BADGES.outros;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {product.image_url ? <img src={product.image_url} alt={product.name} className="h-9 w-9 rounded-md object-cover border border-gray-200 dark:border-gray-800 shrink-0 bg-white" /> : <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-gray-400" /></div>}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={product.name}>{product.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{product.category || "Sem categoria"}{product.sku_or_external_id ? ` · ID: ${product.sku_or_external_id}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2.5 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium truncate max-w-full ${badge.bg} ${badge.text}`}>{badge.label}</span></td>
                          <td className="px-2.5 py-3 font-medium text-gray-900 dark:text-gray-100 truncate">{product.price !== undefined ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</td>
                          <td className="px-2.5 py-3 text-emerald-600 dark:text-emerald-400 font-medium truncate">{product.commission_percentage !== undefined ? `${product.commission_percentage}%` : "—"}</td>
                          <td className="px-2.5 py-3">
                            {product.affiliate_link ? (
                              <button type="button" onClick={() => handleCopyLink(product.id, product.affiliate_link)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors whitespace-nowrap">
                                {copiedId === product.id ? (<><Check className="h-3 w-3 text-green-600 shrink-0" /><span>Copiado!</span></>) : (<><Copy className="h-3 w-3 shrink-0" /><span>Copiar</span></>)}
                              </button>
                            ) : (
                              <span className="inline-block text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">Pendente</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {product.original_url && (<a href={product.original_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" title="Ver na loja original"><ExternalLink className="h-3.5 w-3.5" /></a>)}
                              <button type="button" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                              <button type="button" onClick={() => handleDelete(product)} className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Remover do catálogo local"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className={`${viewMode === "list" ? "block md:hidden" : "block"} p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`}>
              {products.map((product) => {
                const badge = PLATFORM_BADGES[product.platform] || PLATFORM_BADGES.outros;
                return (
                  <div key={product.id} className="group flex flex-col justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-950/40 hover:border-gray-300 dark:hover:border-gray-700 transition-colors overflow-hidden">
                    <div>
                      <div className="relative w-full h-44 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden p-3">
                        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" /> : <Package className="h-12 w-12 text-gray-300 dark:text-gray-700" />}
                        <span className={`absolute top-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium shadow-2xs ${badge.bg} ${badge.text}`}>{badge.label}</span>
                      </div>
                      <div className="p-4 pb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1" title={product.name}>{product.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.category || "Sem categoria"}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{product.price !== undefined ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Sem preço"}</span>
                        {product.commission_percentage !== undefined && <span className="font-medium text-emerald-600 dark:text-emerald-400">{product.commission_percentage}% comissão</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        {product.affiliate_link ? (
                          <button type="button" onClick={() => handleCopyLink(product.id, product.affiliate_link)} className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                            {copiedId === product.id ? (<><Check className="h-3 w-3 text-green-600" /><span>Copiado!</span></>) : (<><Copy className="h-3 w-3" /><span>Copiar Link</span></>)}
                          </button>
                        ) : (
                          <span className="flex-1 text-center text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 py-1 rounded-md">Pendente</span>
                        )}
                        <div className="flex items-center gap-1">
                          {product.original_url && (<a href={product.original_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" title="Ver na loja original"><ExternalLink className="h-3.5 w-3.5" /></a>)}
                          <button type="button" onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => handleDelete(product)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800" title="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {totalCount > filters.page_size! && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span>Exibindo {products.length} de {totalCount} produtos</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page! - 1 })} className="p-1 rounded-md border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><ChevronLeft className="h-4 w-4" /></button>
              <span className="px-2">Página {filters.page}</span>
              <button type="button" disabled={filters.page! * filters.page_size! >= totalCount} onClick={() => setFilters({ ...filters, page: filters.page! + 1 })} className="p-1 rounded-md border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </motion.div>

      <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingProduct} />
    </motion.div>
  );
};

export default ProductsPage;