import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, Check, X, Play, Pause, Square, RotateCcw, Plus, Loader2,
  AlertTriangle, CheckCircle2, Info, Tag as TagIcon, Repeat, Sparkles, Clock, Zap, Layers,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import type { Category, CollectionActionResult, CollectionLog, CollectionState, LogLevel, Marketplace, MarketplaceStatus, NewCategoryInput } from "../../types/collectionTypes";
import { createCategory, fetchCategories, fetchCollectionLogs, fetchCollectionState, fetchMarketplaces, pauseCollection, resumeCollection, startCollection, stopCollection } from "../../services/collectionApi";
import { getToken } from "../../services/djangoClient";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

import magaluLogo from "../../assets/marketplace/magalulogo.svg";
import mercadoLivreLogo from "../../assets/marketplace/mercadolivrelogo.png";
import amazonLogo from "../../assets/marketplace/amazonlogo.svg";
import shopeeLogo from "../../assets/marketplace/shopeelogo.png";
import tiktokLogo from "../../assets/marketplace/tiktoklogo.svg";

const MARKETPLACE_LOGOS: Record<string, string> = {
  magalu: magaluLogo,
  mercadolivre: mercadoLivreLogo,
  amazon: amazonLogo,
  shopee: shopeeLogo,
  tiktokshop: tiktokLogo,
};

const containerVars: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, ease: "easeOut" } } };
const itemVars: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

const FALLBACK_MARKETPLACES: Marketplace[] = [
  { id: "magalu", name: "Magazine Luiza", description: "Coleta automática de ofertas e links de afiliado.", color: "#0086ff", status: "available" },
  { id: "mercadolivre", name: "Mercado Livre", description: "Disponível pelo aplicativo desktop.", color: "#ffe600", status: "unavailable" },
  { id: "amazon", name: "Amazon", description: "Integração ainda não disponível.", color: "#ff9900", status: "unavailable" },
  { id: "shopee", name: "Shopee", description: "Integração ainda não disponível.", color: "#ee4d2d", status: "unavailable" },
  { id: "tiktokshop", name: "TikTok Shop", description: "Integração em desenvolvimento.", color: "#000000", status: "developing" },
];

const MARKETPLACE_STATUS_LABEL: Record<MarketplaceStatus, string> = { connected: "Conectado", available: "Disponível", developing: "Em desenvolvimento", unavailable: "Indisponível" };
const MARKETPLACE_STATUS_STYLE: Record<MarketplaceStatus, string> = {
  connected: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  available: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  developing: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  unavailable: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: "cozinha", name: "Cozinha", isNative: true, loop: false },
  { id: "quarto", name: "Quarto", isNative: true, loop: false },
  { id: "sala", name: "Sala", isNative: true, loop: false },
  { id: "banheiro", name: "Banheiro", isNative: true, loop: false },
  { id: "acessórios", name: "Acessórios", isNative: true, loop: false },
];

const formatDateTime = (iso: string | null) => iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const LOG_STYLES: Record<LogLevel, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  info: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", icon: Info },
  success: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  warning: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  error: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", icon: AlertTriangle },
};

interface ColetaGeralProps { isDark?: boolean; setIsDark?: (value: boolean) => void; }

export function ColetaGeral({ isDark }: ColetaGeralProps) {
  const [state, setState] = useState<CollectionState>({ status: "idle", marketplaceId: null, categoryIds: [], lastRunAt: null, processedProducts: null, error: null });
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>(FALLBACK_MARKETPLACES);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [logs, setLogs] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const navigate = useNavigate();
  const [warnings, setWarnings] = useState<string[]>([]);
  const executionIdRef = useRef<number | null>(null);

  const applyServerState = useCallback((s: CollectionState) => {
    executionIdRef.current = s.executionId ?? null;
    setState((prev) => {
      // Parada/erro: o servidor não dita a seleção do usuário, só o status.
      if (s.status === "idle" || s.status === "error") {
        return { ...prev, status: s.status, lastRunAt: s.lastRunAt, processedProducts: s.processedProducts, error: s.error, executionId: s.executionId };
      }
      return { ...prev, ...s };
    });
    // Coleta em andamento (ex.: página recarregada): garante que palavras-chave
    // personalizadas em uso apareçam na lista de categorias.
    if (s.status !== "idle" && s.status !== "error") {
      setCategories((prev) => {
        const missing = s.categoryIds.filter((id) => !prev.some((c) => c.id === id));
        return missing.length
          ? [...prev, ...missing.map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1), isNative: false, loop: false }))]
          : prev;
      });
    }
  }, []);

  const reload = useCallback(async () => {
    if (!getToken()) { navigate("/", { replace: true }); return; }
    const [m, c, s] = await Promise.all([fetchMarketplaces(), fetchCategories(), fetchCollectionState()]);
    if (!getToken()) { navigate("/", { replace: true }); return; } // token expirado (401)
    if (m.length) setMarketplaces(m);
    setCategories((prev) => {
      const customs = prev.filter((x) => !x.isNative);
      const loops = new Map(prev.map((x) => [x.id, x.loop]));
      return [...c.map((x) => ({ ...x, loop: loops.get(x.id) ?? false })), ...customs];
    });
    if (s) {
      applyServerState(s);
      setLogs(await fetchCollectionLogs(s.executionId));
    } else {
      setState((prev) => ({ ...prev, error: prev.error ?? "Não foi possível carregar o status da coleta." }));
    }
    setLoading(false);
  }, [applyServerState, navigate]);

  useEffect(() => { setLoading(true); reload(); }, [reload]);

  // Enquanto há coleta em andamento, acompanha status e logs.
  useEffect(() => {
    if (state.status === "idle" || state.status === "error") return;
    const id = window.setInterval(async () => {
      const s = await fetchCollectionState();
      if (!s) return;
      applyServerState(s);
      setLogs(await fetchCollectionLogs(s.executionId));
    }, 3000);
    return () => window.clearInterval(id);
  }, [state.status, applyServerState]);

  const handleSelectMarketplace = (m: Marketplace) => { if (m.status === "unavailable" || m.status === "developing") return; setState((prev) => ({ ...prev, marketplaceId: m.id })); };
  const toggleCategory = (id: string) => { setState((prev) => ({ ...prev, categoryIds: prev.categoryIds.includes(id) ? prev.categoryIds.filter((x) => x !== id) : [...prev.categoryIds, id] })); };
  const toggleLoop = (id: string) => { setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, loop: !c.loop } : c))); };

  const runAction = async (optimistic: CollectionState["status"], rollback: CollectionState["status"], action: () => Promise<CollectionActionResult>) => {
    setWarnings([]);
    setState((prev) => ({ ...prev, status: optimistic, error: null }));
    const res = await action();
    if (res.state) {
      applyServerState(res.state);
      setWarnings(res.warnings);
      setLogs(await fetchCollectionLogs(res.state.executionId));
    } else {
      if (!getToken()) { navigate("/", { replace: true }); return; }
      setState((prev) => ({ ...prev, status: rollback, error: res.error }));
    }
  };

  const handleStart = () => {
    if (!state.marketplaceId || state.categoryIds.length === 0) return;
    const selected = categories.filter((c) => state.categoryIds.includes(c.id));
    return runAction("starting", "idle", () => startCollection({ marketplaceId: state.marketplaceId!, categories: selected }));
  };
  const handlePause = () => runAction("stopping", "running", pauseCollection);
  const handleResume = () => runAction("starting", "paused", resumeCollection);
  const handleStop = () => { setConfirmStop(false); return runAction("stopping", state.status, stopCollection); };

  const handleCreateCategory = async (input: NewCategoryInput) => {
    const created = await createCategory(input);
    if (created) { setCategories((prev) => [...prev, created]); return { ok: true as const }; }
    const local: Category = { id: input.name.trim().toLowerCase(), name: input.name, isNative: false, loop: false, keywords: input.keywords };
    setCategories((prev) => (prev.some((c) => c.id === local.id) ? prev : [...prev, local]));
    return { ok: true as const, warning: "Ainda não é possível salvar categorias personalizadas pela API — ela existe só nesta sessão e a coleta exigirá um template configurado no painel." };
  };

  const selectedMarketplace = useMemo(() => marketplaces.find((m) => m.id === state.marketplaceId) ?? null, [marketplaces, state.marketplaceId]);
  const canStart = (state.status === "idle" || state.status === "error") && state.marketplaceId !== null && state.categoryIds.length > 0;
  const isBusy = state.status === "starting" || state.status === "stopping";

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Coleta Geral</h1>
            <StatusPill status={state.status} />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Configure e acompanhe suas coletas de produtos em um único lugar.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
        <motion.section variants={itemVars}>
          <SectionTitle icon={Store} title="Marketplaces" subtitle="Escolha a plataforma de origem dos produtos." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {marketplaces.map((m) => {
              const isSelected = state.marketplaceId === m.id;
              const isDisabled = m.status === "unavailable" || m.status === "developing";
              const logoSrc = MARKETPLACE_LOGOS[m.id];
              const isFullBleedIcon = m.id === "shopee" || m.id === "tiktokshop";
              return (
                <button key={m.id} type="button" onClick={() => handleSelectMarketplace(m)} disabled={isDisabled} title={isDisabled ? m.status === "developing" ? "Integração ainda em desenvolvimento" : "Integração indisponível no momento" : m.name}
                  className={`relative text-left p-4 rounded-md border transition-all focus:outline-none flex flex-col justify-between ${isSelected ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 ring-1 ring-blue-500 shadow-sm" : isDisabled ? "border-gray-200 dark:border-gray-800 bg-gray-100/60 dark:bg-gray-900/40 opacity-60 cursor-not-allowed" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs cursor-pointer"}`}>
                  <div className="flex items-start gap-3">
                    {logoSrc ? (
                      <div
                        className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 overflow-hidden ${isFullBleedIcon ? "p-0" : "p-1.5 border border-gray-200 dark:border-gray-700"}`}
                        style={{ backgroundColor: m.id === "magalu" ? "#0086ff" : isFullBleedIcon ? "transparent" : "#ffffff" }}
                      >
                        <img
                          src={logoSrc}
                          alt={`Logo ${m.name}`}
                          className={`h-full w-full ${isFullBleedIcon ? "object-cover scale-110" : "object-contain"}`}
                        />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 text-white text-xs font-bold" style={{ backgroundColor: m.color }}>{m.name.slice(0, 2).toUpperCase()}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{m.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium ${MARKETPLACE_STATUS_STYLE[m.status]}`}>{MARKETPLACE_STATUS_LABEL[m.status]}</span>
                    {isSelected && <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-blue-600 text-white"><Check className="h-3 w-3" /></span>}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedMarketplace && selectedMarketplace.status === "available" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Marketplace selecionado. A coleta será iniciada somente após a configuração das categorias abaixo.</p>
          )}
        </motion.section>

        <motion.section variants={itemVars}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <SectionTitle icon={TagIcon} title="Categorias" subtitle="Selecione as categorias que deseja coletar." noMargin />
            <button type="button" onClick={() => setShowCategoryModal(true)} className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-2xs focus:outline-none">
              <Plus className="h-3.5 w-3.5" />
              <span>Nova categoria</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.map((c) => {
              const selected = state.categoryIds.includes(c.id);
              return (
                <div key={c.id} className={`relative rounded-md border p-3.5 transition-all flex flex-col justify-between ${selected ? "border-blue-500 bg-blue-50/70 dark:bg-blue-900/30 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 shadow-xs"}`}>
                  <button type="button" onClick={() => toggleCategory(c.id)} className="w-full text-left focus:outline-none" aria-pressed={selected}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-colors ${selected ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950"}`}>{selected && <Check className="h-3 w-3 text-white" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{c.isNative ? "Nativa" : "Personalizada"}</p>
                      </div>
                    </div>
                  </button>
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={() => toggleLoop(c.id)} title={c.loop ? "Loop ativo" : "Ativar loop"} className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-md px-2 py-0.5 transition-colors focus:outline-none ${c.loop ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                      <Repeat className="h-3 w-3" />
                      <span>Loop {c.loop ? "on" : "off"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section variants={itemVars}>
          <SectionTitle icon={Zap} title="Controle da coleta" subtitle="Inicie, pause ou acompanhe a execução." />
          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <InfoTile label="Status" value={statusLabel(state.status)} tone={state.status === "running" ? "green" : state.status === "error" ? "red" : state.status === "paused" ? "amber" : "gray"} />
              <InfoTile label="Marketplace" value={selectedMarketplace?.name ?? "Nenhum"} />
              <InfoTile label="Categorias" value={state.categoryIds.length > 0 ? `${state.categoryIds.length} selecionadas` : "Nenhuma"} />
              <InfoTile label="Última execução" value={formatDateTime(state.lastRunAt)} />
            </div>
            {state.processedProducts != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Produtos processados nesta execução: <span className="font-semibold text-gray-900 dark:text-gray-100">{state.processedProducts.toLocaleString("pt-BR")}</span></p>
            )}
            {state.error && (
              <div className="flex items-start gap-2 text-xs rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2.5 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 dark:text-red-300">{state.error}</p>
              </div>
            )}
            {warnings.map((w) => (
              <div key={w} className="flex items-start gap-2 text-xs rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5 mb-4">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-amber-700 dark:text-amber-300">{w}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {state.status === "idle" && <button type="button" onClick={handleStart} disabled={!canStart} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors shadow-xs focus:outline-none"><Play className="h-3.5 w-3.5" /><span>Iniciar coleta</span></button>}
              {state.status === "running" && (
                <>
                  <button type="button" onClick={handlePause} disabled={isBusy} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none"><Pause className="h-3.5 w-3.5" /><span>Pausar coleta</span></button>
                  <button type="button" onClick={() => setConfirmStop(true)} disabled={isBusy} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors focus:outline-none"><Square className="h-3.5 w-3.5" /><span>Parar coleta</span></button>
                </>
              )}
              {state.status === "paused" && (
                <>
                  <button type="button" onClick={handleResume} disabled={isBusy} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none"><RotateCcw className="h-3.5 w-3.5" /><span>Retomar coleta</span></button>
                  <button type="button" onClick={() => setConfirmStop(true)} disabled={isBusy} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors focus:outline-none"><Square className="h-3.5 w-3.5" /><span>Parar coleta</span></button>
                </>
              )}
              {(state.status === "starting" || state.status === "stopping") && <button type="button" disabled className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium cursor-not-allowed"><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>{state.status === "starting" ? "Iniciando..." : "Parando..."}</span></button>}
              {state.status === "error" && <button type="button" onClick={handleStart} disabled={!canStart} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs focus:outline-none"><RotateCcw className="h-3.5 w-3.5" /><span>Tentar novamente</span></button>}
            </div>
            {!canStart && state.status === "idle" && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">Selecione um marketplace e pelo menos uma categoria para iniciar a coleta.</p>}
          </div>
        </motion.section>

        <motion.section variants={itemVars}>
          <SectionTitle icon={Clock} title="Atividade recente" subtitle="Últimas execuções e eventos da coleta." />
          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-2.5">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
            ) : logs.length === 0 ? <EmptyLogs /> : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((l) => {
                  const style = LOG_STYLES[l.level];
                  const Icon = style.icon;
                  return (
                    <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={`p-1.5 rounded-md shrink-0 ${style.bg}`}><Icon className={`h-3.5 w-3.5 ${style.text}`} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{l.message}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(l.at)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.section>
      </motion.div>

      <AnimatePresence>{showCategoryModal && <NewCategoryModal onClose={() => setShowCategoryModal(false)} onSubmit={handleCreateCategory} />}</AnimatePresence>
      <AnimatePresence>{confirmStop && <ConfirmDialog title="Parar a coleta?" description="A coleta será interrompida. Os produtos já processados serão mantidos." confirmLabel="Parar coleta" onCancel={() => setConfirmStop(false)} onConfirm={handleStop} />}</AnimatePresence>
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, noMargin }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; noMargin?: boolean }) {
  return (
    <div className={noMargin ? "" : "mb-3"}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400 shrink-0" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{subtitle}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: CollectionState["status"] }) {
  const map: Record<CollectionState["status"], { bg: string; text: string; dot: string; label: string }> = {
    idle: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-500", label: "Parada" },
    starting: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Iniciando" },
    running: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500 animate-pulse", label: "Executando" },
    paused: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Pausada" },
    stopping: { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500 animate-pulse", label: "Parando" },
    error: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Erro" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-800 text-[11px] font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
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

type Tone = "gray" | "green" | "amber" | "red";
function InfoTile({ label, value, tone = "gray" }: { label: string; value: string; tone?: Tone; }) {
  const tones: Record<Tone, string> = { gray: "text-gray-900 dark:text-gray-100", green: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", red: "text-red-600 dark:text-red-400" };
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/50 p-3.5">
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-sm font-bold mt-1 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function EmptyLogs() {
  return (
    <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-2">
      <Layers className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600" />
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sem atividade registrada</p>
      <p className="text-xs max-w-sm mx-auto">As execuções aparecerão aqui após serem iniciadas.</p>
    </div>
  );
}

function NewCategoryModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (input: NewCategoryInput) => Promise<{ ok: true; warning?: string }>; }) {
  const [name, setName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const addKeyword = () => { const v = keywordInput.trim(); if (!v) return; if (keywords.includes(v)) { setKeywordInput(""); return; } setKeywords((prev) => [...prev, v]); setKeywordInput(""); };
  const handleSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) { setError("O nome da categoria precisa ter pelo menos 2 caracteres."); return; }
    setSaving(true);
    const res = await onSubmit({ name: name.trim(), keywords });
    setSaving(false);
    if (res.warning) { setWarning(res.warning); setTimeout(onClose, 1400); return; }
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-500" /><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nova categoria</h3></div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da categoria</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Eletrodomésticos" className="h-9 w-full px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Palavras-chave</label>
            <div className="flex gap-2">
              <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }} placeholder="Digite e pressione Enter" className="h-9 flex-1 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <button type="button" onClick={addKeyword} className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                    {k}
                    <button type="button" onClick={() => setKeywords((prev) => prev.filter((x) => x !== k))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {error && <div className="flex items-start gap-2 text-xs rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2"><AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" /><p className="text-red-700 dark:text-red-300">{error}</p></div>}
          {warning && <div className="flex items-start gap-2 text-xs rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /><p className="text-amber-700 dark:text-amber-300">{warning}</p></div>}
        </div>
        <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 px-3.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={saving} className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-medium transition-colors">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}<span>Salvar categoria</span></button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDialog({ title, description, confirmLabel, onCancel, onConfirm }: { title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 shadow-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-md bg-red-50 dark:bg-red-950/40"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
          <div><h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p></div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel} className="h-8 px-3 rounded-md border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancelar</button>
          <button type="button" onClick={onConfirm} className="h-8 px-3 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ColetaGeral;