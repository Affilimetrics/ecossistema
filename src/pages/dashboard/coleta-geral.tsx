import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  Store,
  HelpCircle,
  Check,
  X,
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Tag as TagIcon,
  Repeat,
  Sparkles,
  Clock,
  Zap,
  Layers,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Category,
  CollectionLog,
  CollectionState,
  LogLevel,
  Marketplace,
  MarketplaceStatus,
  NewCategoryInput,
} from "../../types/collectionTypes";
import {
  createCategory,
  fetchCategories,
  fetchCollectionLogs,
  fetchCollectionState,
  fetchMarketplaces,
  pauseCollection,
  resumeCollection,
  startCollection,
  stopCollection,
} from "@/services/collectionApi";
import { NotificationPopover } from "../../components/ui/notification-popover";

/* ============================================================
   CATÁLOGO PADRÃO DE MARKETPLACES
   ============================================================ */

const FALLBACK_MARKETPLACES: Marketplace[] = [
  {
    id: "magalu",
    name: "Magazine Luiza",
    description: "Marketplace brasileiro de varejo.",
    color: "#0086ff",
    status: "available",
  },
  {
    id: "mercadolivre",
    name: "Mercado Livre",
    description: "Maior marketplace da América Latina.",
    color: "#ffe600",
    status: "available",
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Marketplace global com catálogo amplo.",
    color: "#ff9900",
    status: "available",
  },
  {
    id: "shopee",
    name: "Shopee",
    description: "Marketplace com foco em preços competitivos.",
    color: "#ee4d2d",
    status: "available",
  },
  {
    id: "tiktokshop",
    name: "TikTok Shop",
    description: "Integração em desenvolvimento.",
    color: "#000000",
    status: "developing",
  },
];

const MARKETPLACE_STATUS_LABEL: Record<MarketplaceStatus, string> = {
  connected: "Conectado",
  available: "Disponível",
  developing: "Em desenvolvimento",
  unavailable: "Indisponível",
};

const MARKETPLACE_STATUS_STYLE: Record<MarketplaceStatus, string> = {
  connected:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  available:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  developing:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  unavailable:
    "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20",
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: "cozinha", name: "Cozinha", isNative: true, loop: false },
  { id: "quarto", name: "Quarto", isNative: true, loop: false },
  { id: "sala", name: "Sala", isNative: true, loop: false },
  { id: "banheiro", name: "Banheiro", isNative: true, loop: false },
  { id: "acessorios", name: "Acessórios", isNative: true, loop: false },
];

/* ============================================================
   HELPERS
   ============================================================ */

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const LOG_STYLES: Record<
  LogLevel,
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  info: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", icon: Info },
  success: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: CheckCircle2 },
  warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  error: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: AlertTriangle },
};

/* ============================================================
   TELA
   ============================================================ */

interface ColetaGeralProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function ColetaGeral({ isDark, setIsDark }: ColetaGeralProps) {
  const [state, setState] = useState<CollectionState>({
    status: "idle",
    marketplaceId: null,
    categoryIds: [],
    lastRunAt: null,
    processedProducts: null,
    error: null,
  });
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>(FALLBACK_MARKETPLACES);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [logs, setLogs] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const reload = useCallback(async () => {
    const [s, m, c, l] = await Promise.all([
      fetchCollectionState(),
      fetchMarketplaces(),
      fetchCategories(),
      fetchCollectionLogs(),
    ]);
    if (s) setState((prev) => ({ ...prev, ...s }));
    if (m.length) setMarketplaces(m);
    if (c.length) setCategories(c);
    if (l.length) setLogs(l);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  const handleSelectMarketplace = (m: Marketplace) => {
    if (m.status === "unavailable" || m.status === "developing") return;
    setState((prev) => ({ ...prev, marketplaceId: m.id }));
  };

  const toggleCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((x) => x !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const toggleLoop = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, loop: !c.loop } : c))
    );
  };

  const handleStart = async () => {
    if (!state.marketplaceId || state.categoryIds.length === 0) return;
    setState((prev) => ({ ...prev, status: "starting", error: null }));
    const res = await startCollection({
      marketplaceId: state.marketplaceId,
      categoryIds: state.categoryIds,
    });
    if (res) {
      setState((prev) => ({ ...prev, ...res }));
      reload();
    } else {
      setState((prev) => ({
        ...prev,
        status: "idle",
        error:
          "Não foi possível iniciar a coleta. Verifique a integração com o backend.",
      }));
    }
  };

  const handlePause = async () => {
    setState((prev) => ({ ...prev, status: "stopping" }));
    const res = await pauseCollection();
    if (res) setState((prev) => ({ ...prev, ...res }));
    else setState((prev) => ({ ...prev, status: "running" }));
  };

  const handleResume = async () => {
    setState((prev) => ({ ...prev, status: "starting" }));
    const res = await resumeCollection();
    if (res) setState((prev) => ({ ...prev, ...res }));
    else setState((prev) => ({ ...prev, status: "paused" }));
  };

  const handleStop = async () => {
    setConfirmStop(false);
    setState((prev) => ({ ...prev, status: "stopping" }));
    const res = await stopCollection();
    if (res) setState((prev) => ({ ...prev, ...res }));
    else setState((prev) => ({ ...prev, status: "idle" }));
  };

  const handleCreateCategory = async (input: NewCategoryInput) => {
    const created = await createCategory(input);
    if (created) {
      setCategories((prev) => [...prev, created]);
      return { ok: true as const };
    }
    const local: Category = {
      id: `custom-${Date.now()}`,
      name: input.name,
      isNative: false,
      loop: false,
      keywords: input.keywords,
    };
    setCategories((prev) => [...prev, local]);
    return {
      ok: true as const,
      warning:
        "Backend indisponível — categoria criada apenas nesta sessão.",
    };
  };

  const selectedMarketplace = useMemo(
    () => marketplaces.find((m) => m.id === state.marketplaceId) ?? null,
    [marketplaces, state.marketplaceId]
  );

  const canStart =
    state.status === "idle" &&
    state.marketplaceId !== null &&
    state.categoryIds.length > 0;

  const isBusy = state.status === "starting" || state.status === "stopping";

  return (
    <div className="flex-1 bg-gray-50 dark:bg-slate-950 p-6 overflow-auto">
      {/* CABEÇALHO PADRONIZADO */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Coleta Geral
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure e acompanhe suas coletas de produtos em um único lugar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill status={state.status} />
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

      {/* MARKETPLACES */}
      <section className="mb-8">
        <SectionTitle
          icon={Store}
          title="Marketplaces"
          subtitle="Escolha a plataforma de origem dos produtos."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {marketplaces.map((m) => {
            const isSelected = state.marketplaceId === m.id;
            const isDisabled =
              m.status === "unavailable" || m.status === "developing";
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMarketplace(m)}
                disabled={isDisabled}
                title={
                  isDisabled
                    ? m.status === "developing"
                      ? "Integração ainda em desenvolvimento"
                      : "Integração indisponível no momento"
                    : m.name
                }
                className={`relative text-left p-4 rounded-xl border transition-all focus:outline-none ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/30 shadow-sm"
                    : isDisabled
                    ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-60 cursor-not-allowed"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {m.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${MARKETPLACE_STATUS_STYLE[m.status]}`}
                  >
                    {MARKETPLACE_STATUS_LABEL[m.status]}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedMarketplace && selectedMarketplace.status === "available" && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Marketplace selecionado. A coleta será iniciada somente após a
            configuração das categorias abaixo.
          </p>
        )}
      </section>

      {/* CATEGORIAS */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle
            icon={TagIcon}
            title="Categorias"
            subtitle="Selecione as categorias que deseja coletar."
            noMargin
          />
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova categoria
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {categories.map((c) => {
            const selected = state.categoryIds.includes(c.id);
            return (
              <div
                key={c.id}
                className={`relative rounded-xl border p-3 transition-all ${
                  selected
                    ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <button
                  onClick={() => toggleCategory(c.id)}
                  className="w-full text-left focus:outline-none"
                  aria-pressed={selected}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                        selected
                          ? "bg-blue-500 border-blue-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.isNative ? "Nativa" : "Personalizada"}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => toggleLoop(c.id)}
                  title={c.loop ? "Loop ativo" : "Ativar loop"}
                  className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors focus:outline-none ${
                    c.loop
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Repeat className="h-3 w-3" />
                  Loop {c.loop ? "on" : "off"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTROLE DA COLETA */}
      <section className="mb-8">
        <SectionTitle
          icon={Zap}
          title="Controle da coleta"
          subtitle="Inicie, pause ou acompanhe a execução."
        />

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
            <InfoTile
              label="Status"
              value={statusLabel(state.status)}
              tone={
                state.status === "running"
                  ? "green"
                  : state.status === "error"
                  ? "red"
                  : state.status === "paused"
                  ? "amber"
                  : "slate"
              }
            />
            <InfoTile
              label="Marketplace"
              value={selectedMarketplace?.name ?? "Nenhum"}
            />
            <InfoTile
              label="Categorias"
              value={
                state.categoryIds.length > 0
                  ? `${state.categoryIds.length} selecionadas`
                  : "Nenhuma"
              }
            />
            <InfoTile
              label="Última execução"
              value={formatDateTime(state.lastRunAt)}
            />
          </div>

          {state.processedProducts != null && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Produtos processados nesta execução:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {state.processedProducts.toLocaleString("pt-BR")}
              </span>
            </p>
          )}

          {state.error && (
            <div className="flex items-start gap-2 text-xs rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 mb-4">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 dark:text-red-300">{state.error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {state.status === "idle" && (
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors focus:outline-none"
              >
                <Play className="h-4 w-4" />
                Iniciar coleta
              </button>
            )}

            {state.status === "running" && (
              <>
                <button
                  onClick={handlePause}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors focus:outline-none"
                >
                  <Pause className="h-4 w-4" />
                  Pausar coleta
                </button>
                <button
                  onClick={() => setConfirmStop(true)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors focus:outline-none"
                >
                  <Square className="h-4 w-4" />
                  Parar coleta
                </button>
              </>
            )}

            {state.status === "paused" && (
              <>
                <button
                  onClick={handleResume}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors focus:outline-none"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retomar coleta
                </button>
                <button
                  onClick={() => setConfirmStop(true)}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors focus:outline-none"
                >
                  <Square className="h-4 w-4" />
                  Parar coleta
                </button>
              </>
            )}

            {(state.status === "starting" || state.status === "stopping") && (
              <button
                disabled
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {state.status === "starting" ? "Iniciando..." : "Parando..."}
              </button>
            )}

            {state.status === "error" && (
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors focus:outline-none"
              >
                <RotateCcw className="h-4 w-4" />
                Tentar novamente
              </button>
            )}
          </div>

          {!canStart && state.status === "idle" && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
              Selecione um marketplace e pelo menos uma categoria para iniciar a coleta.
            </p>
          )}
        </div>
      </section>

      {/* HISTÓRICO */}
      <section>
        <SectionTitle
          icon={Clock}
          title="Atividade recente"
          subtitle="Últimas execuções e eventos da coleta."
        />

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyLogs />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((l) => {
                const style = LOG_STYLES[l.level];
                const Icon = style.icon;
                return (
                  <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={`p-1.5 rounded-lg shrink-0 ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        {l.message}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatDateTime(l.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <AnimatePresence>
        {showCategoryModal && (
          <NewCategoryModal
            onClose={() => setShowCategoryModal(false)}
            onSubmit={handleCreateCategory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmStop && (
          <ConfirmDialog
            title="Parar a coleta?"
            description="A coleta será interrompida. Os produtos já processados serão mantidos."
            confirmLabel="Parar coleta"
            onCancel={() => setConfirmStop(false)}
            onConfirm={handleStop}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  noMargin,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? "" : "mb-3"}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: CollectionState["status"] }) {
  const map: Record<
    CollectionState["status"],
    { bg: string; text: string; dot: string; label: string }
  > = {
    idle: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", label: "Parada" },
    starting: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Iniciando" },
    running: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500 animate-pulse", label: "Executando" },
    paused: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Pausada" },
    stopping: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500 animate-pulse", label: "Parando" },
    error: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Erro" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function statusLabel(status: CollectionState["status"]): string {
  switch (status) {
    case "idle": return "Parada";
    case "starting": return "Iniciando";
    case "running": return "Executando";
    case "paused": return "Pausada";
    case "stopping": return "Parando";
    case "error": return "Erro";
  }
}

type Tone = "slate" | "green" | "amber" | "red";

function InfoTile({ label, value, tone = "slate" }: { label: string; value: string; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    slate: "text-slate-900 dark:text-slate-100",
    green: "text-green-600 dark:text-green-400",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
  };
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function EmptyLogs() {
  return (
    <div className="py-12 px-6 text-center">
      <div className="mx-auto p-3 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mb-3">
        <Layers className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Sem atividade registrada</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">As execuções aparecerão aqui após serem iniciadas.</p>
    </div>
  );
}

function NewCategoryModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: NewCategoryInput) => Promise<{ ok: true; warning?: string }> }) {
  const [name, setName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const addKeyword = () => {
    const v = keywordInput.trim();
    if (!v) return;
    if (keywords.includes(v)) { setKeywordInput(""); return; }
    setKeywords((prev) => [...prev, v]);
    setKeywordInput("");
  };

  const handleSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("O nome da categoria precisa ter pelo menos 2 caracteres.");
      return;
    }
    setSaving(true);
    const res = await onSubmit({ name: name.trim(), keywords });
    setSaving(false);
    if (res.warning) {
      setWarning(res.warning);
      setTimeout(onClose, 1400);
      return;
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Nova categoria</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome da categoria</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Eletrodomésticos"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Palavras-chave</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Digite e pressione Enter"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              <button type="button" onClick={addKeyword} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
                    {k}
                    <button onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {warning && (
            <div className="flex items-start gap-2 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-700 dark:text-amber-300">{warning}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar categoria
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ColetaGeral;