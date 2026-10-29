import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
  Filter,
  AlertCircle,
  Package,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Link2,
} from "lucide-react";
import {
  productsApi,
  Product,
  ProductStats,
  ProductFilters,
  CreateProductInput,
} from "../../services/productApi";
import { ProductFormModal } from "../../components/layout/products/ProductFormModal";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

interface ProductsPageProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

const PLATFORM_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  shopee: { label: "Shopee", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-400" },
  mercadolivre: { label: "Mercado Livre", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-400" },
  amazon: { label: "Amazon", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400" },
  magalu: { label: "Magalu", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400" },
  outros: { label: "Outros", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300" },
};

export const ProductsPage: React.FC<ProductsPageProps> = ({ isDark, setIsDark }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilters>({
    search: "",
    platform: "all",
    category: "all",
    status: "all",
    page: 1,
    page_size: 10,
  });

  const [totalCount, setTotalCount] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, statsData] = await Promise.all([
        productsApi.getProducts(filters),
        productsApi.getStats(),
      ]);

      setProducts(data.results);
      setTotalCount(data.count);
      setStats(statsData);
    } catch (err: any) {
      setError("Falha ao carregar o catálogo de produtos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await productsApi.syncProducts();
      await loadProducts();
    } catch {
      alert("Não foi possível sincronizar com as plataformas externas no momento.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyLink = (id: string, link?: string) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (product: Product) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover "${product.name}" do seu catálogo local?`
      )
    ) {
      try {
        await productsApi.deleteProduct(product.id);
        await loadProducts();
      } catch (err) {
        alert("Erro ao remover o produto.");
      }
    }
  };

  const handleFormSubmit = async (data: CreateProductInput) => {
    if (editingProduct) {
      await productsApi.updateProduct(editingProduct.id, data);
    } else {
      await productsApi.createProduct(data);
    }
    await loadProducts();
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      platform: "all",
      category: "all",
      status: "all",
      page: 1,
      page_size: 10,
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.platform !== "all" ||
    filters.category !== "all" ||
    filters.status !== "all";

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* Cabeçalho Padronizado do Dashboard */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Produtos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os produtos que você divulga nas suas plataformas de afiliados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </div>

      {/* Ações Específicas de Produtos */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadProducts()}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none"
            title="Atualizar listagem"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sincronizando..." : "Sincronizar"}</span>
          </button>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar produto</span>
        </button>
      </div>

      {/* Indicadores Resumidos */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Package className="h-4 w-4 text-blue-500" />
              <span>Total de Produtos</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.total_products}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>Plataformas Integradas</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.total_platforms}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Check className="h-4 w-4 text-green-500" />
              <span>Produtos Ativos</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.active_products}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
              <Link2 className="h-4 w-4 text-amber-500" />
              <span>Sem Link de Afiliado</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.missing_affiliate_links}
            </p>
          </div>
        </div>
      )}

      {/* Área de Busca e Filtros */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome do produto..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value, page: 1 })
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-[140px]">
              <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <select
                value={filters.platform}
                onChange={(e) =>
                  setFilters({ ...filters, platform: e.target.value, page: 1 })
                }
                className="w-full py-2 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="all">Todas as Plataformas</option>
                <option value="shopee">Shopee</option>
                <option value="mercadolivre">Mercado Livre</option>
                <option value="amazon">Amazon</option>
                <option value="magalu">Magalu</option>
              </select>
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
              className="py-2 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="all">Todas as Situações</option>
              <option value="active">Ativos</option>
              <option value="pending_link">Pendente de Link</option>
              <option value="inactive">Inativos</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500" />
            <p className="text-xs">Carregando produtos...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 dark:text-red-400 space-y-3">
            <AlertCircle className="h-6 w-6 mx-auto" />
            <p className="text-xs font-medium">{error}</p>
            <button
              onClick={() => loadProducts()}
              className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
            <Package className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {hasActiveFilters
                ? "Nenhum produto encontrado"
                : "Seu catálogo está vazio"}
            </p>
            <p className="text-xs max-w-sm mx-auto">
              {hasActiveFilters
                ? "Tente ajustar os filtros de busca ou remover as restrições aplicadas."
                : "Conecte uma plataforma nas Configurações ou cadastre seus produtos manualmente."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Cadastrar primeiro produto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Plataforma</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Preço</th>
                  <th className="px-4 py-3">Comissão</th>
                  <th className="px-4 py-3">Link de Afiliado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                {products.map((product) => {
                  const badge = PLATFORM_BADGES[product.platform] || PLATFORM_BADGES.outros;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-9 w-9 rounded-md object-cover border border-gray-200 dark:border-gray-800 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p
                              className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs"
                              title={product.name}
                            >
                              {product.name}
                            </p>
                            {product.sku_or_external_id && (
                              <p className="text-[10px] text-gray-400">
                                ID: {product.sku_or_external_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {product.category || "Não informado"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                        {product.price !== undefined
                          ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "Não informado"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-medium">
                        {product.commission_percentage !== undefined
                          ? `${product.commission_percentage}%`
                          : "Não informado"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {product.affiliate_link ? (
                          <button
                            onClick={() => handleCopyLink(product.id, product.affiliate_link)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                          >
                            {copiedId === product.id ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copiar Link</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {product.original_url && (
                            <a
                              href={product.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Ver na loja original"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Remover do catálogo local"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalCount > filters.page_size! && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Exibindo {products.length} de {totalCount} produtos
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                className="p-1 rounded-md border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">Página {filters.page}</span>
              <button
                disabled={filters.page! * filters.page_size! >= totalCount}
                onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                className="p-1 rounded-md border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
      />
    </div>
  );
};

export default ProductsPage;