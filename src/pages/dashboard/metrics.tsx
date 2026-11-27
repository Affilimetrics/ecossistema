import { useMemo, useState, Dispatch, SetStateAction } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Target,
  Wallet,
  PackageCheck,
  PiggyBank,
  CircleDollarSign,
  Link2,
  MousePointerClick,
  UserCheck,
  MousePointer,
  RotateCcw,
  SlidersHorizontal,
  Calculator,
  Calendar,
  ChevronDown,
  LayoutGrid,
  LineChart as LineChartIcon,
  LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";
import {
  STANDARD_METRICS,
  evaluateFormula,
  formatFormulaDisplay,
  formatMetricValue,
  type MetricsDataPoint,
  type MetricsInput,
  type StandardMetricId,
} from "../../lib/metricsFormulas";
import {
  loadCustomSectionConfig,
  resetCustomSectionConfig,
  saveCustomSectionConfig,
  type CustomSectionConfig,
} from "../../lib/metricsStorage";
import {
  CustomSectionModal,
  MetricsGrid,
  type MetricChartPoint,
  type MetricDisplayItem,
  type MetricsLayoutMode,
} from "../../components/layout/metrics/MetricsComponents";

interface MetricsProps {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

type PeriodOption = "7d" | "14d" | "30d";

const PERIOD_DAYS: Record<PeriodOption, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
};

const MOCK_METRICS_INPUT: MetricsInput = {
  valorInvestido: 4850.0,
  faturamentoBruto: 18420.5,
  produtosVendidos: 312,
  linksAtivos: 48,
  cliquesTotais: 14680,
  checkouts: 1190,
  visitantes: 11240,
  conversoes: 298,
  reembolsos: 14,
};

// Curva diária relativa para gerar a evolução histórica de cada dia do período
const DAILY_PROFILES = [
  { inv: 0.78, fat: 0.65, prod: 0.66, links: 0.85, clk: 0.72, chk: 0.68, vis: 0.74, conv: 0.64, reemb: 1.15 },
  { inv: 0.82, fat: 0.71, prod: 0.72, links: 0.88, clk: 0.77, chk: 0.73, vis: 0.79, conv: 0.71, reemb: 1.05 },
  { inv: 0.76, fat: 0.69, prod: 0.70, links: 0.88, clk: 0.74, chk: 0.72, vis: 0.75, conv: 0.70, reemb: 0.90 },
  { inv: 0.88, fat: 0.82, prod: 0.81, links: 0.90, clk: 0.85, chk: 0.83, vis: 0.84, conv: 0.82, reemb: 1.10 },
  { inv: 0.92, fat: 0.89, prod: 0.88, links: 0.92, clk: 0.90, chk: 0.89, vis: 0.89, conv: 0.88, reemb: 0.95 },
  { inv: 0.85, fat: 0.79, prod: 0.80, links: 0.92, clk: 0.82, chk: 0.80, vis: 0.83, conv: 0.78, reemb: 1.20 },
  { inv: 0.94, fat: 0.92, prod: 0.91, links: 0.94, clk: 0.93, chk: 0.91, vis: 0.91, conv: 0.92, reemb: 0.85 },
  { inv: 0.96, fat: 0.96, prod: 0.95, links: 0.96, clk: 0.97, chk: 0.96, vis: 0.95, conv: 0.95, reemb: 0.90 },
  { inv: 0.90, fat: 0.88, prod: 0.89, links: 0.96, clk: 0.91, chk: 0.90, vis: 0.90, conv: 0.89, reemb: 1.00 },
  { inv: 1.02, fat: 1.05, prod: 1.04, links: 0.98, clk: 1.03, chk: 1.04, vis: 1.01, conv: 1.05, reemb: 0.88 },
  { inv: 1.05, fat: 1.11, prod: 1.09, links: 0.98, clk: 1.07, chk: 1.09, vis: 1.06, conv: 1.10, reemb: 0.82 },
  { inv: 0.98, fat: 1.02, prod: 1.01, links: 1.00, clk: 1.01, chk: 1.02, vis: 1.00, conv: 1.02, reemb: 0.92 },
  { inv: 1.08, fat: 1.16, prod: 1.15, links: 1.00, clk: 1.12, chk: 1.14, vis: 1.10, conv: 1.15, reemb: 0.80 },
  { inv: 1.10, fat: 1.21, prod: 1.20, links: 1.00, clk: 1.16, chk: 1.19, vis: 1.14, conv: 1.20, reemb: 0.78 },
] as const;

/**
 * Ponto único de leitura dos valores-base consolidados do período.
 * Pronto para ser substituído por chamada autenticada ao backend Django.
 */
export function getMetricsInput(): MetricsInput {
  return { ...MOCK_METRICS_INPUT };
}

/**
 * Série temporal diária para alimentar os gráficos de todas as métricas (padrão e personalizadas).
 */
export function getMetricsTimeSeries(days: number): MetricsDataPoint[] {
  const base = getMetricsInput();
  const today = new Date();
  const points: MetricsDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const profile =
      DAILY_PROFILES[(DAILY_PROFILES.length - 1 - (i % DAILY_PROFILES.length) + DAILY_PROFILES.length) % DAILY_PROFILES.length];

    const dailyInput: MetricsInput = {
      valorInvestido: +(base.valorInvestido / days * profile.inv).toFixed(2),
      faturamentoBruto: +(base.faturamentoBruto / days * profile.fat).toFixed(2),
      produtosVendidos: Math.max(1, Math.round((base.produtosVendidos / days) * profile.prod)),
      linksAtivos: Math.max(1, Math.round(base.linksAtivos * profile.links)),
      cliquesTotais: Math.max(1, Math.round((base.cliquesTotais / days) * profile.clk)),
      checkouts: Math.max(1, Math.round((base.checkouts / days) * profile.chk)),
      visitantes: Math.max(1, Math.round((base.visitantes / days) * profile.vis)),
      conversoes: Math.max(1, Math.round((base.conversoes / days) * profile.conv)),
      reembolsos: Math.max(0, Math.round((base.reembolsos / days) * profile.reemb)),
    };

    points.push({
      dateLabel:
        i === 0
          ? "Hoje"
          : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      fullDate: d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      input: dailyInput,
    });
  }

  return points;
}

const STANDARD_METRIC_META: Record<
  StandardMetricId,
  { icon: LucideIcon; iconColorClass: string }
> = {
  roi: { icon: TrendingUp, iconColorClass: "text-emerald-500" },
  taxaCheckout: { icon: ShoppingCart, iconColorClass: "text-blue-500" },
  taxaConversao: { icon: Target, iconColorClass: "text-purple-500" },
  valorInvestido: { icon: Wallet, iconColorClass: "text-amber-500" },
  produtosVendidos: { icon: PackageCheck, iconColorClass: "text-cyan-500" },
  lucroLiquido: { icon: PiggyBank, iconColorClass: "text-emerald-500" },
  faturamentoBruto: { icon: CircleDollarSign, iconColorClass: "text-blue-500" },
  linksAtivos: { icon: Link2, iconColorClass: "text-indigo-500" },
  cpc: { icon: MousePointerClick, iconColorClass: "text-orange-500" },
  cpa: { icon: UserCheck, iconColorClass: "text-rose-500" },
  cliquesTotais: { icon: MousePointer, iconColorClass: "text-sky-500" },
  taxaReembolso: { icon: RotateCcw, iconColorClass: "text-red-500" },
};

export function Metrics({ isDark }: MetricsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [period, setPeriod] = useState<PeriodOption>("14d");
  const [layoutMode, setLayoutMode] = useState<MetricsLayoutMode>("charts-2col");

  const metricsInput = useMemo(() => getMetricsInput(), []);
  const timeSeries = useMemo(
    () => getMetricsTimeSeries(PERIOD_DAYS[period]),
    [period]
  );

  const [customConfig, setCustomConfig] = useState<CustomSectionConfig>(() =>
    loadCustomSectionConfig()
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);

  const standardDisplayItems = useMemo<MetricDisplayItem[]>(() => {
    return STANDARD_METRICS.map((def) => {
      const rawValue = def.compute(metricsInput);
      const meta = STANDARD_METRIC_META[def.id];
      const series: MetricChartPoint[] = timeSeries.map((pt) => ({
        dateLabel: pt.dateLabel,
        fullDate: pt.fullDate,
        value: def.compute(pt.input),
      }));

      return {
        id: def.id,
        title: def.title,
        formattedValue: formatMetricValue(rawValue, def.format),
        rawValue,
        shortDescription: def.shortDescription,
        formulaLabel: def.formulaLabel,
        format: def.format,
        chartColor: def.chartColor,
        series,
        icon: meta.icon,
        iconColorClass: meta.iconColorClass,
        semanticColor: def.semanticColor,
      };
    });
  }, [metricsInput, timeSeries]);

  const standardById = useMemo(() => {
    const map = new Map<StandardMetricId, MetricDisplayItem>();
    for (const item of standardDisplayItems) {
      map.set(item.id as StandardMetricId, item);
    }
    return map;
  }, [standardDisplayItems]);

  const customSectionItems = useMemo<MetricDisplayItem[]>(() => {
    const selectedStandards = customConfig.selectedStandardIds
      .map((id) => standardById.get(id))
      .filter((item): item is MetricDisplayItem => Boolean(item));

    const userCustomItems: MetricDisplayItem[] = customConfig.customMetrics.map(
      (custom) => {
        const result = evaluateFormula(custom.formula, metricsInput);
        const rawValue = result.ok ? result.value : null;

        const series: MetricChartPoint[] = timeSeries.map((pt) => {
          const dayEval = evaluateFormula(custom.formula, pt.input);
          return {
            dateLabel: pt.dateLabel,
            fullDate: pt.fullDate,
            value: dayEval.ok ? dayEval.value : null,
          };
        });

        return {
          id: custom.id,
          title: custom.title,
          formattedValue: formatMetricValue(rawValue, custom.format),
          rawValue,
          shortDescription:
            custom.description ||
            `Fórmula: ${formatFormulaDisplay(custom.formula)}`,
          formulaLabel: formatFormulaDisplay(custom.formula),
          format: custom.format,
          chartColor: "#3b82f6",
          series,
          icon: Calculator,
          iconColorClass: "text-blue-500",
          isCustom: true,
        };
      }
    );

    return [...selectedStandards, ...userCustomItems];
  }, [customConfig, standardById, metricsInput, timeSeries]);

  const handleSaveConfig = (nextConfig: CustomSectionConfig) => {
    setCustomConfig(nextConfig);
    saveCustomSectionConfig(nextConfig);
  };

  const handleResetDefault = (): CustomSectionConfig => {
    const reset = resetCustomSectionConfig();
    setCustomConfig(reset);
    return reset;
  };

  const handleOpenCustomizeModal = (customIdToEdit: string | null = null) => {
    setEditingCustomId(customIdToEdit);
    setModalOpen(true);
  };

  const handleDeleteCustomMetric = (customId: string) => {
    const nextConfig: CustomSectionConfig = {
      ...customConfig,
      customMetrics: customConfig.customMetrics.filter((m) => m.id !== customId),
    };
    handleSaveConfig(nextConfig);
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: "easeOut" }}
      className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-x-hidden overflow-y-auto"
    >
      {/* Cabeçalho da página */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
        className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Métricas
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gráficos e indicadores financeiros da sua operação de afiliados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-0.5">
          {/* Seletor de período dos gráficos */}
          <div className="relative inline-flex items-center">
            <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <select
              aria-label="Filtrar período dos gráficos"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodOption)}
              className="h-9 appearance-none pl-8 pr-7 text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-gray-700 dark:text-gray-200 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="14d">Últimos 14 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-gray-400" />
          </div>

          {/* Alternador de visualização (Gráficos 2 cols / 3 cols / Compacto) */}
          <div
            role="group"
            aria-label="Modo de exibição das métricas"
            className="inline-flex rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-0.5 shadow-2xs"
          >
            <button
              type="button"
              onClick={() => setLayoutMode("charts-2col")}
              aria-pressed={layoutMode === "charts-2col"}
              title="Gráficos amplos (2 colunas)"
              className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-sm text-xs font-medium transition-colors ${
                layoutMode === "charts-2col"
                  ? "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Gráficos</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("charts-3col")}
              aria-pressed={layoutMode === "charts-3col"}
              title="Gráficos em grade (3 colunas)"
              className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-sm text-xs font-medium transition-colors ${
                layoutMode === "charts-3col"
                  ? "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span>3 col</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("compact")}
              aria-pressed={layoutMode === "compact"}
              title="Resumo compacto sem gráficos"
              className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-sm text-xs font-medium transition-colors ${
                layoutMode === "compact"
                  ? "bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Resumo</span>
            </button>
          </div>

          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {/* Seção 1: Minha seção personalizada */}
      <section aria-labelledby="custom-metrics-section-title" className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2
              id="custom-metrics-section-title"
              className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {customConfig.sectionTitle}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Painel configurável com gráficos dos seus indicadores prioritários e fórmulas próprias
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCustomizeModal(null)}
            className="h-9 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors shadow-2xs whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Personalizar seção</span>
          </button>
        </div>

        {customSectionItems.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-xs">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              Nenhum gráfico selecionado nesta seção.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clique em &ldquo;Personalizar seção&rdquo; para escolher métricas padrão ou criar uma fórmula.
            </p>
          </div>
        ) : (
          <MetricsGrid
            items={customSectionItems}
            layoutMode={layoutMode}
            onEditCustomMetric={(customId) => handleOpenCustomizeModal(customId)}
            onDeleteCustomMetric={handleDeleteCustomMetric}
          />
        )}
      </section>

      {/* Seção 2: Métricas avançadas (todas as 12 métricas em gráfico) */}
      <section aria-labelledby="advanced-metrics-section-title">
        <div className="mb-4">
          <h2
            id="advanced-metrics-section-title"
            className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Métricas avançadas
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Evolução completa de todos os indicadores financeiros, de tráfego e eficiência
          </p>
        </div>

        <MetricsGrid items={standardDisplayItems} layoutMode={layoutMode} />
      </section>

      {/* Modal de personalização */}
      <CustomSectionModal
        isOpen={modalOpen}
        config={customConfig}
        metricsInput={metricsInput}
        initialEditingCustomId={editingCustomId}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomId(null);
        }}
        onSaveConfig={handleSaveConfig}
        onResetDefault={handleResetDefault}
      />
    </motion.div>
  );
}

export default Metrics;