import { useEffect, useId, useMemo, useState } from "react";
import {
  HelpCircle,
  LucideIcon,
  ArrowUp,
  ArrowDown,
  X,
  RotateCcw,
  Check,
  TrendingUp,
  TrendingDown,
  Trash2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence, Variants, useReducedMotion } from "framer-motion";
import {
  STANDARD_METRICS,
  formatMetricAxisValue,
  formatMetricValue,
  type MetricFormatType,
  type StandardMetricId,
} from "../../../lib/metricsFormulas";
import type { CustomSectionConfig } from "../../../lib/metricsStorage";

export interface MetricChartPoint {
  dateLabel: string;
  fullDate: string;
  value: number | null;
}

export interface MetricDisplayItem {
  id: StandardMetricId;
  title: string;
  formattedValue: string;
  rawValue: number | null;
  shortDescription: string;
  formulaLabel: string;
  format: MetricFormatType;
  chartColor: string;
  series: MetricChartPoint[];
  icon: LucideIcon;
  iconColorClass: string;
  semanticColor?: boolean;
}

const cardItemVars: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const gridContainerVars: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, ease: "easeOut" },
  },
};

/* ============================================================================
   Tooltip customizado do gráfico Recharts
============================================================================ */

interface ChartTooltipPayloadEntry {
  value: number | null;
  payload?: MetricChartPoint;
}

interface MetricChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadEntry[];
  title: string;
  format: MetricFormatType;
  accentColor: string;
}

function MetricChartTooltip({
  active,
  payload,
  title,
  format,
  accentColor,
}: MetricChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const point = entry.payload;
  const formatted = formatMetricValue(
    typeof entry.value === "number" ? entry.value : null,
    format
  );

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 shadow-lg text-xs">
      {point?.fullDate && (
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
          {point.fullDate}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: accentColor }}
        />
        <span className="text-gray-500 dark:text-gray-400">{title}:</span>
        <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
          {formatted}
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
   MetricCard — Card com gráfico de evolução, valor consolidado e explicação
============================================================================ */

interface MetricCardProps {
  item: MetricDisplayItem;
  showChart?: boolean;
}

export function MetricCard({ item, showChart = true }: MetricCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipId = useId();
  const gradientId = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const Icon = item.icon;

  const effectiveStrokeColor = useMemo(() => {
    if (item.semanticColor && item.rawValue !== null && item.rawValue < 0) {
      return "#ef4444";
    }
    return item.chartColor;
  }, [item.semanticColor, item.rawValue, item.chartColor]);

  const valueColorClass = useMemo(() => {
    if (!item.semanticColor || item.rawValue === null) {
      return "text-gray-900 dark:text-gray-100";
    }
    if (item.rawValue > 0) {
      return "text-emerald-600 dark:text-emerald-400";
    }
    if (item.rawValue < 0) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-gray-900 dark:text-gray-100";
  }, [item.semanticColor, item.rawValue]);

  const trendDelta = useMemo(() => {
    const valid = item.series
      .map((p) => p.value)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    if (valid.length < 2) return null;
    const first = valid[0];
    const last = valid[valid.length - 1];
    if (first === 0) return null;
    const pct = ((last - first) / Math.abs(first)) * 100;
    return Number.isFinite(pct) ? pct : null;
  }, [item.series]);

  return (
    <motion.article
      variants={prefersReducedMotion ? undefined : cardItemVars}
      whileHover={prefersReducedMotion ? undefined : { y: -2, transition: { duration: 0.15 } }}
      className="relative rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex flex-col justify-between gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-gray-50 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-700/70 shrink-0">
            <Icon className={`h-4 w-4 ${item.iconColorClass}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug truncate">
              {item.title}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {item.shortDescription}
            </p>
          </div>
        </div>

        <div
          className="relative shrink-0"
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
        >
          <button
            type="button"
            onClick={() => setTooltipOpen((prev) => !prev)}
            onFocus={() => setTooltipOpen(true)}
            onBlur={() => setTooltipOpen(false)}
            aria-label={`Ajuda e explicação de ${item.title}`}
            aria-expanded={tooltipOpen}
            aria-describedby={tooltipOpen ? tooltipId : undefined}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>

          {tooltipOpen && (
            <div
              id={tooltipId}
              role="tooltip"
              className="absolute right-0 top-full mt-1.5 w-64 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left shadow-lg z-30 pointer-events-none"
            >
              <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">
                {item.title}
              </p>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                {item.shortDescription}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Cálculo
                </span>
                <code className="block text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5 break-words">
                  {item.formulaLabel}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-2xl font-bold tabular-nums tracking-tight ${valueColorClass}`}>
          {item.formattedValue}
        </p>

        {trendDelta !== null && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${
              trendDelta >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400"
            }`}
          >
            {trendDelta >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta.toFixed(1)}%
            </span>
          </span>
        )}
      </div>

      {showChart && (
        <div
          className="h-44 w-full pt-1 outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_*]:outline-none"
          tabIndex={-1}
        >
          <ResponsiveContainer width="100%" height="100%" debounce={250}>
            <AreaChart
              data={item.series}
              margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={effectiveStrokeColor} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={effectiveStrokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-gray-200/70 dark:text-gray-800"
              />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-gray-400 dark:text-gray-500"
                tickMargin={6}
                minTickGap={18}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-gray-400 dark:text-gray-500"
                tickCount={4}
                tickFormatter={(val: number) =>
                  formatMetricAxisValue(val, item.format)
                }
              />
              <RechartsTooltip
                content={
                  <MetricChartTooltip
                    title={item.title}
                    format={item.format}
                    accentColor={effectiveStrokeColor}
                  />
                }
                cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={effectiveStrokeColor}
                strokeWidth={2}
                fill={`url(#grad-${gradientId})`}
                connectNulls
                isAnimationActive={!prefersReducedMotion}
                animationDuration={750}
                animationEasing="ease-out"
                dot={false}
                activeDot={{
                  r: 4.5,
                  fill: effectiveStrokeColor,
                  stroke: "#ffffff",
                  strokeWidth: 1.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.article>
  );
}

/* ============================================================================
   MetricsGrid — Grade responsiva de gráficos
============================================================================ */

export type MetricsLayoutMode = "charts-2col" | "charts-3col" | "compact";

interface MetricsGridProps {
  items: MetricDisplayItem[];
  layoutMode?: MetricsLayoutMode;
}

export function MetricsGrid({
  items,
  layoutMode = "charts-2col",
}: MetricsGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const gridColsClass =
    layoutMode === "charts-2col"
      ? "grid-cols-1 lg:grid-cols-2"
      : layoutMode === "charts-3col"
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <motion.div
      variants={prefersReducedMotion ? undefined : gridContainerVars}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
      className={`grid ${gridColsClass} gap-4`}
    >
      {items.map((item) => (
        <MetricCard
          key={item.id}
          item={item}
          showChart={layoutMode !== "compact"}
        />
      ))}
    </motion.div>
  );
}

/* ============================================================================
   CustomSectionModal — Formulário simples: nome da seção + seleção de gráficos
============================================================================ */

interface CustomSectionModalProps {
  isOpen: boolean;
  config: CustomSectionConfig;
  onClose: () => void;
  onSaveConfig: (nextConfig: CustomSectionConfig) => void;
  onResetDefault: () => CustomSectionConfig;
  onDeleteSection: () => void;
}

export function CustomSectionModal({
  isOpen,
  config,
  onClose,
  onSaveConfig,
  onResetDefault,
  onDeleteSection,
}: CustomSectionModalProps) {
  const [sectionTitle, setSectionTitle] = useState(config.sectionTitle);
  const [selectedMetricIds, setSelectedMetricIds] = useState<StandardMetricId[]>(
    config.selectedMetricIds
  );

  useEffect(() => {
    if (!isOpen) return;
    setSectionTitle(config.sectionTitle);
    setSelectedMetricIds(config.selectedMetricIds);
  }, [isOpen, config]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const orderedMetricsList = useMemo(() => {
    const selectedSet = new Set(selectedMetricIds);
    const selectedItems = selectedMetricIds
      .map((id) => STANDARD_METRICS.find((m) => m.id === id))
      .filter((m): m is (typeof STANDARD_METRICS)[number] => Boolean(m));
    const unselectedItems = STANDARD_METRICS.filter((m) => !selectedSet.has(m.id));
    return [...selectedItems, ...unselectedItems];
  }, [selectedMetricIds]);

  const toggleMetric = (id: StandardMetricId) => {
    setSelectedMetricIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const moveMetric = (id: StandardMetricId, direction: -1 | 1) => {
    setSelectedMetricIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const handleReset = () => {
    const defaults = onResetDefault();
    setSectionTitle(defaults.sectionTitle);
    setSelectedMetricIds(defaults.selectedMetricIds);
  };

  const handleDelete = () => {
    onDeleteSection();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      sectionTitle: sectionTitle.trim() || "Minha seção personalizada",
      selectedMetricIds,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-section-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <motion.form
            onSubmit={handleSubmit}
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden"
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div>
                <h2
                  id="custom-section-modal-title"
                  className="text-base font-bold text-gray-900 dark:text-gray-100"
                >
                  Personalizar seção
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Defina o nome da seção e escolha quais gráficos deseja exibir.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corpo simples: Nome + Checkboxes das tabelas/gráficos */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Nome da seção
                </span>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Ex: Indicadores principais"
                  className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Selecione os gráficos ({selectedMetricIds.length} selecionados)
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Setas ordenam
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {orderedMetricsList.map((metric) => {
                    const checked = selectedMetricIds.includes(metric.id);
                    const selectedIdx = selectedMetricIds.indexOf(metric.id);

                    return (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMetric(metric.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/40"
                          />
                          <div className="min-w-0">
                            <span className="block text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                              {metric.title}
                            </span>
                            {!metric.defaultVisible && (
                              <span className="block text-[10px] text-blue-600 dark:text-blue-400">
                                Métrica adicional disponível
                              </span>
                            )}
                          </div>
                        </label>

                        {checked && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={selectedIdx === 0}
                              onClick={() => moveMetric(metric.id, -1)}
                              aria-label={`Mover ${metric.title} para cima`}
                              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-35 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={selectedIdx === selectedMetricIds.length - 1}
                              onClick={() => moveMetric(metric.id, 1)}
                              aria-label={`Mover ${metric.title} para baixo`}
                              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-35 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-red-200 dark:border-red-900/60 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-medium text-red-600 dark:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir seção</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Padrão</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 inline-flex items-center gap-1.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}