import { useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
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
  Bell,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ============================================================
   PÁGINA
   ============================================================ */

const PAGE_SIZE = 8;

interface RemarketingPageProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RemarketingPage({
  isDark,
  setIsDark,
}: RemarketingPageProps) {
  const [records, setRecords] = useState<RemarketingRecord[]>(MOCK_REMARKETING);
  const [filters, setFilters] = useState<RemarketingFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<RemarketingRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const hasActiveFilters =
    filters.search !== "" ||
    filters.product !== "all" ||
    filters.link !== "all" ||
    filters.status !== "all" ||
    filters.from !== "" ||
    filters.to !== "";

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
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto">
      {/* ---------- Cabeçalho ---------- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Remarketing
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Acompanhe oportunidades de conversão após cliques em links de
            afiliado sem compra registrada.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <TopActions isDark={isDark} setIsDark={setIsDark} />
        </div>
      </div>

      {/* ---------- KPIs ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KpiCard icon={MousePointerClick} iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" label="Cliques no período" value={kpis.totalClicks.toString()} hint="Total de cliques registrados nos links" />
        <KpiCard icon={ShoppingCart} iconBg="bg-orange-50 dark:bg-orange-900/20" iconColor="text-orange-600 dark:text-orange-400" label="Cliques sem compra" value={kpis.clicksWithoutConversion.toString()} hint="Cliques sem conversão confirmada" />
        <KpiCard icon={CheckCircle2} iconBg="bg-green-50 dark:bg-green-900/20" iconColor="text-green-600 dark:text-green-400" label="Conversões recuperadas" value={kpis.recoveredConversions.toString()} hint="Oportunidades com conversão confirmada" extra={kpis.recoveredRevenue > 0 ? `Receita: ${formatBRL(kpis.recoveredRevenue)}` : undefined} />
        <KpiCard icon={Percent} iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-600 dark:text-purple-400" label="Taxa de recuperação" value={kpis.recoveryRate == null ? "—" : `${kpis.recoveryRate.toFixed(1)}%`} hint={kpis.recoveryRate == null ? "Sem dados suficientes para calcular" : "Conversões sobre cliques no período"} />
      </div>

      {/* ---------- Filtros ---------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Filtros
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="xl:col-span-2">
            <label className="sr-only">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPage(1);
                }}
                placeholder="Buscar por produto, link ou ID"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          <FilterSelect value={filters.product} onChange={(v) => { setFilters({ ...filters, product: v }); setPage(1); }} options={[{ value: "all", label: "Todos os produtos" }, ...products.map((p) => ({ value: p, label: p }))]} />
          <FilterSelect value={filters.link} onChange={(v) => { setFilters({ ...filters, link: v }); setPage(1); }} options={[{ value: "all", label: "Todos os links" }, ...links.map((l) => ({ value: l.id, label: l.label }))]} />
          <FilterSelect value={filters.status} onChange={(v) => { setFilters({ ...filters, status: v as RemarketingStatus | "all" }); setPage(1); }} options={[{ value: "all", label: "Todos os status" }, { value: "pending", label: STATUS_LABELS.pending }, { value: "following", label: STATUS_LABELS.following }, { value: "converted", label: STATUS_LABELS.converted }, { value: "closed", label: STATUS_LABELS.closed }]} />

          <div className="flex gap-2">
            <input type="date" value={filters.from} onChange={(e) => { setFilters({ ...filters, from: e.target.value }); setPage(1); }} className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40" aria-label="Data inicial" />
            <input type="date" value={filters.to} onChange={(e) => { setFilters({ ...filters, to: e.target.value }); setPage(1); }} className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40" aria-label="Data final" />
          </div>
        </div>
      </div>

      {/* ---------- Tabela ---------- */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState hasRecords={records.length > 0} onClear={clearFilters} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                  <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Link</th>
                    <th className="px-4 py-3">Clique</th>
                    <th className="px-4 py-3">Conversão</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pageRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{r.id}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.visitorId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 dark:text-slate-100 font-medium">{r.productName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.productSku}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 dark:text-slate-300">{r.affiliateLinkLabel}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.affiliateLinkId}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDateTime(r.clickedAt)}</td>
                      <td className="px-4 py-3"><StatusBadge label={CONVERSION_LABELS[r.conversionStatus]} className={CONVERSION_STYLES[r.conversionStatus]} /></td>
                      <td className="px-4 py-3"><StatusBadge label={STATUS_LABELS[r.status]} className={STATUS_STYLES[r.status]} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                de{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{filtered.length}</span>{" "}
                registros
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Página anterior">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-600 dark:text-slate-400 px-2">Página {currentPage} de {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Próxima página">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium shadow-lg"
            role="status"
            aria-live="polite"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
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

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  hint?: string;
  extra?: string;
}

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, hint, extra }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <h3 className="font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {extra && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{extra}</p>}
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{hint}</p>}
    </div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ value, onChange, options }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

interface EmptyStateProps {
  hasRecords: boolean;
  onClear: () => void;
}

function EmptyState({ hasRecords, onClear }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <Search className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {hasRecords ? "Nenhum resultado encontrado" : "Sem registros"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {hasRecords
          ? "Tente ajustar os filtros para encontrar o que procura."
          : "Nenhum clique registrado até o momento."}
      </p>
      {hasRecords && (
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

/* ============================================================
   PAINEL LATERAL DE DETALHES
   ============================================================ */

interface DetailPanelProps {
  record: RemarketingRecord;
  onClose: () => void;
  onChangeStatus: (s: RemarketingStatus) => void;
  onSaveNote: (n: string) => void;
}

function DetailPanel({ record, onClose, onChangeStatus, onSaveNote }: DetailPanelProps) {
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
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do registro ${record.id}`}
    >
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{record.id}</p>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{record.productName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Informações</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem label="SKU" value={record.productSku} />
              <InfoItem label="Visitante" value={record.visitorId} />
              <InfoItem label="Link" value={record.affiliateLinkLabel} />
              <InfoItem label="ID do link" value={record.affiliateLinkId} />
              <InfoItem label="Clique em" value={formatDateTime(record.clickedAt)} />
              {record.convertedAt && <InfoItem label="Convertido em" value={formatDateTime(record.convertedAt)} />}
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Conversão</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={CONVERSION_LABELS[record.conversionStatus]} className={CONVERSION_STYLES[record.conversionStatus]} />
              {record.conversionId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">{record.conversionId}</span>
              )}
            </div>
            {record.recoveredRevenue != null && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Receita recuperada:{" "}
                <span className="font-medium text-slate-900 dark:text-slate-100">{formatBRL(record.recoveredRevenue)}</span>
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Ações</h3>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={Clock} label="Pendente" active={record.status === "pending"} onClick={() => handleChangeStatus("pending")} />
              <ActionButton icon={TrendingUp} label="Em acompanhamento" active={record.status === "following"} onClick={() => handleChangeStatus("following")} />
              <ActionButton icon={CheckCircle2} label="Convertido" active={record.status === "converted"} onClick={() => handleChangeStatus("converted")} disabled={record.conversionStatus !== "converted"} hint={record.conversionStatus !== "converted" ? "Só é possível marcar como convertido quando houver conversão registrada." : undefined} />
              <ActionButton icon={Ban} label="Encerrar" active={record.status === "closed"} onClick={() => handleChangeStatus("closed")} danger />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Observação interna
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Adicione uma observação sobre esta oportunidade…"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={handleSaveNote} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors">Salvar observação</button>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Histórico de eventos</h3>
            <ol className="relative border-l border-slate-200 dark:border-slate-800 pl-4 space-y-4">
              {record.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />
                  <p className="text-sm text-slate-900 dark:text-slate-100">{e.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(e.at)}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
            <p>Um clique não confirma uma compra. Este registro só é tratado como convertido quando há evento de conversão associado.</p>
          </div>
        </div>

        <AnimatePresence>
          {confirmClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={() => setConfirmClose(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Encerrar oportunidade?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  O registro ficará marcado como encerrado. Você poderá reabri-lo depois, se necessário.
                </p>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setConfirmClose(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                  <button onClick={() => { onChangeStatus("closed"); setConfirmClose(false); }} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">Encerrar</button>
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
      <dt className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-900 dark:text-slate-100 mt-0.5 break-words">{value}</dd>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
}

function ActionButton({ icon: Icon, label, active, onClick, disabled, danger, hint }: ActionButtonProps) {
  const base = "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left";
  const variant = active
    ? danger
      ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
      : "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <button
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