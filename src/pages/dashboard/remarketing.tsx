import { useMemo, useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  MessageSquare,
  TrendingUp,
  MousePointerClick,
  ShoppingCart,
  Percent,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  MOCK_REMARKETING,
  type RemarketingRecord,
  type RemarketingStatus,
  type RemarketingFilters,
  emptyFilters,
  filterRecords,
  computeKpis,
  getUniqueProducts,
  getUniqueLinks,
  STATUS_LABELS,
  STATUS_STYLES,
  CONVERSION_LABELS,
  CONVERSION_STYLES,
  formatDateTime,
  formatBRL,
} from "../../mocks/mockRemarketing";
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
    transition: { staggerChildren: 0.08, ease: "easeOut" },
  },
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/* ============================================================
   PÁGINA: REMARKETING (PADRONIZADA COM PRODUTOS)
   ============================================================ */

const PAGE_SIZE = 8;

interface RemarketingPageProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function RemarketingPage({ isDark }: RemarketingPageProps) {
  const [records, setRecords] = useState<RemarketingRecord[]>(MOCK_REMARKETING);
  const [filters, setFilters] = useState<RemarketingFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RemarketingRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setAdvancedFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const products = useMemo(() => getUniqueProducts(records), [records]);
  const links = useMemo(() => getUniqueLinks(records), [records]);
  const filtered = useMemo(() => filterRecords(records, filters), [records, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const activeAdvancedCount =
    (filters.product !== "all" ? 1 : 0) +
    (filters.link !== "all" ? 1 : 0) +
    (filters.from !== "" ? 1 : 0) +
    (filters.to !== "" ? 1 : 0);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    activeAdvancedCount > 0;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
      showToast("Listagem atualizada.");
    }, 700);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  const updateStatus = (id: string, status: RemarketingStatus) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              events: [
                ...r.events,
                {
                  at: new Date().toISOString(),
                  type: "status_change",
                  description: `Status alterado para ${STATUS_LABELS[status]}`,
                },
              ],
            }
          : r
      )
    );
    setSelected((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status,
            events: [
              ...prev.events,
              {
                at: new Date().toISOString(),
                type: "status_change",
                description: `Status alterado para ${STATUS_LABELS[status]}`,
              },
            ],
          }
        : prev
    );
    showToast(`Status alterado para "${STATUS_LABELS[status]}".`);
  };

  const saveNote = (id: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              note,
              events: [
                ...r.events,
                {
                  at: new Date().toISOString(),
                  type: "note",
                  description: "Observação atualizada",
                },
              ],
            }
          : r
      )
    );
    setSelected((prev) => (prev && prev.id === id ? { ...prev, note } : prev));
    showToast("Observação salva.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto"
    >
      {/* CABEÇALHO PADRONIZADO */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Remarketing
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe oportunidades de conversão após cliques em links de afiliado sem compra registrada.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5 [&_button]:rounded-none">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {/* KPIs PADRONIZADOS */}
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <KpiCard
          icon={MousePointerClick}
          iconColor="text-blue-500"
          label="Cliques no período"
          value={kpis.totalClicks.toString()}
          hint="Total de cliques registrados nos links"
        />
        <KpiCard
          icon={ShoppingCart}
          iconColor="text-amber-500"
          label="Cliques sem compra"
          value={kpis.clicksWithoutConversion.toString()}
          hint="Cliques sem conversão confirmada"
        />
        <KpiCard
          icon={CheckCircle2}
          iconColor="text-emerald-500"
          label="Conversões recuperadas"
          value={kpis.recoveredConversions.toString()}
          hint={
            kpis.recoveredRevenue > 0
              ? `Receita: ${formatBRL(kpis.recoveredRevenue)}`
              : "Oportunidades com conversão confirmada"
          }
        />
        <KpiCard
          icon={Percent}
          iconColor="text-purple-500"
          label="Taxa de recuperação"
          value={kpis.recoveryRate == null ? "—" : `${kpis.recoveryRate.toFixed(1)}%`}
          hint={
            kpis.recoveryRate == null
              ? "Sem dados suficientes para calcular"
              : "Conversões sobre cliques no período"
          }
        />
      </motion.div>

      {/* BARRA DE PESQUISA, FILTROS E AÇÕES (PADRONIZADA COM PRODUTOS) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-6"
      >
        {/* Grupo Esquerdo: Busca + Status + Filtros Avançados */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              placeholder="Buscar por produto, link ou ID..."
              className="h-9 w-full pl-9 pr-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="relative shrink-0">
            <select
              aria-label="Filtrar por status"
              value={filters.status}
              onChange={(e) => {
                setFilters({
                  ...filters,
                  status: e.target.value as RemarketingStatus | "all",
                });
                setPage(1);
              }}
              className="h-9 appearance-none pl-3 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">Todos os status</option>
              <option value="pending">{STATUS_LABELS.pending}</option>
              <option value="following">{STATUS_LABELS.following}</option>
              <option value="converted">{STATUS_LABELS.converted}</option>
              <option value="closed">{STATUS_LABELS.closed}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>

          <div className="relative shrink-0" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
              className={`h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-none border shadow-2xs transition-colors focus:outline-none ${
                advancedFiltersOpen || activeAdvancedCount > 0
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeAdvancedCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold bg-blue-600 text-white">
                  {activeAdvancedCount}
                </span>
              )}
            </button>

            {advancedFiltersOpen && (
              <div className="absolute left-0 mt-1.5 w-72 p-4 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-30 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Produto
                  </label>
                  <select
                    value={filters.product}
                    onChange={(e) => {
                      setFilters({ ...filters, product: e.target.value });
                      setPage(1);
                    }}
                    className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-none text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todos os produtos</option>
                    {products.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Link de afiliado
                  </label>
                  <select
                    value={filters.link}
                    onChange={(e) => {
                      setFilters({ ...filters, link: e.target.value });
                      setPage(1);
                    }}
                    className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-none text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todos os links</option>
                    {links.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Data inicial
                    </label>
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) => {
                        setFilters({ ...filters, from: e.target.value });
                        setPage(1);
                      }}
                      className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-none text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Data final
                    </label>
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) => {
                        setFilters({ ...filters, to: e.target.value });
                        setPage(1);
                      }}
                      className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-none text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setAdvancedFiltersOpen(false);
                    }}
                    className="w-full py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-none transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              title="Limpar filtros"
              className="h-9 inline-flex items-center gap-1 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-none transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Limpar</span>
            </button>
          )}
        </div>

        {/* Grupo Direito: Atualizar */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-none shadow-2xs hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </motion.div>

      {/* TABELA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden"
      >
        {filtered.length === 0 ? (
          <EmptyState hasRecords={records.length > 0} onClear={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800">
                  <tr className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Link</th>
                    <th className="px-4 py-3">Clique</th>
                    <th className="px-4 py-3">Conversão</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {pageRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {r.id}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {r.visitorId}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 dark:text-gray-100 font-medium">
                          {r.productName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {r.productSku}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 dark:text-gray-300">
                          {r.affiliateLinkLabel}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {r.affiliateLinkId}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatDateTime(r.clickedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={CONVERSION_LABELS[r.conversionStatus]}
                          className={CONVERSION_STYLES[r.conversionStatus]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={STATUS_LABELS[r.status]}
                          className={STATUS_STYLES[r.status]}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-none transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Detalhes</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <span>
                Mostrando{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {filtered.length}
                </span>{" "}
                registros
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-none border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-none border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {selected && (
          <DetailPanel
            record={selected}
            onClose={() => setSelected(null)}
            onChangeStatus={(s) => updateStatus(selected.id, s)}
            onSaveNote={(n) => saveNote(selected.id, n)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-none border border-gray-700 dark:border-gray-300 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function KpiCard({
  icon: Icon,
  iconColor,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <motion.div
      variants={itemVars}
      className="p-4 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between"
    >
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
        <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {hint && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">
            {hint}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-none border text-[11px] font-medium whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}

function EmptyState({
  hasRecords,
  onClear,
}: {
  hasRecords: boolean;
  onClear: () => void;
}) {
  return (
    <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
      <Search className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600" />
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {hasRecords ? "Nenhum resultado encontrado" : "Sem registros"}
      </p>
      <p className="text-xs max-w-sm mx-auto">
        {hasRecords
          ? "Tente ajustar os filtros para encontrar o que procura."
          : "Nenhum clique registrado até o momento."}
      </p>
      {hasRecords && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function DetailPanel({
  record,
  onClose,
  onChangeStatus,
  onSaveNote,
}: {
  record: RemarketingRecord;
  onClose: () => void;
  onChangeStatus: (s: RemarketingStatus) => void;
  onSaveNote: (n: string) => void;
}) {
  const [note, setNote] = useState(record.note ?? "");
  const [confirmClose, setConfirmClose] = useState(false);

  const handleSaveNote = () => onSaveNote(note.trim());

  const handleChangeStatus = (s: RemarketingStatus) => {
    if (s === "closed" && record.status !== "closed") {
      setConfirmClose(true);
      return;
    }
    onChangeStatus(s);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {record.id}
            </p>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
              {record.productName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Informações
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem label="SKU" value={record.productSku} />
              <InfoItem label="Visitante" value={record.visitorId} />
              <InfoItem label="Link" value={record.affiliateLinkLabel} />
              <InfoItem label="ID do link" value={record.affiliateLinkId} />
              <InfoItem label="Clique em" value={formatDateTime(record.clickedAt)} />
              {record.convertedAt && (
                <InfoItem label="Convertido em" value={formatDateTime(record.convertedAt)} />
              )}
            </dl>
          </section>

          <section>
            <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Conversão
            </h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={CONVERSION_LABELS[record.conversionStatus]}
                className={CONVERSION_STYLES[record.conversionStatus]}
              />
              {record.conversionId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-none border border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-400">
                  {record.conversionId}
                </span>
              )}
            </div>
            {record.recoveredRevenue != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Receita recuperada:{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatBRL(record.recoveredRevenue)}
                </span>
              </p>
            )}
          </section>

          <section>
            <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Ações
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                icon={Clock}
                label="Pendente"
                active={record.status === "pending"}
                onClick={() => handleChangeStatus("pending")}
              />
              <ActionButton
                icon={TrendingUp}
                label="Em acompanhamento"
                active={record.status === "following"}
                onClick={() => handleChangeStatus("following")}
              />
              <ActionButton
                icon={CheckCircle2}
                label="Convertido"
                active={record.status === "converted"}
                onClick={() => handleChangeStatus("converted")}
                disabled={record.conversionStatus !== "converted"}
                hint={
                  record.conversionStatus !== "converted"
                    ? "Só é possível marcar como convertido quando houver conversão registrada."
                    : undefined
                }
              />
              <ActionButton
                icon={Ban}
                label="Encerrar"
                active={record.status === "closed"}
                onClick={() => handleChangeStatus("closed")}
                danger
              />
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Observação interna</span>
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Adicione uma observação sobre esta oportunidade…"
              className="w-full p-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="h-8 px-3 rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Salvar observação
              </button>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Histórico de eventos
            </h3>
            <ol className="relative border-l border-gray-200 dark:border-gray-800 pl-4 space-y-4">
              {record.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-none bg-blue-500 ring-4 ring-white dark:ring-gray-950" />
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {e.description}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDateTime(e.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 rounded-none border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p>
              Um clique não confirma uma compra. Este registro só é tratado como convertido quando há evento de conversão associado.
            </p>
          </div>
        </div>

        <AnimatePresence>
          {confirmClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setConfirmClose(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-xl"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Encerrar oportunidade?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  O registro ficará marcado como encerrado. Você poderá reabri-lo depois, se necessário.
                </p>
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setConfirmClose(false)}
                    className="h-8 px-3 rounded-none border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeStatus("closed");
                      setConfirmClose(false);
                    }}
                    className="h-8 px-3 rounded-none bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    Encerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5 break-words">
        {value}
      </dd>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
  danger,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
}) {
  const base =
    "h-9 inline-flex items-center gap-2 px-3 rounded-none border text-xs font-medium transition-colors text-left";
  const variant = active
    ? danger
      ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
      : "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-600 dark:text-blue-400"
    : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={`${base} ${variant} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default RemarketingPage;