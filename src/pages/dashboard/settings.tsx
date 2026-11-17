import { useMemo, useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon, Search, Filter, X, Moon, Sun, Link2, CheckCircle2, Clock, AlertTriangle, Plug, ExternalLink, Info, Shield, Palette, UserCog, BellRing, Lock, RefreshCw, ChevronDown, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { MOCK_PLATFORMS, emptyPlatformFilters, filterPlatforms, computeIntegrationKpis, formatDateTime, formatRelative } from "../../mocks/mockIntegrations";
import { CATEGORY_LABELS, STATUS_LABELS, STATUS_STYLES, CAPABILITY_LABELS, CAPABILITY_LEVEL_LABELS, CAPABILITY_LEVEL_STYLES, type Platform, type PlatformFilters, type IntegrationStatus, type PlatformCategory, type AccountPreferences, type GeneralPreferences, type NotificationPreferences, type SettingsTab } from "../../types/settingsTypes";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";

import magaluLogo from "../../assets/marketplace/magalulogo.svg";
import mercadoLivreLogo from "../../assets/marketplace/mercadolivrelogo.png";
import amazonLogo from "../../assets/marketplace/amazonlogo.svg";
import shopeeLogo from "../../assets/marketplace/shopeelogo.png";
import tiktokLogo from "../../assets/marketplace/tiktoklogo.svg";

const PLATFORM_LOGOS: Record<string, { src: string; key: string }> = {
  magalu: { src: magaluLogo, key: "magalu" },
  magazineluiza: { src: magaluLogo, key: "magalu" },
  mercadolivre: { src: mercadoLivreLogo, key: "mercadolivre" },
  amazon: { src: amazonLogo, key: "amazon" },
  shopee: { src: shopeeLogo, key: "shopee" },
  tiktok: { src: tiktokLogo, key: "tiktokshop" },
  tiktokshop: { src: tiktokLogo, key: "tiktokshop" },
};

function getPlatformLogo(platform: Platform) {
  const byId = PLATFORM_LOGOS[platform.id.toLowerCase().replace(/[^a-z0-9]/g, "")];
  if (byId) return byId;
  const byName = PLATFORM_LOGOS[platform.name.toLowerCase().replace(/[^a-z0-9]/g, "")];
  return byName ?? null;
}

const INITIAL_PLATFORMS: Platform[] = MOCK_PLATFORMS.map((p) => {
  const hasLogo = getPlatformLogo(p) !== null;
  if (!hasLogo) {
    return { ...p, status: "developing", connectedAt: undefined, lastSyncAt: undefined };
  }
  return p.status === "developing" ? { ...p, status: "disconnected" } : p;
});

const containerVars: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, ease: "easeOut" } } };
const itemVars: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

interface SettingsPageProps { isDark?: boolean; setIsDark?: (value: boolean) => void; }

export function SettingsPage({ isDark, setIsDark }: SettingsPageProps) {
  const [tab, setTab] = useState<SettingsTab>("integrations");

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Configurações</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Gerencie suas integrações, contas e preferências do Scallora.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 pt-0.5">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200 dark:border-gray-800 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <TabButton active={tab === "integrations"} onClick={() => setTab("integrations")} icon={Plug} label="Integrações" />
        <TabButton active={tab === "account"} onClick={() => setTab("account")} icon={UserCog} label="Conta e perfil" />
        <TabButton active={tab === "preferences"} onClick={() => setTab("preferences")} icon={Palette} label="Preferências" />
        <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")} icon={BellRing} label="Notificações" />
        <TabButton active={tab === "security"} onClick={() => setTab("security")} icon={Lock} label="Segurança" />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, ease: "easeOut" }}>
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "account" && <AccountTab />}
          {tab === "preferences" && <PreferencesTab isDark={!!isDark} setIsDark={setIsDark || (() => {})} />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "security" && <SecurityTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <button onClick={onClick} className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"}`}>
      <Icon className="h-4 w-4" />{label}
      {active && <motion.span layoutId="settings-tab-underline" className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
    </button>
  );
}

function IntegrationsTab() {
  const [platforms, setPlatforms] = useState<Platform[]>(INITIAL_PLATFORMS);
  const [filters, setFilters] = useState<PlatformFilters>(emptyPlatformFilters);
  const [modalPlatform, setModalPlatform] = useState<Platform | null>(null);
  const [toast, setToast] = useState<string | null>(null);
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

  const filtered = useMemo(() => filterPlatforms(platforms, filters), [platforms, filters]);
  const kpis = useMemo(() => computeIntegrationKpis(platforms), [platforms]);

  const activeAdvancedCount = filters.status !== "all" ? 1 : 0;
  const hasActiveFilters = filters.search !== "" || filters.category !== "all" || activeAdvancedCount > 0;

  const clearFilters = () => setFilters(emptyPlatformFilters);
  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 2600); };

  const connectPlatform = (id: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === id ? { ...p, status: "connected", connectedAt: new Date().toISOString(), lastSyncAt: new Date().toISOString() } : p));
    setModalPlatform((prev) => prev && prev.id === id ? { ...prev, status: "connected", connectedAt: new Date().toISOString(), lastSyncAt: new Date().toISOString() } : prev);
    showToast("Conexão simulada com sucesso.");
  };
  const disconnectPlatform = (id: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === id ? { ...p, status: "disconnected", connectedAt: undefined, lastSyncAt: undefined } : p));
    setModalPlatform(null);
    showToast("Integração desconectada.");
  };
  const syncPlatform = (id: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === id ? { ...p, lastSyncAt: new Date().toISOString() } : p));
    setModalPlatform((prev) => prev && prev.id === id ? { ...prev, lastSyncAt: new Date().toISOString() } : prev);
    showToast("Sincronização simulada.");
  };

  return (
    <>
      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={Plug} tone="blue" label="Plataformas no catálogo" value={kpis.total.toString()} hint="Total de plataformas disponíveis" />
        <KpiCard icon={CheckCircle2} tone="green" label="Integrações conectadas" value={kpis.connected.toString()} hint="Conexões simuladas ativas" />
        <KpiCard icon={Clock} tone="amber" label="Aguardando configuração" value={kpis.pending.toString()} hint="Pendentes ou em desenvolvimento" />
        <KpiCard icon={RefreshCw} tone="slate" label="Última sincronização" value={kpis.lastSync ? formatRelative(kpis.lastSync) : "—"} hint={kpis.lastSync ? formatDateTime(kpis.lastSync) : "Sem dados"} />
      </motion.div>

      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 mb-4 shadow-xs flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600 dark:text-gray-400">Conecte suas plataformas para organizar seus links, acompanhar o desempenho e centralizar os dados no Scallora.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Buscar plataforma..." className="h-9 w-full pl-9 pr-3 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" />
          </div>

          <div className="relative shrink-0">
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value as PlatformCategory | "all" })} className="h-9 appearance-none pl-3 pr-8 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer">
              <option value="all">Todas as categorias</option>
              <option value="marketplace">{CATEGORY_LABELS.marketplace}</option>
              <option value="afiliados">{CATEGORY_LABELS.afiliados}</option>
              <option value="rede">{CATEGORY_LABELS.rede}</option>
              <option value="ecommerce">{CATEGORY_LABELS.ecommerce}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>

          <div className="relative shrink-0" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setAdvancedFiltersOpen((prev) => !prev)}
              className={`h-9 inline-flex items-center gap-1.5 px-3 text-xs font-medium rounded-md border shadow-2xs transition-colors focus:outline-none ${
                advancedFiltersOpen || activeAdvancedCount > 0
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeAdvancedCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-semibold bg-blue-600 text-white rounded-md">
                  {activeAdvancedCount}
                </span>
              )}
            </button>

            {advancedFiltersOpen && (
              <div className="absolute left-0 mt-1.5 w-64 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-30 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Status da Conexão
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as IntegrationStatus | "all" })}
                    className="w-full h-8 px-2 text-xs bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Todos os status</option>
                    <option value="connected">Conectadas</option>
                    <option value="disconnected">Desconectadas</option>
                    <option value="pending">Aguardando</option>
                    <option value="developing">Em desenvolvimento</option>
                    <option value="error">Com erro</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setAdvancedFiltersOpen(false);
                    }}
                    className="w-full py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} title="Limpar filtros" className="h-9 inline-flex items-center gap-1 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors shrink-0">
              <X className="h-3.5 w-3.5" /><span className="hidden xl:inline">Limpar</span>
            </button>
          )}
        </div>
      </motion.div>

      {filtered.length === 0 ? (<EmptyState onClear={clearFilters} hasRecords={platforms.length > 0} />) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (<IntegrationCard key={p.id} platform={p} onOpen={() => setModalPlatform(p)} />))}
        </div>
      )}

      <AnimatePresence>{modalPlatform && (<IntegrationModal platform={modalPlatform} onClose={() => setModalPlatform(null)} onConnect={() => connectPlatform(modalPlatform.id)} onDisconnect={() => disconnectPlatform(modalPlatform.id)} onSync={() => syncPlatform(modalPlatform.id)} />)}</AnimatePresence>

      <AnimatePresence>
        {toast && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-lg">{toast}</motion.div>)}
      </AnimatePresence>
    </>
  );
}

function PlatformAvatar({ platform }: { platform: Platform }) {
  const Icon = platform.icon;
  const logo = getPlatformLogo(platform);

  if (logo) {
    const isFullBleed = logo.key === "shopee" || logo.key === "tiktokshop";
    return (
      <div
        className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 overflow-hidden ${isFullBleed ? "p-0" : "p-1.5 border border-gray-200 dark:border-gray-700"}`}
        style={{ backgroundColor: logo.key === "magalu" ? "#0086ff" : isFullBleed ? "transparent" : "#ffffff" }}
      >
        <img
          src={logo.src}
          alt={`Logo ${platform.name}`}
          className={`h-full w-full ${isFullBleed ? "object-cover scale-110" : "object-contain"}`}
        />
      </div>
    );
  }

  return (
    <div className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: platform.color }}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function IntegrationCard({ platform, onOpen }: { platform: Platform; onOpen: () => void }) {
  const action = getActionLabel(platform.status);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <PlatformAvatar platform={platform} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{platform.name}</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[platform.category]}</p>
        </div>
        <StatusBadge status={platform.status} />
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{platform.description}</p>
      <div className="flex flex-wrap gap-1 mb-4">
        {platform.capabilities.filter((c) => c.level === "available").slice(0, 3).map((c) => (<span key={c.key} className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{CAPABILITY_LABELS[c.key]}</span>))}
      </div>
      <button onClick={onOpen} className="mt-auto w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {action.icon}{action.label}
      </button>
    </motion.div>
  );
}

function getActionLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected": return { label: "Gerenciar conexão", icon: <SettingsIcon className="h-3.5 w-3.5" /> };
    case "disconnected": case "pending": case "error": return { label: "Conectar", icon: <Plug className="h-3.5 w-3.5" /> };
    case "developing": return { label: "Saiba mais", icon: <Info className="h-3.5 w-3.5" /> };
  }
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

function IntegrationModal({ platform, onClose, onConnect, onDisconnect, onSync }: { platform: Platform; onClose: () => void; onConnect: () => void; onDisconnect: () => void; onSync: () => void }) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const isConnected = platform.status === "connected";
  const isDeveloping = platform.status === "developing";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-start gap-3">
          <PlatformAvatar platform={platform} />
          <div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{platform.name}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{CATEGORY_LABELS[platform.category]}</p></div>
          <button onClick={onClose} className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-600 dark:text-gray-400">Status da conexão</span><StatusBadge status={platform.status} /></div>
          {isConnected && (
            <div className="grid grid-cols-2 gap-3">
              {platform.connectedAt && (<div className="rounded-md bg-gray-50 dark:bg-gray-800/50 px-3 py-2"><p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Conectada em</p><p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatDateTime(platform.connectedAt)}</p></div>)}
              {platform.lastSyncAt && (<div className="rounded-md bg-gray-50 dark:bg-gray-800/50 px-3 py-2"><p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Última sincronização</p><p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{formatRelative(platform.lastSyncAt)}</p></div>)}
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Recursos</h3>
            <ul className="space-y-2">
              {platform.capabilities.map((c) => (<li key={c.key} className="flex items-center justify-between text-xs"><span className="text-gray-700 dark:text-gray-300">{CAPABILITY_LABELS[c.key]}</span><span className={`font-medium ${CAPABILITY_LEVEL_STYLES[c.level]}`}>{CAPABILITY_LEVEL_LABELS[c.level]}</span></li>))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isConnected ? (
              <>
                <button onClick={onSync} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"><RefreshCw className="h-4 w-4" /> Sincronizar agora</button>
                <button onClick={() => setConfirmDisconnect(true)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors">Desconectar</button>
              </>
            ) : isDeveloping ? (
              <div className="w-full text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-md px-3 py-3 text-center">Esta integração ainda está em desenvolvimento.</div>
            ) : (
              <button onClick={onConnect} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"><ExternalLink className="h-4 w-4" /> Iniciar conexão</button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {confirmDisconnect && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setConfirmDisconnect(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Desconectar {platform.name}?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A integração voltará ao estado "Desconectada".</p>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={() => setConfirmDisconnect(false)} className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                  <button onClick={() => { setConfirmDisconnect(false); onDisconnect(); }} className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">Desconectar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ hasRecords, onClear }: { hasRecords: boolean; onClear: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-16 px-6 text-center">
      <div className="mx-auto p-3 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mb-4"><Link2 className="h-6 w-6 text-gray-400" /></div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{hasRecords ? "Nenhum resultado" : "Sem plataformas"}</h3>
      {hasRecords && (<button onClick={onClear} className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300"><X className="h-3.5 w-3.5" /> Limpar filtros</button>)}
    </div>
  );
}

function KpiCard({ icon: Icon, tone, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; tone: "blue" | "green" | "amber" | "slate"; label: string; value: string; hint?: string }) {
  const styles = { blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400", green: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400", amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400", slate: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" };
  return (
    <motion.div variants={itemVars} className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs flex flex-col justify-between">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium">
        <div className={`p-1.5 rounded-md ${styles[tone]}`}><Icon className="h-3.5 w-3.5" /></div>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">{hint}</p>}
      </div>
    </motion.div>
  );
}

function AccountTab() {
  const [prefs, setPrefs] = useState<AccountPreferences>({ displayName: "Afiliado Demo", email: "demo@scallora.app" });
  const [toast, setToast] = useState<string | null>(null);
  const save = () => { setToast("Alterações salvas localmente."); window.setTimeout(() => setToast(null), 2400); };
  return (
    <div className="max-w-2xl">
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs space-y-5">
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Conta e perfil</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Preferências básicas da sua conta.</p></div>
        <Field label="Nome de exibição"><input type="text" value={prefs.displayName} onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })} className="h-9 w-full px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" /></Field>
        <Field label="E-mail"><input type="email" value={prefs.email} disabled className="h-9 w-full px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 text-xs text-gray-500 cursor-not-allowed" /></Field>
        <div className="flex justify-end pt-2"><button onClick={save} className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs">Salvar alterações</button></div>
      </div>
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg">{toast}</motion.div>)}</AnimatePresence>
    </div>
  );
}

function PreferencesTab({ isDark, setIsDark }: { isDark: boolean; setIsDark: (v: boolean) => void }) {
  const [prefs, setPrefs] = useState<GeneralPreferences>({ currency: "BRL", dateFormat: "DD/MM/YYYY", compactDashboard: false });
  const [toast, setToast] = useState<string | null>(null);
  const save = () => { setToast("Preferências salvas localmente."); window.setTimeout(() => setToast(null), 2400); };
  return (
    <div className="max-w-2xl">
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs space-y-5">
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preferências</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ajuste como o Scallora exibe dados.</p></div>
        <Field label="Tema">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDark(false)} className={`h-9 flex-1 inline-flex items-center justify-center gap-2 px-3 rounded-md border text-xs font-medium transition-colors ${!isDark ? "border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Sun className="h-3.5 w-3.5" /> Claro</button>
            <button onClick={() => setIsDark(true)} className={`h-9 flex-1 inline-flex items-center justify-center gap-2 px-3 rounded-md border text-xs font-medium transition-colors ${isDark ? "border-blue-500/40 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}><Moon className="h-3.5 w-3.5" /> Escuro</button>
          </div>
        </Field>
        <Field label="Moeda">
          <select value={prefs.currency} onChange={(e) => setPrefs({ ...prefs, currency: e.target.value as any })} className="h-9 w-full px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
            <option value="BRL">Real brasileiro (BRL)</option><option value="USD">Dólar americano (USD)</option><option value="EUR">Euro (EUR)</option>
          </select>
        </Field>
        <div className="flex justify-end pt-2"><button onClick={save} className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs">Salvar preferências</button></div>
      </div>
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg">{toast}</motion.div>)}</AnimatePresence>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({ newConversions: true, syncFailures: true, financialGoals: false, productUpdates: true });
  const [toast, setToast] = useState<string | null>(null);
  const save = () => { setToast("Preferências salvas localmente."); window.setTimeout(() => setToast(null), 2400); };
  const toggles: { key: keyof NotificationPreferences; label: string; hint: string }[] = [
    { key: "newConversions", label: "Novas conversões", hint: "Avisos quando uma conversão for registrada." },
    { key: "syncFailures", label: "Falhas de sincronização", hint: "Avisos quando uma integração falhar ao sincronizar." },
    { key: "financialGoals", label: "Metas financeiras", hint: "Alertas quando você atingir (ou ficar perto) de uma meta." },
    { key: "productUpdates", label: "Atualizações importantes", hint: "Novidades do Scallora e mudanças de recursos." },
  ];
  return (
    <div className="max-w-2xl">
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs space-y-5">
        <div><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificações</h2><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Escolha quais avisos deseja receber.</p></div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {toggles.map((t) => (<div key={t.key} className="py-3 flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.hint}</p></div><Switch checked={prefs[t.key]} onChange={(v) => setPrefs({ ...prefs, [t.key]: v })} /></div>))}
        </div>
        <div className="flex justify-end pt-2"><button onClick={save} className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs">Salvar preferências</button></div>
      </div>
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium shadow-lg">{toast}</motion.div>)}</AnimatePresence>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

function SecurityTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /><h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Segurança</h2></div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Orientações e informações sobre autenticação, sessões e conexões externas.</p>
        <div className="flex items-start gap-2 text-xs rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2.5 mt-2">
          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-700 dark:text-blue-300">O gerenciamento real de sessões, tokens e permissões será implementado no backend Django.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>{children}</div>);
}

export default SettingsPage;