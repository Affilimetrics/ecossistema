import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Bell,
  Moon,
  Sun,
  User,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  emptyProductFilters,
  ORIGIN_LABELS,
  type NewProductInput,
  type Product,
  type ProductFilters,
  type ProductOrigin,
  type ProductSortKey,
} from "./productTypes";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  syncProducts,
} from "./productApi";
import { MOCK_PRODUCTS } from "./mockProducts";

/* ============================================================
   HELPERS
   ============================================================ */

const formatBRL = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ============================================================
   TELA
   ============================================================ */

interface ProductsPageProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

const PAGE_SIZE = 25;

export default function ProductsPage({ isDark, setIsDark }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [filters, setFilters] = useState<ProductFilters>(emptyProductFilters);
  const [sort, setSort] = useState<ProductSortKey>("date_desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const debouncedSearch = useDebounced(filters.search, 300);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetchProducts(
      { ...filters, search: debouncedSearch },
      sort,
      page,
      PAGE_SIZE
    );
    if (res) setProducts(res.results);
    else setProducts(MOCK_PRODUCTS);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.marketplaceId, filters.category, filters.origin, sort, page]);

  useEffect(() => { reload(); }, [reload]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  /* --------- Derivados --------- */
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let list = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filters.marketplaceId !== "all" && p.marketplaceId !== filters.marketplaceId) return false;
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.origin !== "all" && p.origin !== filters.origin) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "date_asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "date_desc": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "price_asc": return (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
        case "price_desc": return (b.currentPrice ?? 0) - (a.currentPrice ?? 0);
        case "updated_desc": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return list;
  }, [products, debouncedSearch, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageProducts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  /* --------- Contadores (linha compacta) --------- */
  const counts = useMemo(() => ({
    total: products.length,
    auto: products.filter((p) => p.origin === "auto").length,
    manual: products.filter((p) => p.origin === "manual").length,
  }), [products]);

  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])),
    [products]
  );
  const uniqueMarketplaces = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.marketplaceId && p.marketplaceName) map.set(p.marketplaceId, p.marketplaceName);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [products]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.marketplaceId !== "all" ||
    filters.category !== "all" ||
    filters.origin !== "all";

  /* --------- Handlers --------- */
  const handleSync = async () => {
    setSyncing(true);
    const res = await syncProducts();
    setSyncing(false);
    if (res) {
      showToast(`${res.synced} produto(s) atualizado(s).`);
      reload();
    } else {
      showToast("Sincronização indisponível — backend de integração não conectado.");
    }
  };

  const handleCreate = async (input: NewProductInput) => {
    const created = await createProduct(input);
    if (created) {
      setProducts((prev) => [created, ...prev]);
      showToast("Produto cadastrado.");
      return { ok: true as const };
    }
    const local: Product = {
      id: `local-${Date.now()}`,
      name: input.name,
      marketplaceId: input.marketplaceId,
      marketplaceName: input.marketplaceId,
      category: input.category || null,
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      productUrl: input.productUrl || null,
      affiliateUrl: input.affiliateUrl || null,
      currentPrice: input.currentPrice,
      previousPrice: input.previousPrice,
      currency: "BRL",
      origin: "manual",
      availability: "unknown",
      externalId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [local, ...prev]);
    showToast("Produto cadastrado localmente (demonstração).");
    return { ok: true as const };
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    const ok = await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast(ok ? "Produto excluído." : "Produto removido localmente.");
  };

  /* --------- Render --------- */
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Produtos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Catálogo de produtos coletados e cadastrados manualmente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar produto
            </button>
            <TopActions isDark={isDark} setIsDark={setIsDark} />
          </div>
        </div>

        {/* LINHA DE CONTADORES — discreta, não são cards */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <span>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{counts.total}</strong> produtos
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{counts.auto}</strong> automáticos
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{counts.manual}</strong> manuais
          </span>
        </div>

        {/* FILTROS — barra única compacta */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              placeholder="Buscar produto"
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
            />
          </div>

          <FilterSelect
            value={filters.marketplaceId}
            onChange={(v) => { setFilters({ ...filters, marketplaceId: v }); setPage(1); }}
            options={[
              { value: "all", label: "Marketplace" },
              ...uniqueMarketplaces.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />

          <FilterSelect
            value={filters.category}
            onChange={(v) => { setFilters({ ...filters, category: v }); setPage(1); }}
            options={[
              { value: "all", label: "Categoria" },
              ...uniqueCategories.map((c) => ({ value: c, label: c })),
            ]}
          />

          <FilterSelect
            value={filters.origin}
            onChange={(v) => { setFilters({ ...filters, origin: v as ProductOrigin | "all" }); setPage(1); }}
            options={[
              { value: "all", label: "Origem" },
              { value: "auto", label: "Automático" },
              { value: "manual", label: "Manual" },
              { value: "imported", label: "Importado" },
            ]}
          />

          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as ProductSortKey)}
            options={[
              { value: "date_desc", label: "Mais recentes" },
              { value: "date_asc", label: "Mais antigos" },
              { value: "name_asc", label: "Nome (A–Z)" },
              { value: "name_desc", label: "Nome (Z–A)" },
              { value: "price_asc", label: "Menor preço" },
              { value: "price_desc", label: "Maior preço" },
              { value: "updated_desc", label: "Atualizados recentemente" },
            ]}
          />

          {hasActiveFilters && (
            <button
              onClick={() => { setFilters(emptyProductFilters); setPage(1); }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>

        {/* TABELA */}
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClear={() => { setFilters(emptyProductFilters); setPage(1); }}
            onCreate={() => setShowForm(true)}
          />
        ) : (
          <ProductTable
            products={pageProducts}
            onEdit={(p) => setEditing(p)}
            onDelete={(p) => setConfirmDelete(p)}
          />
        )}

        {/* PAGINAÇÃO */}
        {filtered.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 tabular-nums">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Próxima"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais e toast */}
      <AnimatePresence>
        {(showForm || editing) && (
          <ProductFormModal
            initial={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSubmit={async (input) => {
              if (editing) {
                setProducts((prev) =>
                  prev.map((p) => p.id === editing.id ? { ...p, ...input, updatedAt: new Date().toISOString() } : p)
                );
                showToast("Produto atualizado.");
                return { ok: true as const };
              }
              return handleCreate(input);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            title="Excluir produto?"
            description={`"${confirmDelete.name}" será removido.`}
            confirmLabel="Excluir"
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES
   ============================================================ */

function TopActions({ isDark, setIsDark }: { isDark: boolean; setIsDark: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <div className="flex items-center gap-1">
      <button
        className="relative p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-red-500 rounded-full" />
      </button>
      <button
        onClick={() => setIsDark(!isDark)}
        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Alternar tema"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button
        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Perfil"
      >
        <User className="h-4 w-4" />
      </button>
    </div>
  );
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/40 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SortHeader({
  label, active, direction, onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        active ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      {label}
      {active ? (
        direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

function ProductTable({
  products, onEdit, onDelete,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
              <th className="text-left pl-3 pr-2 py-2.5"><SortHeader label="Produto" active={false} direction="asc" onClick={() => {}} /></th>
              <th className="text-left px-2 py-2.5 hidden md:table-cell"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marketplace</span></th>
              <th className="text-left px-2 py-2.5 hidden lg:table-cell"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categoria</span></th>
              <th className="text-right px-2 py-2.5"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Preço</span></th>
              <th className="text-left px-2 py-2.5 hidden sm:table-cell"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Origem</span></th>
              <th className="text-left px-2 py-2.5 hidden xl:table-cell"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Atualização</span></th>
              <th className="text-right pl-2 pr-3 py-2.5 w-[100px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {products.map((p) => (
              <ProductRow key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({
  product, onEdit, onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAffiliate = () => {
    if (!product.affiliateUrl) return;
    navigator.clipboard.writeText(product.affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <td className="pl-3 pr-2 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {product.imageUrl && !imgError ? (
              <img
                src={product.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
              {product.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-2 py-2.5 hidden md:table-cell text-xs text-slate-600 dark:text-slate-400">
        {product.marketplaceName ?? "—"}
      </td>
      <td className="px-2 py-2.5 hidden lg:table-cell text-xs text-slate-600 dark:text-slate-400">
        {product.category ?? "—"}
      </td>
      <td className="px-2 py-2.5 text-right text-sm text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
        {formatBRL(product.currentPrice)}
      </td>
      <td className="px-2 py-2.5 hidden sm:table-cell text-xs">
        <OriginTag origin={product.origin} />
      </td>
      <td className="px-2 py-2.5 hidden xl:table-cell text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        {formatDate(product.updatedAt)}
      </td>
      <td className="pl-2 pr-3 py-2.5 text-right">
        <div className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {product.affiliateUrl && (
            <button
              onClick={copyAffiliate}
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Copiar link de afiliado"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
          {product.productUrl && (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir produto"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {product.origin === "manual" && (
            <button
              onClick={() => onDelete(product)}
              className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function OriginTag({ origin }: { origin: ProductOrigin }) {
  const map: Record<ProductOrigin, string> = {
    auto: "Auto",
    manual: "Manual",
    imported: "Importado",
  };
  return (
    <span className="text-[11px] text-slate-500 dark:text-slate-400">
      {map[origin]}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-pulse">
          <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters, onClear, onCreate,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 text-center">
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {hasFilters ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {hasFilters
          ? "Ajuste os filtros ou tente outra busca."
          : "Cadastre um produto ou conecte uma plataforma para descobrir produtos automaticamente."}
      </p>
      <div className="flex justify-center gap-2 mt-4">
        {hasFilters ? (
          <button
            onClick={onClear}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline underline-offset-2"
          >
            Limpar filtros
          </button>
        ) : (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Cadastrar produto
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MODAL: CADASTRO / EDIÇÃO
   ============================================================ */

function ProductFormModal({
  initial, onClose, onSubmit,
}: {
  initial: Product | null;
  onClose: () => void;
  onSubmit: (input: NewProductInput) => Promise<{ ok: true; warning?: string }>;
}) {
  const [form, setForm] = useState<NewProductInput>({
    name: initial?.name ?? "",
    marketplaceId: initial?.marketplaceId ?? null,
    category: initial?.category ?? "",
    description: initial?.description ?? "",
    productUrl: initial?.productUrl ?? "",
    affiliateUrl: initial?.affiliateUrl ?? "",
    currentPrice: initial?.currentPrice ?? null,
    previousPrice: initial?.previousPrice ?? null,
    imageUrl: initial?.imageUrl ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Mínimo de 2 caracteres.";
    if (form.productUrl && !/^https?:\/\/.+/.test(form.productUrl)) e.productUrl = "URL inválida.";
    if (form.affiliateUrl && !/^https?:\/\/.+/.test(form.affiliateUrl)) e.affiliateUrl = "URL inválida.";
    if (form.currentPrice != null && form.currentPrice < 0) e.currentPrice = "Valor negativo.";
    if (form.previousPrice != null && form.previousPrice < 0) e.previousPrice = "Valor negativo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {initial ? "Editar produto" : "Cadastrar produto"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <Field label="Nome *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-base"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-base"
              />
            </Field>
            <Field label="Marketplace">
              <input
                type="text"
                value={form.marketplaceId ?? ""}
                onChange={(e) => setForm({ ...form, marketplaceId: e.target.value || null })}
                placeholder="ex.: amazon"
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="input-base resize-none"
            />
          </Field>

          <Field label="URL do produto" error={errors.productUrl}>
            <input
              type="url"
              value={form.productUrl}
              onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
              placeholder="https://"
              className="input-base"
            />
          </Field>

          <Field label="Link de afiliado" error={errors.affiliateUrl}>
            <input
              type="url"
              value={form.affiliateUrl}
              onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
              placeholder="https://"
              className="input-base"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço atual (R$)" error={errors.currentPrice}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.currentPrice ?? ""}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value === "" ? null : Number(e.target.value) })}
                className="input-base"
              />
            </Field>
            <Field label="Preço anterior (R$)" error={errors.previousPrice}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.previousPrice ?? ""}
                onChange={(e) => setForm({ ...form, previousPrice: e.target.value === "" ? null : Number(e.target.value) })}
                className="input-base"
              />
            </Field>
          </div>

          <Field label="URL da imagem">
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://"
              className="input-base"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {initial ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

/* ============================================================
   CONFIRMAÇÃO
   ============================================================ */

function ConfirmDialog({
  title, description, confirmLabel, onCancel, onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xl"
      >
        <div className="flex items-start gap-2.5 mb-3">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}