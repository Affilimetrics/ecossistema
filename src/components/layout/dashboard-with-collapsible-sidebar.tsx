import { useState, useEffect, useCallback, createContext, useContext, Dispatch, SetStateAction, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, DollarSign, ShoppingCart, Tag, BarChart3, Users, ChevronDown, ChevronsRight, TrendingUp, Activity, Package, Bell, Settings, HelpCircle, LucideIcon, Flame, Radar, Target, Megaphone, X, Menu, MoreHorizontal, Store, RefreshCw, ArrowRight, ArrowLeft, Check, MessageCircle, Compass, ExternalLink, Plug, Calendar, Gauge } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion, AnimatePresence, Variants, animate, useMotionValue } from "framer-motion";
import { NotificationPopover } from "../ui/notification-popover";
import { UserNav } from "../ui/user-nav";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import FinancialThermometer from "../../pages/dashboard/financial-thermometer";

type ViewportMode = "mobile" | "tablet" | "desktop";
const getViewportMode = (width: number): ViewportMode => { if (width < 768) return "mobile"; if (width < 1024) return "tablet"; return "desktop"; };
const useViewportMode = (): ViewportMode => {
  const [mode, setMode] = useState<ViewportMode>(() => typeof window !== "undefined" ? getViewportMode(window.innerWidth) : "desktop");
  useEffect(() => { const handleResize = () => { const next = getViewportMode(window.innerWidth); setMode((prev) => (prev !== next ? next : prev)); }; window.addEventListener("resize", handleResize); return () => window.removeEventListener("resize", handleResize); }, []);
  return mode;
};

interface AnimatedCounterProps { value: number; duration?: number; decimals?: number; prefix?: string; suffix?: string; className?: string; }
export const AnimatedCounter = ({ value, duration = 1.2, decimals = 0, prefix = "", suffix = "", className = "" }: AnimatedCounterProps) => {
  const motionVal = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState("0");
  useEffect(() => {
    const controls = animate(motionVal, value, { duration, ease: "easeOut", onUpdate: (latest) => { setDisplayValue(latest.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })); } });
    return () => controls.stop();
  }, [value, duration, decimals, motionVal]);
  return <span className={`tabular-nums ${className}`}>{prefix}{displayValue}{suffix}</span>;
};

interface InteractiveTourStep {
  targetId: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
  ctaLabel?: string;
  ctaPath?: string;
}

const INTERACTIVE_TOUR_STEPS: InteractiveTourStep[] = [
  {
    targetId: "tour-settings",
    badge: "1 de 4 • Primeiro Passo",
    title: "Conecte seus Marketplaces",
    description: "Antes de iniciar suas coletas e divulgações, acesse Configurações para conectar suas contas da Amazon, Mercado Livre, Shopee, Magalu e TikTok Shop.",
    tip: "Clique no botão abaixo para ir direto à aba de Integrações.",
    ctaLabel: "Ir para Configurações",
    ctaPath: "/settings",
  },
  {
    targetId: "tour-navigation",
    badge: "2 de 4 • Navegação",
    title: "Seu Menu de Ferramentas",
    description: "Aqui você acessa todas as áreas do Scallora: Métricas, Central de Divulgação, Catálogo de Produtos, Produtos Em Alta, Coleta Geral, Análises e Remarketing.",
    tip: "No desktop, você pode recolher o menu clicando em 'Ocultar' no rodapé.",
  },
  {
    targetId: "tour-stats-grid",
    badge: "3 de 4 • Métricas Interativas",
    title: "Indicadores Clicáveis",
    description: "Estes cards mostram suas vendas, cliques em links, pedidos e produtos coletados. Clique em qualquer card para abrir seu gráfico detalhado!",
    tip: "Experimente clicar em 'Total de vendas' após concluir o tour.",
  },
  {
    targetId: "tour-roi-thermometer",
    badge: "4 de 4 • Saúde Financeira",
    title: "ROI Diário e Termômetro",
    description: "Compare seu retorno sobre investimento dia a dia por categoria e acompanhe a temperatura financeira da sua operação.",
    tip: "Precisa de ajuda depois? Clique em 'Ajuda e suporte' no menu a qualquer hora.",
  },
];

interface HelpGuideStep { title: string; subtitle: string; description: string; highlights: string[]; icon: LucideIcon; accentColor: string; }
const HELP_GUIDE_STEPS: HelpGuideStep[] = [
  { title: "Conecte seus Marketplaces", subtitle: "Guia Rápido • 1 de 4", description: "Comece acessando Configurações > Integrações para vincular suas contas de afiliado nos principais marketplaces.", highlights: ["Conecte Amazon, Mercado Livre, Shopee, Magazine Luiza e TikTok Shop", "Gerencie o status de sincronização de cada plataforma em um só lugar", "Mantenha seus links de afiliado sempre ativos e prontos para coleta"], icon: Plug, accentColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50" },
  { title: "Configure sua Coleta Geral", subtitle: "Guia Rápido • 2 de 4", description: "Na aba Coleta Geral, você escolhe o marketplace de origem e define quais categorias deseja minerar automaticamente.", highlights: ["Selecione plataformas como Amazon, Mercado Livre, Shopee e Magalu", "Crie categorias personalizadas com palavras-chave específicas", "Ative o modo Loop para coletas contínuas sem intervenção manual"], icon: Store, accentColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" },
  { title: "Recupere Vendas no Remarketing", subtitle: "Guia Rápido • 3 de 4", description: "Nem todo clique vira compra imediata. Acompanhe os visitantes que clicaram nos seus links e não finalizaram o pedido.", highlights: ["Filtre oportunidades por produto, link de afiliado ou período", "Adicione observações internas e altere o status de acompanhamento", "Monitore sua taxa de recuperação e receita recuperada"], icon: RefreshCw, accentColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50" },
  { title: "Analise e Exporte Resultados", subtitle: "Guia Rápido • 4 de 4", description: "Use as abas Métricas e Análises para acompanhar indicadores financeiros detalhados, criar fórmulas próprias e comparar o desempenho entre plataformas.", highlights: ["Acompanhe ROI, CPA, CPC, lucro líquido e crie métricas personalizadas na aba Métricas", "Compare Amazon, Mercado Livre, Shopee e Magalu lado a lado em Análises", "Exporte relatórios completos em Excel (.xlsx) com um clique"], icon: BarChart3, accentColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50" },
];

interface OptionProps { Icon: LucideIcon; title: string; selected: string; setSelected: Dispatch<SetStateAction<string>>; open: boolean; notifs?: number; path?: string; onClick?: () => void; onNavigateCallback?: () => void; tourId?: string; }
interface DashboardShellProps { children: React.ReactNode; isDark: boolean; setIsDark?: Dispatch<SetStateAction<boolean>>; userId?: string; }
interface ExampleContentProps { isDark: boolean; setIsDark: Dispatch<SetStateAction<boolean>>; }

const MOBILE_PRIMARY_NAV = [{ Icon: Home, title: "Início", path: "/dashboardv2" }, { Icon: Megaphone, title: "Divulgar", path: "/divulgacao" }, { Icon: ShoppingCart, title: "Produtos", path: "/products" }, { Icon: Flame, title: "Em Alta", path: "/hot-products" }];
const MOBILE_EXTRA_NAV = [{ Icon: Gauge, title: "Métricas", path: "/metrics" }, { Icon: Radar, title: "Coleta geral", path: "/coleta-geral" }, { Icon: BarChart3, title: "Análises", path: "/analytics" }, { Icon: Target, title: "Remarketing", path: "/remarketing" }, { Icon: Settings, title: "Configurações", path: "/settings" }, { Icon: HelpCircle, title: "Ajuda e suporte", path: undefined, action: "help" as const }];
const containerVars: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08, ease: "easeOut" } } };
const itemVars: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

interface HelpAndTourContextValue { openHelpModal: () => void; startInteractiveTour: () => void; }
const HelpAndTourContext = createContext<HelpAndTourContextValue>({ openHelpModal: () => {}, startInteractiveTour: () => {} });
export const useHelpAndTour = () => useContext(HelpAndTourContext);

export const DashboardShell = ({ children, isDark, userId = "default_user" }: DashboardShellProps) => {
  const navigate = useNavigate();
  const storageKey = `scallora_interactive_tour_seen_${userId}`;
  const [tourActive, setTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpStepIndex, setHelpStepIndex] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) { const timer = window.setTimeout(() => { setTourStepIndex(0); setTourActive(true); }, 650); return () => window.clearTimeout(timer); }
  }, [storageKey]);

  const measureTarget = useCallback(() => {
    if (!tourActive) return;
    const step = INTERACTIVE_TOUR_STEPS[tourStepIndex];
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.targetId}"]`) as HTMLElement | null;
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "nearest" }); setSpotlightRect(el.getBoundingClientRect()); }
    else setSpotlightRect(null);
  }, [tourActive, tourStepIndex]);

  useEffect(() => {
    if (!tourActive) return;
    measureTarget();
    const timer = window.setTimeout(measureTarget, 220);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", measureTarget); window.removeEventListener("scroll", measureTarget, true); };
  }, [tourActive, tourStepIndex, measureTarget]);

  const finishInteractiveTour = () => { localStorage.setItem(storageKey, "true"); setTourActive(false); setTourStepIndex(0); setSpotlightRect(null); };
  const startInteractiveTour = () => { setHelpModalOpen(false); setTourStepIndex(0); setTourActive(true); };
  const openHelpModal = () => { setHelpStepIndex(0); setHelpModalOpen(true); };

  const handleTourCta = (path: string) => {
    finishInteractiveTour();
    navigate(path);
  };

  const getTooltipPosition = (): React.CSSProperties => {
    if (!spotlightRect || typeof window === "undefined") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const cardWidth = Math.min(365, window.innerWidth - 32);
    const hasCta = Boolean(INTERACTIVE_TOUR_STEPS[tourStepIndex]?.ctaLabel);
    const cardHeight = hasCta ? 350 : 285;
    const gap = 16;

    if (spotlightRect.right + gap + cardWidth < window.innerWidth) {
      const top = Math.min(
        Math.max(20, spotlightRect.bottom - cardHeight),
        window.innerHeight - cardHeight - 20
      );
      return { top, left: spotlightRect.right + gap, width: cardWidth };
    }
    if (spotlightRect.bottom + gap + cardHeight < window.innerHeight) {
      const left = Math.min(Math.max(16, spotlightRect.left), window.innerWidth - cardWidth - 16);
      return { top: spotlightRect.bottom + gap, left, width: cardWidth };
    }
    if (spotlightRect.top - gap - cardHeight > 16) {
      const left = Math.min(Math.max(16, spotlightRect.left), window.innerWidth - cardWidth - 16);
      return { top: spotlightRect.top - gap - cardHeight, left, width: cardWidth };
    }
    return { top: 24, left: (window.innerWidth - cardWidth) / 2, width: cardWidth };
  };

  const currentTour = INTERACTIVE_TOUR_STEPS[tourStepIndex];
  const currentHelp = HELP_GUIDE_STEPS[helpStepIndex];
  const HelpIcon = currentHelp.icon;
  const helpProgress = ((helpStepIndex + 1) / HELP_GUIDE_STEPS.length) * 100;
  const supportWhatsappNumber = "5519999999999";
  const supportWhatsappDisplay = "+55 (19) 99999-9999";
  const supportWhatsappUrl = `https://wa.me/${supportWhatsappNumber}?text=${encodeURIComponent("Olá! Preciso de ajuda com a plataforma Scallora.")}`;

  return (
    <HelpAndTourContext.Provider value={{ openHelpModal, startInteractiveTour }}>
      <div className={`flex min-h-screen w-full ${isDark ? "dark" : ""}`}>
        <div className="flex flex-col lg:flex-row w-full min-w-0 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 pb-24 md:pb-0 transition-colors duration-300">
          <Sidebar />
          {children}
        </div>

        <AnimatePresence>
          {tourActive && currentTour && (
            <div className="fixed inset-0 z-50 pointer-events-auto">
              {spotlightRect ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, top: Math.max(4, spotlightRect.top - 6), left: Math.max(4, spotlightRect.left - 6), width: spotlightRect.width + 12, height: spotlightRect.height + 12 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 280, damping: 28 }} style={{ position: "fixed", boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.72)" }} className="rounded-xl ring-2 ring-blue-500 pointer-events-none" />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/75" />
              )}
              <motion.div key={tourStepIndex} initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.22, ease: "easeOut" }} style={{ position: "fixed", ...getTooltipPosition() }} className="z-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-5 shadow-2xl">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-semibold"><Compass className="h-3 w-3" />{currentTour.badge}</span>
                  <button type="button" onClick={finishInteractiveTour} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Pular tour</button>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{currentTour.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{currentTour.description}</p>
                <div className="mt-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-950/70 border border-gray-200/80 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400"><span className="font-semibold text-blue-600 dark:text-blue-400">Dica: </span>{currentTour.tip}</div>

                {currentTour.ctaLabel && currentTour.ctaPath && (
                  <button
                    type="button"
                    onClick={() => handleTourCta(currentTour.ctaPath!)}
                    className="mt-3 w-full h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>{currentTour.ctaLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5">
                    {INTERACTIVE_TOUR_STEPS.map((_, idx) => (<span key={idx} className={`h-1.5 rounded-full transition-all ${idx === tourStepIndex ? "w-5 bg-blue-600" : "w-1.5 bg-gray-300 dark:bg-gray-700"}`} />))}
                  </div>
                  <div className="flex items-center gap-2">
                    {tourStepIndex > 0 && (<button type="button" onClick={() => setTourStepIndex((prev) => prev - 1)} className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Voltar</button>)}
                    <button type="button" onClick={() => { if (tourStepIndex < INTERACTIVE_TOUR_STEPS.length - 1) setTourStepIndex((prev) => prev + 1); else finishInteractiveTour(); }} className="h-8 inline-flex items-center gap-1 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs">
                      <span>{tourStepIndex === INTERACTIVE_TOUR_STEPS.length - 1 ? "Concluir" : "Próximo"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {helpModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelpModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <motion.div initial={{ scale: 0.96, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 12 }} transition={{ duration: 0.25, ease: "easeOut" }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden">
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800"><motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${helpProgress}%` }} transition={{ duration: 0.3, ease: "easeOut" }} /></div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Central de Ajuda • {currentHelp.subtitle}</span></div>
                  <button type="button" onClick={() => setHelpModalOpen(false)} aria-label="Fechar ajuda" className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    <motion.div key={helpStepIndex} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className={`p-3 rounded-xl shrink-0 ${currentHelp.accentColor}`}><HelpIcon className="h-5 w-5" /></div>
                        <div><h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">{currentHelp.title}</h2><p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{currentHelp.description}</p></div>
                      </div>
                      <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-950/60 space-y-2.5">
                        {currentHelp.highlights.map((item, idx) => (<div key={idx} className="flex items-start gap-2.5 text-xs"><span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check className="h-2.5 w-2.5" /></span><span className="text-gray-700 dark:text-gray-300 leading-relaxed">{item}</span></div>))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex items-center gap-1.5">
                      {HELP_GUIDE_STEPS.map((_, idx) => (<button key={idx} type="button" aria-label={`Etapa ${idx + 1}`} onClick={() => setHelpStepIndex(idx)} className={`h-1.5 rounded-full transition-all ${idx === helpStepIndex ? "w-6 bg-blue-600" : "w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"}`} />))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setHelpStepIndex((prev) => Math.max(0, prev - 1))} disabled={helpStepIndex === 0} className="h-8 inline-flex items-center gap-1 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /><span>Anterior</span></button>
                      <button type="button" onClick={() => { if (helpStepIndex < HELP_GUIDE_STEPS.length - 1) setHelpStepIndex((prev) => prev + 1); else setHelpStepIndex(0); }} className="h-8 inline-flex items-center gap-1 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"><span>{helpStepIndex === HELP_GUIDE_STEPS.length - 1 ? "Voltar ao início" : "Próximo"}</span><ArrowRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0"><MessageCircle className="h-5 w-5" /></div>
                      <div><p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Suporte via WhatsApp</p><p className="text-[11px] text-gray-500 dark:text-gray-400">{supportWhatsappDisplay} • Seg a Sex, 9h às 18h</p></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={startInteractiveTour} className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Compass className="h-3.5 w-3.5 text-blue-500" /><span>Tour na tela</span></button>
                      <a href={supportWhatsappUrl} target="_blank" rel="noopener noreferrer" className="h-9 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"><span>Chamar no WhatsApp</span><ExternalLink className="h-3.5 w-3.5" /></a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HelpAndTourContext.Provider>
  );
};

interface DarkModeContextValue { isDark: boolean; setIsDark: Dispatch<SetStateAction<boolean>>; }
const DarkModeContext = createContext<DarkModeContextValue | null>(null);
export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", isDark); }, [isDark]);
  return <DarkModeContext.Provider value={{ isDark, setIsDark }}>{children}</DarkModeContext.Provider>;
};
export const useDarkMode = (): DarkModeContextValue => { const ctx = useContext(DarkModeContext); if (!ctx) throw new Error("useDarkMode precisa estar dentro de <DarkModeProvider>"); return ctx; };

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const viewportMode = useViewportMode();
  const { openHelpModal } = useHelpAndTour();
  const [open, setOpen] = useState(true);
  const [tabletDrawerOpen, setTabletDrawerOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  useEffect(() => { setTabletDrawerOpen(false); setMobileMoreOpen(false); }, [location.pathname, viewportMode]);

  const renderNavLinks = (isExpanded: boolean, onItemClick?: () => void) => (
    <>
      <div className="space-y-1 mb-8 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <Option Icon={Home} title="Dashboard" selected={selected} setSelected={setSelected} open={isExpanded} path="/dashboardv2" onNavigateCallback={onItemClick} />
        <Option Icon={Gauge} title="Métricas" selected={selected} setSelected={setSelected} open={isExpanded} path="/metrics" onNavigateCallback={onItemClick} />
        <Option Icon={Megaphone} title="Central de Divulgação" selected={selected} setSelected={setSelected} open={isExpanded} path="/divulgacao" onNavigateCallback={onItemClick} />
        <Option Icon={ShoppingCart} title="Produtos" selected={selected} setSelected={setSelected} open={isExpanded} path="/products" onNavigateCallback={onItemClick} />
        <Option Icon={Flame} title="Produtos Em Alta" selected={selected} setSelected={setSelected} open={isExpanded} path="/hot-products" onNavigateCallback={onItemClick} />
        <Option Icon={Radar} title="Coleta geral" selected={selected} setSelected={setSelected} open={isExpanded} path="/coleta-geral" onNavigateCallback={onItemClick} />
        <Option Icon={BarChart3} title="Análises" selected={selected} setSelected={setSelected} open={isExpanded} path="/analytics" onNavigateCallback={onItemClick} />
        <Option Icon={Target} title="Remarketing" selected={selected} setSelected={setSelected} open={isExpanded} path="/remarketing" onNavigateCallback={onItemClick} />
      </div>
      <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
        <div className={`px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide transition-opacity duration-200 ${isExpanded ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"}`}>Conta</div>
        <Option Icon={Settings} title="Configurações" selected={selected} setSelected={setSelected} open={isExpanded} path="/settings" tourId="tour-settings" onNavigateCallback={onItemClick} />
        <Option Icon={HelpCircle} title="Ajuda e suporte" selected={selected} setSelected={setSelected} open={isExpanded} onClick={openHelpModal} onNavigateCallback={onItemClick} />
      </div>
    </>
  );

  const isExtraRouteActive = MOBILE_EXTRA_NAV.some((item) => item.path && location.pathname === item.path);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {viewportMode === "desktop" && (
        <motion.nav key="nav-desktop" data-tour="tour-navigation" initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0, width: open ? 256 : 64 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} style={{ willChange: "width, transform, opacity" }} className="flex sticky top-0 h-screen shrink-0 flex-col border-r whitespace-nowrap overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm">
          <TitleSection open={open} />
          <div className="flex-1 flex flex-col min-h-0 pb-14">{renderNavLinks(open)}</div>
          <ToggleClose open={open} setOpen={setOpen} />
        </motion.nav>
      )}

      {viewportMode === "tablet" && (
        <motion.div key="nav-tablet" data-tour="tour-navigation" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="sticky top-0 z-30 w-full">
          <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs px-4 shadow-xs">
            <div className="flex items-center gap-3">
              <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setTabletDrawerOpen(true)} aria-label="Abrir menu de navegação" className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"><Menu className="h-5 w-5" /></motion.button>
              <div className="flex items-center gap-3 select-none"><Logo /><div className="leading-tight"><span className="block text-base font-bold tracking-wider text-emerald-700 dark:text-emerald-400">SCALLORA</span><span className="block text-xs text-teal-600 dark:text-teal-400">Plano Pro</span></div></div>
            </div>
          </header>
          <AnimatePresence>
            {tabletDrawerOpen && (
              <div className="fixed inset-0 z-50">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setTabletDrawerOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
                <motion.aside initial={{ x: -272 }} animate={{ x: 0 }} exit={{ x: -272 }} transition={{ type: "spring", stiffness: 320, damping: 32 }} className="fixed top-0 left-0 bottom-0 w-64 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 select-none"><Logo /><div><span className="block text-base font-bold tracking-wider text-emerald-700 dark:text-emerald-400 leading-tight">SCALLORA</span><span className="block text-xs text-teal-600 dark:text-teal-400">Plano Pro</span></div></div>
                    <button type="button" onClick={() => setTabletDrawerOpen(false)} aria-label="Fechar menu" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">{renderNavLinks(true, () => setTabletDrawerOpen(false))}</div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {viewportMode === "mobile" && (
        <motion.div key="nav-mobile" initial={{ opacity: 0, y: 64 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 64 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>
          <AnimatePresence>
            {mobileMoreOpen && (
              <div className="fixed inset-0 z-40">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMoreOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
                <motion.div initial={{ y: 36, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 36, opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 360, damping: 28 }} className="fixed bottom-22 left-4 right-4 z-50 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-2xl">
                  <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mais opções</span>
                    <button type="button" onClick={() => setMobileMoreOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {MOBILE_EXTRA_NAV.map((item) => {
                      const isActive = item.path && location.pathname === item.path;
                      return (
                        <button key={item.title} type="button" onClick={() => { setSelected(item.title); if (item.path) navigate(item.path); if ("action" in item && item.action === "help") openHelpModal(); setMobileMoreOpen(false); }} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                          <item.Icon className="h-4 w-4 shrink-0" /><span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <nav data-tour="tour-navigation" aria-label="Navegação mobile" className="fixed bottom-3 left-3 right-3 z-50 mx-auto max-w-md rounded-full border border-gray-200/90 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between gap-1">
              {MOBILE_PRIMARY_NAV.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.button key={item.path} layout transition={{ type: "spring", stiffness: 380, damping: 30 }} type="button" onClick={() => { setSelected(item.title); navigate(item.path); }} className={`relative flex items-center justify-center gap-2 h-11 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? "px-4 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-semibold" : "w-11 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                    <item.Icon className="h-5 w-5 shrink-0" />
                    {isActive && <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.18 }} className="text-xs whitespace-nowrap overflow-hidden">{item.title}</motion.span>}
                  </motion.button>
                );
              })}
              <motion.button data-tour="tour-settings" layout transition={{ type: "spring", stiffness: 380, damping: 30 }} type="button" onClick={() => setMobileMoreOpen((prev) => !prev)} aria-label="Mais opções do menu" className={`flex items-center justify-center gap-1.5 h-11 rounded-full transition-colors duration-200 focus:outline-none ${mobileMoreOpen || isExtraRouteActive ? "px-3.5 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-semibold" : "w-11 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                <MoreHorizontal className="h-5 w-5 shrink-0" />
                {(mobileMoreOpen || isExtraRouteActive) && <span className="text-xs">Mais</span>}
              </motion.button>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, path, onClick, onNavigateCallback, tourId }: OptionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSelected = path ? location.pathname === path : selected === title;
  const handleClick = () => { setSelected(title); if (path) navigate(path); onClick?.(); onNavigateCallback?.(); };
  return (
    <button type="button" data-tour={tourId} onClick={handleClick} className={`relative flex h-11 w-full items-center rounded-md transition-colors duration-200 focus:outline-none ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"}`}>
      {isSelected && <motion.div layoutId="sidebar-active-bg" className="absolute inset-0 bg-blue-50 dark:bg-blue-900/40 rounded-md shadow-sm border-l-2 border-blue-500" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
      <div className="relative z-10 grid h-full w-12 shrink-0 place-content-center"><Icon className="h-4 w-4" /></div>
      <span className={`relative z-10 text-sm font-medium transition-opacity duration-200 ${open ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"}`}>{title}</span>
      {notifs != null && notifs > 0 && open && (<span className="z-10 absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-xs text-white font-medium">{notifs}</span>)}
    </button>
  );
};

const TitleSection = ({ open }: { open: boolean }) => (
  <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4 select-none">
    <div className="flex items-center px-0.5 py-1.5">
      <div className="flex items-center gap-3">
        <Logo />
        <div className={`transition-opacity duration-200 ${open ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"}`}>
          <span className="block text-base font-bold tracking-wider text-emerald-700 dark:text-emerald-400 leading-tight">SCALLORA</span>
          <span className="block text-xs text-teal-600 dark:text-teal-400">Plano Pro</span>
        </div>
      </div>
    </div>
  </div>
);

const Logo = () => (
  <div className="grid size-12 shrink-0 place-content-center rounded-xl bg-emerald-50/70 dark:bg-slate-900 border border-emerald-200/70 dark:border-slate-800 shadow-xs">
    <svg width="36" height="36" viewBox="12 8 96 104" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Folha traseira esquerda */}
      <path d="M51 12C39 22 33 38 35 55C43 52 51 54 57 60C62 46 61 27 51 12Z" fill="#0B4F4A" />
      <path d="M50 24C49 36 49 46 51 56" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Folha traseira direita */}
      <path d="M77 18C62 24 53 39 53 56C60 55 68 58 73 64C81 51 84 33 77 18Z" fill="#327A54" />
      <path d="M74 28C69 40 66 50 64 59" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M68 41L62 36" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />

      {/* Folha principal esquerda */}
      <path d="M23 38C18 61 27 83 47 93C52 96 54 101 55 106C64 86 63 63 50 47C42 38 32 36 23 38Z" fill="#0A4A2E" />
      <path d="M29 49C41 64 49 82 54 102" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M41 66L28 62" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M47 80L34 77" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M45 73L49 62" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />

      {/* Folha principal direita */}
      <path d="M97 44C84 42 71 47 64 58C56 71 57 89 61 105C59 109 55 110 53 107" stroke="#0C5E4C" strokeWidth="4" strokeLinecap="round" />
      <path d="M97 44C81 42 66 50 61 65C57 78 59 93 61 106C65 98 71 94 79 91C96 84 103 63 97 44Z" fill="#236E52" />
      <path d="M97 44C91 63 79 79 61 106C65 98 71 94 79 91C96 84 103 63 97 44Z" fill="#0B4C4B" />
      <path d="M91 54C79 68 69 85 61 105" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M79 68L92 64" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M72 80L85 78" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M76 73L75 61" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M68 86L66 74" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </div>
);

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>> }) => (
  <button type="button" onClick={() => setOpen((prev) => !prev)} aria-label={open ? "Recolher menu lateral" : "Expandir menu lateral"} className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none z-10">
    <div className="flex items-center px-2 py-3">
      <div className="grid h-10 w-12 shrink-0 place-content-center"><ChevronsRight className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${open ? "rotate-180" : ""}`} /></div>
      <span className={`text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200 ${open ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"}`}>Ocultar</span>
    </div>
  </button>
);

export type DateRangePreset = "today" | "yesterday" | "7d" | "18d" | "month";

const DATE_RANGE_OPTIONS: Array<{ value: DateRangePreset; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "18d", label: "Últimos 18 dias" },
  { value: "month", label: "Este mês" },
];

const DateRangeFilter = ({ value, onChange }: { value: DateRangePreset; onChange: (v: DateRangePreset) => void }) => (
  <div className="relative inline-flex items-center">
    <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
    <select
      aria-label="Filtrar período do dashboard"
      value={value}
      onChange={(e) => onChange(e.target.value as DateRangePreset)}
      className="h-9 appearance-none pl-8 pr-7 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-200 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors cursor-pointer"
    >
      {DATE_RANGE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-400" />
  </div>
);

const CATEGORIES = ["Todas", "Eletrônicos", "Casa e Cozinha", "Moda", "Esportes", "Livros", "Brinquedos"] as const;
type Category = (typeof CATEGORIES)[number];
const categoryMultiplier: Record<Category, number> = { Todas: 1, Eletrônicos: 1.15, "Casa e Cozinha": 0.85, Moda: 0.72, Esportes: 0.6, Livros: 0.4, Brinquedos: 0.32 };

const CategoryFilter = ({ value, onChange }: { value: Category; onChange: (c: Category) => void }) => (
  <div className="flex items-center gap-2">
    <Tag className="h-3.5 w-3.5 text-gray-400" />
    <select aria-label="Filtrar por categoria" value={value} onChange={(e) => onChange(e.target.value as Category)} className="text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors cursor-pointer">
      {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
    </select>
  </div>
);

const baseRoiSeries = [42, 28, 55, 61, 74, 18, 66, 82, 35, 58, 71, 96, 63, 22, 40, 59, 118, 87];
const roiColor = "#06b6d4";

type ChartType = "vendas" | "afiliados" | "pedidos" | "produtos" | "linksCategoria";
const chartConfig: Record<ChartType, { title: string; subtitle: string; color: string; prefix: string; suffix: string }> = {
  vendas: { title: "Total de vendas", subtitle: "Receita no período", color: "#3b82f6", prefix: "$", suffix: "" },
  afiliados: { title: "Links Afiliados", subtitle: "Cliques no período", color: "#22c55e", prefix: "", suffix: "" },
  pedidos: { title: "Pedidos", subtitle: "Pedidos no período", color: "#a855f7", prefix: "", suffix: "" },
  produtos: { title: "Produtos Coletados", subtitle: "Coletas no período", color: "#f97316", prefix: "", suffix: "" },
  linksCategoria: { title: "Links por categoria", subtitle: "Desempenho no período", color: "#06b6d4", prefix: "", suffix: "" },
};

const baseSeriesValues: Record<ChartType, number[]> = {
  vendas: [820, 450, 680, 910, 1120, 280, 980, 1210, 380, 720, 850, 1380, 820, 310, 510, 750, 1720, 1290],
  afiliados: [45, 32, 58, 71, 92, 18, 78, 101, 28, 62, 85, 118, 72, 21, 41, 65, 142, 99],
  pedidos: [12, 8, 15, 22, 28, 5, 18, 31, 9, 16, 21, 35, 19, 7, 11, 17, 42, 29],
  produtos: [3, 1, 5, 8, 12, 0, 6, 14, 2, 4, 7, 18, 9, 1, 3, 5, 22, 13],
  linksCategoria: [50, 65, 45, 80, 95, 60, 75, 88, 55, 70, 82, 91, 68, 52, 73, 86, 99, 78],
};

function buildTimeSeries(
  preset: DateRangePreset,
  now: Date,
  values: number[],
  multiplier: number,
  decimals = 0
): { points: Array<{ label: string; fullDate: string; value: number }>; rangeLabel: string } {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const formatDayShort = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  const formatDayFull = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  if (preset === "today") {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const slots: Array<{ label: string; fullDate: string; value: number }> = [];
    const step = currentHour >= 12 ? 2 : 1;

    for (let h = 0; h <= currentHour; h += step) {
      const label = `${pad2(h)}:00`;
      const raw = values[h % values.length] ?? 0;
      const val = +(raw * multiplier).toFixed(decimals);
      slots.push({
        label,
        fullDate: `Hoje, ${formatDayShort(now)} · ${label}`,
        value: val,
      });
    }

    const nowLabel = `${pad2(currentHour)}:${pad2(currentMinute)}`;
    const liveJitter = 1 + ((currentMinute % 5) - 2) * 0.015;
    const liveRaw = (values[(currentHour + 1) % values.length] ?? 0) * liveJitter;
    const liveVal = +(liveRaw * multiplier).toFixed(decimals);

    if (slots.length === 0 || slots[slots.length - 1].label !== nowLabel) {
      slots.push({
        label: nowLabel,
        fullDate: `Agora (${nowLabel}) · ${formatDayFull(now)}`,
        value: liveVal,
      });
    }

    return {
      points: slots,
      rangeLabel: `Hoje (${formatDayShort(now)}) · Atualizado às ${nowLabel}`,
    };
  }

  if (preset === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const slots: Array<{ label: string; fullDate: string; value: number }> = [];
    for (let h = 0; h <= 22; h += 2) {
      const label = `${pad2(h)}:00`;
      const raw = values[(h + 3) % values.length] ?? 0;
      slots.push({
        label,
        fullDate: `Ontem, ${formatDayShort(yesterday)} · ${label}`,
        value: +(raw * multiplier * 0.94).toFixed(decimals),
      });
    }
    return {
      points: slots,
      rangeLabel: `Ontem (${formatDayFull(yesterday)})`,
    };
  }

  const totalDays =
    preset === "7d"
      ? 7
      : preset === "18d"
      ? 18
      : Math.max(1, now.getDate());

  const slots: Array<{ label: string; fullDate: string; value: number }> = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const idx = (values.length - 1 - (i % values.length) + values.length) % values.length;
    const isTodayPoint = i === 0;
    const raw = values[idx] ?? 0;
    slots.push({
      label: isTodayPoint ? "Hoje" : formatDayShort(d),
      fullDate: isTodayPoint ? `Hoje (${formatDayFull(d)})` : formatDayFull(d),
      value: +(raw * multiplier).toFixed(decimals),
    });
  }

  const rangeLabel =
    preset === "7d"
      ? "Últimos 7 dias"
      : preset === "18d"
      ? "Últimos 18 dias"
      : `Este mês (${now.toLocaleDateString("pt-BR", { month: "long" })})`;

  return { points: slots, rangeLabel };
}

interface TooltipProps { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string; payload?: { fullDate?: string } }>; }
const ROITooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const positive = entry.value >= 0;
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[155px]">
      {entry.payload?.fullDate && (
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">{entry.payload.fullDate}</p>
      )}
      <div className="flex items-center gap-2 text-sm"><div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} /><span className="text-gray-500 dark:text-gray-400">ROI:</span><span className={`font-semibold ${positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{positive ? "+" : ""}{entry.value.toFixed(1)}%</span></div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">(receita − investimento) ÷ investimento</p>
    </div>
  );
};

interface GenericChartTooltipProps extends TooltipProps { label: string; prefix?: string; suffix?: string; }
const GenericChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }: GenericChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[135px]">
      {entry.payload?.fullDate && (
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">{entry.payload.fullDate}</p>
      )}
      <div className="flex items-center gap-2 text-sm"><div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} /><span className="text-gray-500 dark:text-gray-400">{label}:</span><span className="font-semibold text-gray-900 dark:text-gray-100">{prefix}{entry.value.toFixed(0)}{suffix}</span></div>
    </div>
  );
};

const ROIChart = ({ dateRange, now }: { dateRange: DateRangePreset; now: Date }) => {
  const [category, setCategory] = useState<Category>("Todas");
  const multiplier = categoryMultiplier[category];

  const { points, rangeLabel } = useMemo(
    () => buildTimeSeries(dateRange, now, baseRoiSeries, multiplier, 1),
    [dateRange, now, multiplier]
  );

  const avgRoi = points.reduce((s, d) => s + d.value, 0) / (points.length || 1);
  const maxRoi = Math.max(...points.map((d) => d.value));
  const minRoi = Math.min(...points.map((d) => d.value));

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 pt-6 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">ROI — Retorno sobre Investimento</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rangeLabel} · {category}</p>
        </div>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>
      <div className="px-2.5 py-6 flex-1 min-h-0">
        <div className="h-full w-full min-h-[288px] outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_*]:outline-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <LineChart data={points} margin={{ top: 20, right: 20, left: 5, bottom: 20 }}>
              <defs>
                <filter id="roiLineShadow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${roiColor}60`} /></filter>
                <filter id="roiDotShadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" /></filter>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} tickMargin={10} tickCount={6} tickFormatter={(value) => `${value}%`} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={0.5} strokeDasharray="2 6" strokeOpacity={0.25} />
              <RechartsTooltip content={<ROITooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }} />
              <Line type="monotone" dataKey="value" stroke={roiColor} strokeWidth={2} filter="url(#roiLineShadow)" dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" activeDot={{ r: 6, fill: roiColor, stroke: "transparent", strokeWidth: 0, filter: "url(#roiDotShadow)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="px-6 pb-6 shrink-0">
        <div className="grid grid-cols-3 gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
          <div><p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">ROI médio</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{avgRoi.toFixed(1)}%</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Melhor momento</p><p className="text-sm font-semibold text-green-600 dark:text-green-400">+{maxRoi.toFixed(1)}%</p></div>
          <div><p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Menor índice</p><p className="text-sm font-semibold text-red-600 dark:text-red-400">{minRoi.toFixed(1)}%</p></div>
        </div>
      </div>
    </div>
  );
};

const DynamicChart = ({ type, dateRange, now, onClose }: { type: ChartType; dateRange: DateRangePreset; now: Date; onClose: () => void }) => {
  const config = chartConfig[type];
  const [category, setCategory] = useState<Category>("Todas");

  const { points, rangeLabel } = useMemo(
    () => buildTimeSeries(dateRange, now, baseSeriesValues[type], categoryMultiplier[category], 2),
    [dateRange, now, type, category]
  );

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="px-6 pt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{config.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rangeLabel} · {category}</p>
        </div>
        <div className="flex items-center gap-2">
          <CategoryFilter value={category} onChange={setCategory} />
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none" aria-label="Fechar gráfico"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <div className="px-2.5 py-6">
        <div className="h-80 w-full outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_*]:outline-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <LineChart data={points} margin={{ top: 20, right: 20, left: 5, bottom: 20 }}>
              <defs>
                <filter id={`lineShadow-${type}`} x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${config.color}60`} /></filter>
                <filter id={`dotShadow-${type}`} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" /></filter>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor" }} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor" }} tickMargin={10} tickCount={6} tickFormatter={(value) => `${config.prefix}${value}${config.suffix}`} />
              <RechartsTooltip content={<GenericChartTooltip label={config.title} prefix={config.prefix} suffix={config.suffix} />} cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }} />
              <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} filter={`url(#lineShadow-${type})`} dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" activeDot={{ r: 6, fill: config.color, stroke: "transparent", strokeWidth: 0, filter: `url(#dotShadow-${type})` }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ dateRange, now }: { dateRange: DateRangePreset; now: Date }) => {
  const [category, setCategory] = useState<Category>("Todas");
  const config = chartConfig.linksCategoria;

  const { points, rangeLabel } = useMemo(
    () => buildTimeSeries(dateRange, now, baseSeriesValues.linksCategoria, categoryMultiplier[category], 0),
    [dateRange, now, category]
  );

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 pt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Links por categoria</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rangeLabel} · {category}</p>
        </div>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>
      <div className="px-2.5 py-6 flex-1">
        <div className="h-72 w-full outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_*]:outline-none" tabIndex={-1}>
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <LineChart data={points} margin={{ top: 20, right: 20, left: 5, bottom: 20 }}>
              <defs>
                <filter id="lineShadow-metric-card" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${config.color}60`} /></filter>
                <filter id="dotShadow-metric-card" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" /></filter>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} tickMargin={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor" }} tickMargin={10} tickCount={6} />
              <RechartsTooltip content={<GenericChartTooltip label={config.title} />} cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }} />
              <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} filter="url(#lineShadow-metric-card)" dot={false} isAnimationActive animationDuration={900} animationEasing="ease-out" activeDot={{ r: 6, fill: config.color, stroke: "transparent", strokeWidth: 0, filter: "url(#dotShadow-metric-card)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const statsCardsByRange: Record<DateRangePreset, Array<{ key: ChartType; icon: LucideIcon; title: string; value: string; change: string; iconColor: string; ringColor: string; activeBg: string }>> = {
  today: [
    { key: "vendas", icon: DollarSign, title: "Total de vendas", value: "$1,420", change: "+18% em relação a ontem no mesmo horário", iconColor: "text-blue-500", ringColor: "ring-blue-500", activeBg: "bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600" },
    { key: "afiliados", icon: Users, title: "Links Afiliados", value: "94", change: "+9% em relação a ontem", iconColor: "text-emerald-500", ringColor: "ring-emerald-500", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600" },
    { key: "pedidos", icon: ShoppingCart, title: "Pedidos", value: "27", change: "+12% em relação a ontem", iconColor: "text-purple-500", ringColor: "ring-purple-500", activeBg: "bg-purple-50/70 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600" },
    { key: "produtos", icon: Package, title: "Produtos Coletados", value: "14", change: "+4 coletados hoje", iconColor: "text-amber-500", ringColor: "ring-amber-500", activeBg: "bg-amber-50/70 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" },
  ],
  yesterday: [
    { key: "vendas", icon: DollarSign, title: "Total de vendas", value: "$1,890", change: "+6% em relação ao dia anterior", iconColor: "text-blue-500", ringColor: "ring-blue-500", activeBg: "bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600" },
    { key: "afiliados", icon: Users, title: "Links Afiliados", value: "112", change: "+4% em relação ao dia anterior", iconColor: "text-emerald-500", ringColor: "ring-emerald-500", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600" },
    { key: "pedidos", icon: ShoppingCart, title: "Pedidos", value: "34", change: "+7% em relação ao dia anterior", iconColor: "text-purple-500", ringColor: "ring-purple-500", activeBg: "bg-purple-50/70 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600" },
    { key: "produtos", icon: Package, title: "Produtos Coletados", value: "19", change: "+2 em relação ao dia anterior", iconColor: "text-amber-500", ringColor: "ring-amber-500", activeBg: "bg-amber-50/70 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" },
  ],
  "7d": [
    { key: "vendas", icon: DollarSign, title: "Total de vendas", value: "$9,840", change: "+14% em relação aos 7 dias anteriores", iconColor: "text-blue-500", ringColor: "ring-blue-500", activeBg: "bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600" },
    { key: "afiliados", icon: Users, title: "Links Afiliados", value: "618", change: "+8% em relação aos 7 dias anteriores", iconColor: "text-emerald-500", ringColor: "ring-emerald-500", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600" },
    { key: "pedidos", icon: ShoppingCart, title: "Pedidos", value: "214", change: "+11% em relação aos 7 dias anteriores", iconColor: "text-purple-500", ringColor: "ring-purple-500", activeBg: "bg-purple-50/70 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600" },
    { key: "produtos", icon: Package, title: "Produtos Coletados", value: "52", change: "+9 novos nesta semana", iconColor: "text-amber-500", ringColor: "ring-amber-500", activeBg: "bg-amber-50/70 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" },
  ],
  "18d": [
    { key: "vendas", icon: DollarSign, title: "Total de vendas", value: "$15,280", change: "+12% em relação ao período anterior", iconColor: "text-blue-500", ringColor: "ring-blue-500", activeBg: "bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600" },
    { key: "afiliados", icon: Users, title: "Links Afiliados", value: "1,174", change: "+5% em relação ao período anterior", iconColor: "text-emerald-500", ringColor: "ring-emerald-500", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600" },
    { key: "pedidos", icon: ShoppingCart, title: "Pedidos", value: "345", change: "+8% em relação ao período anterior", iconColor: "text-purple-500", ringColor: "ring-purple-500", activeBg: "bg-purple-50/70 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600" },
    { key: "produtos", icon: Package, title: "Produtos Coletados", value: "89", change: "+15 no período", iconColor: "text-amber-500", ringColor: "ring-amber-500", activeBg: "bg-amber-50/70 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" },
  ],
  month: [
    { key: "vendas", icon: DollarSign, title: "Total de vendas", value: "$24,567", change: "+12% em relação ao mês passado", iconColor: "text-blue-500", ringColor: "ring-blue-500", activeBg: "bg-blue-50/70 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600" },
    { key: "afiliados", icon: Users, title: "Links Afiliados", value: "1,234", change: "+5% em relação ao mês passado", iconColor: "text-emerald-500", ringColor: "ring-emerald-500", activeBg: "bg-emerald-50/70 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600" },
    { key: "pedidos", icon: ShoppingCart, title: "Pedidos", value: "456", change: "+8% em relação ao mês passado", iconColor: "text-purple-500", ringColor: "ring-purple-500", activeBg: "bg-purple-50/70 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600" },
    { key: "produtos", icon: Package, title: "Produtos Coletados", value: "134", change: "+21 neste mês", iconColor: "text-amber-500", ringColor: "ring-amber-500", activeBg: "bg-amber-50/70 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600" },
  ],
};

type ActivityColor = "green" | "blue" | "purple" | "orange" | "red";
const ACTIVITY_STYLES: Record<ActivityColor, { bg: string; text: string }> = {
  green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400" },
  red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400" },
};
const RECENT_ACTIVITIES: Array<{ icon: LucideIcon; title: string; desc: string; time: string; color: ActivityColor }> = [
  { icon: DollarSign, title: "Nova venda registrada", desc: "Pedido #1234 concluído", time: "há 2 min", color: "green" },
  { icon: Users, title: "Novo usuário registrado", desc: "john.doe@example.com entrou", time: "há 5 min", color: "blue" },
  { icon: Package, title: "Produto atualizado", desc: "Estoque do iPhone 15 Pro atualizado", time: "há 10 min", color: "purple" },
  { icon: Activity, title: "Manutenção do sistema", desc: "Backup programado concluído", time: "há 1 hora", color: "orange" },
  { icon: Bell, title: "Nova notificação", desc: "Resultados da campanha de marketing", time: "há 2 horas", color: "red" },
];
const topProducts = [{ name: "iPhone 15 Pro", price: 1299 }, { name: "MacBook Air M2", price: 1099 }, { name: "AirPods Pro", price: 249 }, { name: "iPad Air", price: 599 }];

export const ExampleContent = ({ isDark, setIsDark }: ExampleContentProps) => {
  const [selectedCard, setSelectedCard] = useState<ChartType | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>("today");
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (dateRange !== "today") return;
    setNow(new Date());
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => window.clearInterval(interval);
  }, [dateRange]);

  const handleDateRangeChange = (next: DateRangePreset) => {
    setDateRange(next);
    setNow(new Date());
  };

  const activeStatsCards = statsCardsByRange[dateRange];

  return (
    <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-wrap items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Bem-vindo de volta</p>
        </div>
        <div data-tour="tour-header-actions" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <DateRangeFilter value={dateRange} onChange={handleDateRangeChange} />
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      <motion.div data-tour="tour-stats-grid" variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {activeStatsCards.map((card) => {
          const isActive = selectedCard === card.key;
          return (
            <motion.button key={card.key} type="button" variants={itemVars} whileHover={{ y: -2, transition: { duration: 0.15 } }} onClick={() => setSelectedCard(isActive ? null : card.key)} className={`text-left p-4 rounded-md border bg-white dark:bg-gray-900 shadow-xs transition-all duration-200 cursor-pointer focus:outline-none flex flex-col justify-between ${isActive ? `${card.activeBg} shadow-sm ring-1 ${card.ringColor}` : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium min-w-0"><card.icon className={`h-4 w-4 shrink-0 ${card.iconColor}`} /><span className="truncate">{card.title}</span></div>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 truncate">{isActive ? "✓ Gráfico aberto abaixo" : card.change}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {selectedCard && (<div className="mb-6"><DynamicChart type={selectedCard} dateRange={dateRange} now={now} onClose={() => setSelectedCard(null)} /></div>)}

      <motion.div data-tour="tour-roi-thermometer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><ROIChart dateRange={dateRange} now={now} /></div>
        <div className="lg:col-span-1"><FinancialThermometer isDark={isDark} setIsDark={setIsDark} /></div>
      </motion.div>

      <div className="mb-6"><MetricCard dateRange={dateRange} now={now} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-xs h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Atividade recente</h3>
              <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Ver tudo</button>
            </div>
            <div className="space-y-3">
              {RECENT_ACTIVITIES.map((activity) => {
                const style = ACTIVITY_STYLES[activity.color];
                return (
                  <div key={activity.title} className="flex items-center space-x-3 p-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-md ${style.bg}`}><activity.icon className={`h-4 w-4 ${style.text}`} /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{activity.title}</p><p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{activity.desc}</p></div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">{activity.time}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Estatísticas rápidas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-gray-600 dark:text-gray-400">Taxa de conversão</span><span className="text-xs font-medium text-gray-900 dark:text-gray-100">3.2%</span></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "32%" }} /></div>
              <div className="flex justify-between items-center"><span className="text-xs text-gray-600 dark:text-gray-400">Taxa de rejeição</span><span className="text-xs font-medium text-gray-900 dark:text-gray-100">45%</span></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: "45%" }} /></div>
              <div className="flex justify-between items-center"><span className="text-xs text-gray-600 dark:text-gray-400">Visualizações de página</span><span className="text-xs font-medium text-gray-900 dark:text-gray-100">8.7k</span></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: "87%" }} /></div>
            </div>
          </div>
          <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Principais produtos</h3>
            <div className="space-y-2.5">
              {topProducts.map((product) => (<div key={product.name} className="flex items-center justify-between py-1"><span className="text-xs text-gray-600 dark:text-gray-400">{product.name}</span><span className="text-xs font-medium text-gray-900 dark:text-gray-100">${product.price}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};