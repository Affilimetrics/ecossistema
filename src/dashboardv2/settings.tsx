import { useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  Search,
  Filter,
  X,
  Bell,
  Moon,
  Sun,
  User,
  Link2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plug,
  ExternalLink,
  Info,
  Shield,
  Palette,
  UserCog,
  BellRing,
  Lock,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_PLATFORMS,
  emptyPlatformFilters,
  filterPlatforms,
  computeIntegrationKpis,
  formatDateTime,
  formatRelative,
} from "./mockIntegrations";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  CAPABILITY_LABELS,
  CAPABILITY_LEVEL_LABELS,
  CAPABILITY_LEVEL_STYLES,
  type Platform,
  type PlatformFilters,
  type IntegrationStatus,
  type PlatformCategory,
  type CapabilityKey,
  type CapabilityLevel,
  type AccountPreferences,
  type GeneralPreferences,
  type NotificationPreferences,
  type SettingsTab,
} from "./settingsTypes";

/* ============================================================
   PÁGINA
   ============================================================ */

interface SettingsPageProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SettingsPage({
  isDark,
  setIsDark,
}: SettingsPageProps) {
  const [tab, setTab] = useState<SettingsTab>("integrations");

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Configurações
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Gerencie suas integrações, contas e preferências do Scallora.
          </p>
        </div>
        <TopActions isDark={isDark} setIsDark={setIsDark} />
      </div>

      {/* Navegação interna */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        <TabButton
          active={tab === "integrations"}
          onClick={() => setTab("integrations")}
          icon={Plug}
          label="Integrações"
        />
        <TabButton
          active={tab === "account"}
          onClick={() => setTab("account")}
          icon={UserCog}
          label="Conta e perfil"
        />
        <TabButton
          active={tab === "preferences"}
          onClick={() => setTab("preferences")}
          icon={Palette}
          label="Preferências"
        />
        <TabButton
          active={tab === "notifications"}
          onClick={() => setTab("notifications")}
          icon={BellRing}
          label="Notificações"
        />
        <TabButton
          active={tab === "security"}
          onClick={() => setTab("security")}
          icon={Lock}
          label="Segurança"
        />
      </div>

      {tab === "integrations" && <IntegrationsTab />}
      {tab === "account" && <AccountTab />}
      {tab === "preferences" && <PreferencesTab isDark={isDark} setIsDark={setIsDark} />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}

/* ============================================================
   TOP ACTIONS
   ============================================================ */

interface TopActionsProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

function TopActions({ isDark, setIsDark }: TopActionsProps) {
  return (
    <div className="flex items-center gap-2 self-start">
      <button
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
      </button>
      <button
        onClick={() => setIsDark(!isDark)}
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <button
        className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        aria-label="Perfil"
      >
        <User className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ============================================================
   TABS
   ============================================================ */

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "text-blue-600 dark:text-blue-400"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {active && (
        <motion.span
          layoutId="settings-tab-underline"
          className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  );
}

/* ============================================================
   TAB: INTEGRAÇÕES
   ============================================================ */

function IntegrationsTab() {
  const [platforms, setPlatforms] = useState<Platform[]>(MOCK_PLATFORMS);
  const [filters, setFilters] = useState<PlatformFilters>(emptyPlatformFilters);
  const [modalPlatform, setModalPlatform] = useState<Platform | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterPlatforms(platforms, filters),
    [platforms, filters]
  );

  const kpis = useMemo(() => computeIntegrationKpis(platforms), [platforms]);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.category !== "all" ||
    filters.status !== "all";

  const clearFilters = () => setFilters(emptyPlatformFilters);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  /* --------- Mutações locais (simulação) --------- */
  const connectPlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "connected",
              connectedAt: new Date().toISOString(),
              lastSyncAt: new Date().toISOString(),
            }
          : p
      )
    );
    setModalPlatform((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: "connected",
            connectedAt: new Date().toISOString(),
            lastSyncAt: new Date().toISOString(),
          }
        : prev
    );
    showToast("Conexão simulada com sucesso. Esta é uma demonstração.");
  };

  const disconnectPlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "disconnected", connectedAt: undefined, lastSyncAt: undefined }
          : p
      )
    );
    setModalPlatform(null);
    showToast("Integração desconectada (demonstração).");
  };

  const syncPlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, lastSyncAt: new Date().toISOString() } : p
      )
    );
    setModalPlatform((prev) =>
      prev && prev.id === id ? { ...prev, lastSyncAt: new Date().toISOString() } : prev
    );
    showToast("Sincronização simulada (demonstração).");
  };

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Plug}
          tone="blue"
          label="Plataformas no catálogo"
          value={kpis.total.toString()}
          hint="Total de plataformas disponíveis"
        />
        <KpiCard
          icon={CheckCircle2}
          tone="green"
          label="Integrações conectadas"
          value={kpis.connected.toString()}
          hint="Conexões simuladas ativas"
        />
        <KpiCard
          icon={Clock}
          tone="amber"
          label="Aguardando configuração"
          value={kpis.pending.toString()}
          hint="Pendentes ou em desenvolvimento"
        />
        <KpiCard
          icon={RefreshCw}
          tone="slate"
          label="Última sincronização"
          value={kpis.lastSync ? formatRelative(kpis.lastSync) : "—"}
          hint={kpis.lastSync ? formatDateTime(kpis.lastSync) : "Sem dados"}
        />
      </div>

      {/* Descrição da seção */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-4 shadow-sm flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Conecte suas plataformas para organizar seus links, acompanhar o
          desempenho e centralizar os dados disponíveis no Scallora. As
          conexões nesta tela são <strong>simuladas</strong> enquanto o backend
          e o fluxo real de autorização não estiverem implementados.
        </p>
      </div>

      {/* Filtros */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Buscar plataforma"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: e.target.value as PlatformCategory | "all",
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value="all">Todas as categorias</option>
            <option value="marketplace">{CATEGORY_LABELS.marketplace}</option>
            <option value="afiliados">{CATEGORY_LABELS.afiliados}</option>
            <option value="rede">{CATEGORY_LABELS.rede}</option>
            <option value="ecommerce">{CATEGORY_LABELS.ecommerce}</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as IntegrationStatus | "all",
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value="all">Todas as plataformas</option>
            <option value="connected">Conectadas</option>
            <option value="disconnected">Desconectadas</option>
            <option value="pending">Aguardando configuração</option>
            <option value="developing">Em desenvolvimento</option>
            <option value="error">Com erro</option>
          </select>
        </div>
      </div>

      {/* Grid de plataformas */}
      {filtered.length === 0 ? (
        <EmptyState onClear={clearFilters} hasRecords={platforms.length > 0} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <IntegrationCard
              key={p.id}
              platform={p}
              onOpen={() => setModalPlatform(p)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalPlatform && (
          <IntegrationModal
            platform={modalPlatform}
            onClose={() => setModalPlatform(null)}
            onConnect={() => connectPlatform(modalPlatform.id)}
            onDisconnect={() => disconnectPlatform(modalPlatform.id)}
            onSync={() => syncPlatform(modalPlatform.id)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
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
    </>
  );
}

/* ============================================================
   CARD DE INTEGRAÇÃO
   ============================================================ */

interface IntegrationCardProps {
  platform: Platform;
  onOpen: () => void;
}

function IntegrationCard({ platform, onOpen }: IntegrationCardProps) {
  const Icon = platform.icon;
  const action = getActionLabel(platform.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-white"
          style={{ backgroundColor: platform.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {platform.name}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {CATEGORY_LABELS[platform.category]}
          </p>
        </div>
        <StatusBadge status={platform.status} />
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
        {platform.description}
      </p>

      {/* Capacidades em mini-pills */}
      <div className="flex flex-wrap gap-1 mb-4">
        {platform.capabilities
          .filter((c) => c.level === "available")
          .slice(0, 3)
          .map((c) => (
            <span
              key={c.key}
              className="inline-flex items-center text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded"
            >
              {CAPABILITY_LABELS[c.key]}
            </span>
          ))}
        {platform.capabilities.filter((c) => c.level === "available").length >
          3 && (
          <span className="inline-flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            +
            {platform.capabilities.filter((c) => c.level === "available")
              .length - 3}
          </span>
        )}
      </div>

      <button
        onClick={onOpen}
        className="mt-auto w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        {action.icon}
        {action.label}
      </button>
    </motion.div>
  );
}

function getActionLabel(status: IntegrationStatus) {
  switch (status) {
    case "connected":
      return {
        label: "Gerenciar conexão",
        icon: <SettingsIcon className="h-3.5 w-3.5" />,
      };
    case "disconnected":
    case "pending":
    case "error":
      return {
        label: "Conectar",
        icon: <Plug className="h-3.5 w-3.5" />,
      };
    case "developing":
      return {
        label: "Saiba mais",
        icon: <Info className="h-3.5 w-3.5" />,
      };
  }
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ============================================================
   MODAL DE INTEGRAÇÃO
   ============================================================ */

interface IntegrationModalProps {
  platform: Platform;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

function IntegrationModal({
  platform,
  onClose,
  onConnect,
  onDisconnect,
  onSync,
}: IntegrationModalProps) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const Icon = platform.icon;
  const isConnected = platform.status === "connected";
  const isDeveloping = platform.status === "developing";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 text-white"
            style={{ backgroundColor: platform.color }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {platform.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {CATEGORY_LABELS[platform.category]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-5">
          {/* Aviso de demonstração */}
          <div className="flex items-start gap-2 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-700 dark:text-amber-300">
              Esta é uma <strong>demonstração visual</strong>. Nenhuma conexão
              real é estabelecida. O fluxo definitivo usará OAuth ou o
              mecanismo oficial de autenticação da plataforma quando o backend
              Django estiver integrado.
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Status da conexão
            </span>
            <StatusBadge status={platform.status} />
          </div>

          {/* Datas (quando conectada) */}
          {isConnected && (
            <div className="grid grid-cols-2 gap-3">
              {platform.connectedAt && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Conectada em
                  </p>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatDateTime(platform.connectedAt)}
                  </p>
                </div>
              )}
              {platform.lastSyncAt && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Última sincronização
                  </p>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                    {formatRelative(platform.lastSyncAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recursos */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Recursos
            </h3>
            <ul className="space-y-2">
              {platform.capabilities.map((c) => (
                <li
                  key={c.key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {CAPABILITY_LABELS[c.key]}
                  </span>
                  <span
                    className={`font-medium ${CAPABILITY_LEVEL_STYLES[c.level]}`}
                  >
                    {CAPABILITY_LEVEL_LABELS[c.level]}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Permissões */}
          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
            <Shield className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p>
              Nenhuma senha será solicitada diretamente no Scallora. A conexão
              será feita pelo provedor oficial, e apenas os dados necessários
              para cada recurso serão acessados.
            </p>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isConnected ? (
              <>
                <button
                  onClick={onSync}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar agora
                </button>
                <button
                  onClick={() => setConfirmDisconnect(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors"
                >
                  Desconectar
                </button>
              </>
            ) : isDeveloping ? (
              <div className="w-full text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-3 text-center">
                Esta integração ainda está em desenvolvimento. Estará
                disponível em uma futura versão do Scallora.
              </div>
            ) : (
              <button
                onClick={onConnect}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Iniciar conexão (demo)
              </button>
            )}
          </div>
        </div>

        {/* Confirmação de desconexão */}
        <AnimatePresence>
          {confirmDisconnect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
              onClick={() => setConfirmDisconnect(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
              >
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Desconectar {platform.name}?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Esta é uma ação demonstrativa. A integração voltará ao estado
                  "Desconectada" na interface.
                </p>
                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => setConfirmDisconnect(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDisconnect(false);
                      onDisconnect();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                  >
                    Desconectar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

interface EmptyStateProps {
  hasRecords: boolean;
  onClear: () => void;
}

function EmptyState({ hasRecords, onClear }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-16 px-6 text-center">
      <div className="mx-auto p-3 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mb-4">
        <Link2 className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {hasRecords ? "Nenhum resultado" : "Sem plataformas"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
        {hasRecords
          ? "Ajuste os filtros para encontrar a plataforma que procura."
          : "Nenhuma plataforma disponível no catálogo."}
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
   KPI CARD
   ============================================================ */

type Tone = "blue" | "green" | "amber" | "slate";

const TONE_STYLES: Record<Tone, string> = {
  blue: "bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 dark:bg-green-500/15 text-green-600 dark:text-green-400",
  amber: "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  slate: "bg-slate-500/10 dark:bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  label: string;
  value: string;
  hint?: string;
}

function KpiCard({ icon: Icon, tone, label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${TONE_STYLES[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   TAB: CONTA E PERFIL
   ============================================================ */

function AccountTab() {
  const [prefs, setPrefs] = useState<AccountPreferences>({
    displayName: "Afiliado Demo",
    email: "demo@scallora.app",
  });
  const [toast, setToast] = useState<string | null>(null);

  const save = () => {
    setToast("Alterações salvas localmente (demonstração).");
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Conta e perfil
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Preferências básicas da sua conta.
          </p>
        </div>

        <Field label="Nome de exibição">
          <input
            type="text"
            value={prefs.displayName}
            onChange={(e) =>
              setPrefs({ ...prefs, displayName: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </Field>

        <Field label="E-mail">
          <input
            type="email"
            value={prefs.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-sm text-slate-500 dark:text-slate-500 cursor-not-allowed"
          />
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            O e-mail só poderá ser alterado após integração com o backend.
          </p>
        </Field>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   TAB: PREFERÊNCIAS
   ============================================================ */

interface PreferencesTabProps {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
}

function PreferencesTab({ isDark, setIsDark }: PreferencesTabProps) {
  const [prefs, setPrefs] = useState<GeneralPreferences>({
    currency: "BRL",
    dateFormat: "DD/MM/YYYY",
    compactDashboard: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  const save = () => {
    setToast("Preferências salvas localmente (demonstração).");
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Preferências
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ajuste como o Scallora exibe dados e informações.
          </p>
        </div>

        <Field label="Tema">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDark(false)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                !isDark
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Sun className="h-4 w-4" />
              Claro
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isDark
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Moon className="h-4 w-4" />
              Escuro
            </button>
          </div>
        </Field>

        <Field label="Moeda">
          <select
            value={prefs.currency}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                currency: e.target.value as GeneralPreferences["currency"],
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value="BRL">Real brasileiro (BRL)</option>
            <option value="USD">Dólar americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </Field>

        <Field label="Formato de data">
          <select
            value={prefs.dateFormat}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                dateFormat: e.target.value as GeneralPreferences["dateFormat"],
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
          >
            <option value="DD/MM/YYYY">DD/MM/AAAA</option>
            <option value="MM/DD/YYYY">MM/DD/AAAA</option>
            <option value="YYYY-MM-DD">AAAA-MM-DD</option>
          </select>
        </Field>

        <Field label="Exibição do dashboard">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.compactDashboard}
              onChange={(e) =>
                setPrefs({ ...prefs, compactDashboard: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/40 cursor-pointer"
            />
            Usar layout compacto
          </label>
        </Field>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Salvar preferências
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   TAB: NOTIFICAÇÕES
   ============================================================ */

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    newConversions: true,
    syncFailures: true,
    financialGoals: false,
    productUpdates: true,
  });
  const [toast, setToast] = useState<string | null>(null);

  const save = () => {
    setToast("Preferências salvas localmente (demonstração).");
    window.setTimeout(() => setToast(null), 2400);
  };

  const toggles: {
    key: keyof NotificationPreferences;
    label: string;
    hint: string;
  }[] = [
    {
      key: "newConversions",
      label: "Novas conversões",
      hint: "Avisos quando uma conversão for registrada.",
    },
    {
      key: "syncFailures",
      label: "Falhas de sincronização",
      hint: "Avisos quando uma integração falhar ao sincronizar.",
    },
    {
      key: "financialGoals",
      label: "Metas financeiras",
      hint: "Alertas quando você atingir (ou ficar perto) de uma meta.",
    },
    {
      key: "productUpdates",
      label: "Atualizações importantes",
      hint: "Novidades do Scallora, mudanças de recursos e manutenções.",
    },
  ];

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Notificações
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Escolha quais avisos deseja receber. Os disparos reais dependem do
            backend.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {toggles.map((t) => (
            <div
              key={t.key}
              className="py-3 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {t.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.hint}
                </p>
              </div>
              <Switch
                checked={prefs[t.key]}
                onChange={(v) => setPrefs({ ...prefs, [t.key]: v })}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Salvar preferências
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Switch({ checked, onChange }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked
          ? "bg-blue-600"
          : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ============================================================
   TAB: SEGURANÇA
   ============================================================ */

function SecurityTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Segurança
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Orientações e informações sobre autenticação, sessões e conexões
          externas.
        </p>

        <div className="flex items-start gap-2 text-xs rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5 mt-2">
          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-blue-700 dark:text-blue-300">
            O gerenciamento real de sessões, tokens e permissões será
            implementado no backend Django. Nesta versão, a página apresenta
            apenas informações e diretrizes.
          </p>
        </div>
      </div>

      <SecurityBlock
        icon={Lock}
        title="Autenticação"
        body="Nenhuma senha de plataforma externa é solicitada dentro do Scallora. As conexões usarão os fluxos oficiais de autorização (OAuth ou equivalente) quando disponíveis."
      />
      <SecurityBlock
        icon={Shield}
        title="Tokens e credenciais"
        body="Tokens de acesso ficarão armazenados com segurança no servidor. O frontend nunca armazenará credenciais sensíveis nem exibirá chaves secretas."
      />
      <SecurityBlock
        icon={AlertTriangle}
        title="Sessões ativas"
        body="A listagem e o encerramento de sessões ativas dependerão da implementação de autenticação no backend."
      />
    </div>
  );
}

interface SecurityBlockProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

function SecurityBlock({ icon: Icon, title, body }: SecurityBlockProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS DE FORM
   ============================================================ */

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}