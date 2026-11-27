import { useEffect, useId, useMemo, useState } from "react";
import {
  HelpCircle,
  LucideIcon,
  ArrowUp,
  ArrowDown,
  Plus,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Calculator,
  Sparkles,
  TrendingUp,
  TrendingDown,
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
  METRICS_VARIABLE_KEYS,
  METRICS_VARIABLE_LABELS,
  STANDARD_METRICS,
  evaluateFormula,
  formatFormulaDisplay,
  formatMetricAxisValue,
  formatMetricValue,
  type MetricFormatType,
  type MetricsInput,
  type StandardMetricId,
} from "../../../lib/metricsFormulas";
import type {
  CustomMetricDefinition,
  CustomSectionConfig,
} from "../../../lib/metricsStorage";

export interface MetricChartPoint {
  dateLabel: string;
  fullDate: string;
  value: number | null;
}

export interface MetricDisplayItem {
  id: string;
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
  isCustom?: boolean;
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
  color?: string;
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
   MetricCard — Card com gráfico de evolução, valor consolidado e fórmula
============================================================================ */

interface MetricCardProps {
  item: MetricDisplayItem;
  showChart?: boolean;
  onEditCustom?: () => void;
  onDeleteCustom?: () => void;
}

export function MetricCard({
  item,
  showChart = true,
  onEditCustom,
  onDeleteCustom,
}: MetricCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipId = useId();
  const gradientId = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const Icon = item.icon;

  // Cor efetiva do gráfico (se semântica e negativa, usa vermelho)
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

  // Variação percentual entre o primeiro e o último ponto válido da série
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
      {/* Topo do card: ícone + título + ações */}
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

        <div className="flex items-center gap-1 shrink-0">
          {item.isCustom && onEditCustom && (
            <button
              type="button"
              onClick={onEditCustom}
              aria-label={`Editar métrica ${item.title}`}
              className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {item.isCustom && onDeleteCustom && (
            <button
              type="button"
              onClick={onDeleteCustom}
              aria-label={`Excluir métrica ${item.title}`}
              className="p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className="relative"
            onMouseEnter={() => setTooltipOpen(true)}
            onMouseLeave={() => setTooltipOpen(false)}
          >
            <button
              type="button"
              onClick={() => setTooltipOpen((prev) => !prev)}
              onFocus={() => setTooltipOpen(true)}
              onBlur={() => setTooltipOpen(false)}
              aria-label={`Ajuda e fórmula de ${item.title}`}
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
                    Fórmula
                  </span>
                  <code className="block text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5 break-words">
                    {item.formulaLabel}
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valor principal + badge de tendência */}
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

      {/* Gráfico Recharts da evolução no período */}
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
   MetricsGrid — Grade responsiva de gráficos ou cards compactos
============================================================================ */

export type MetricsLayoutMode = "charts-2col" | "charts-3col" | "compact";

interface MetricsGridProps {
  items: MetricDisplayItem[];
  layoutMode?: MetricsLayoutMode;
  onEditCustomMetric?: (customId: string) => void;
  onDeleteCustomMetric?: (customId: string) => void;
}

export function MetricsGrid({
  items,
  layoutMode = "charts-2col",
  onEditCustomMetric,
  onDeleteCustomMetric,
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
          onEditCustom={
            item.isCustom && onEditCustomMetric
              ? () => onEditCustomMetric(item.id)
              : undefined
          }
          onDeleteCustom={
            item.isCustom && onDeleteCustomMetric
              ? () => onDeleteCustomMetric(item.id)
              : undefined
          }
        />
      ))}
    </motion.div>
  );
}

/* ============================================================================
   FormulaBuilder — Construtor visual e seguro de fórmulas matemáticas
============================================================================ */

interface FormulaBuilderProps {
  metricsInput: MetricsInput;
  editingMetric: CustomMetricDefinition | null;
  onSaveMetric: (metric: Omit<CustomMetricDefinition, "id">, editId?: string) => void;
  onCancelEdit: () => void;
}

const FORMAT_OPTIONS: ReadonlyArray<{ value: MetricFormatType; label: string }> = [
  { value: "integer", label: "Número" },
  { value: "currency", label: "Moeda (R$)" },
  { value: "percent", label: "Porcentagem (%)" },
];

const OPERATOR_BUTTONS: ReadonlyArray<{ label: string; insert: string; ariaLabel: string }> = [
  { label: "+", insert: " + ", ariaLabel: "Adicionar operador soma" },
  { label: "−", insert: " - ", ariaLabel: "Adicionar operador subtração" },
  { label: "×", insert: " * ", ariaLabel: "Adicionar operador multiplicação" },
  { label: "÷", insert: " / ", ariaLabel: "Adicionar operador divisão" },
  { label: "(", insert: "(", ariaLabel: "Abrir parêntese" },
  { label: ")", insert: ")", ariaLabel: "Fechar parêntese" },
];

export function FormulaBuilder({
  metricsInput,
  editingMetric,
  onSaveMetric,
  onCancelEdit,
}: FormulaBuilderProps) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<MetricFormatType>("currency");
  const [formula, setFormula] = useState("");
  const [description, setDescription] = useState("");
  const [selectedVariable, setSelectedVariable] = useState<keyof MetricsInput>("faturamentoBruto");
  const [constantInput, setConstantInput] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (editingMetric) {
      setName(editingMetric.title);
      setFormat(editingMetric.format);
      setFormula(editingMetric.formula);
      setDescription(editingMetric.description);
      setTouched(true);
    } else {
      setName("");
      setFormat("currency");
      setFormula("");
      setDescription("");
      setTouched(false);
    }
  }, [editingMetric]);

  const evaluation = useMemo(
    () => evaluateFormula(formula, metricsInput),
    [formula, metricsInput]
  );

  const previewFormatted = useMemo(() => {
    if (!evaluation.ok) return "—";
    return formatMetricValue(evaluation.value, format);
  }, [evaluation, format]);

  const appendToken = (snippet: string) => {
    setTouched(true);
    setFormula((prev) => {
      const base = prev.trimEnd();
      if (!base) return snippet.trimStart();
      if (snippet === "(" || snippet === ")") {
        return `${base}${snippet}`;
      }
      if (snippet.startsWith(" ")) {
        return `${base}${snippet}`;
      }
      return `${base} ${snippet}`;
    });
  };

  const handleInsertVariable = () => {
    appendToken(selectedVariable);
  };

  const handleInsertConstant = () => {
    const cleaned = constantInput.trim().replace(",", ".");
    if (!cleaned || !Number.isFinite(Number(cleaned))) return;
    appendToken(cleaned);
    setConstantInput("");
  };

  const canSubmit = name.trim().length > 0 && evaluation.ok;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    onSaveMetric(
      {
        title: name.trim(),
        format,
        formula: formula.trim(),
        description:
          description.trim() ||
          `Métrica personalizada: ${formatFormulaDisplay(formula.trim())}`,
      },
      editingMetric?.id
    );

    if (!editingMetric) {
      setName("");
      setFormula("");
      setDescription("");
      setTouched(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 p-4 space-y-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {editingMetric
              ? `Editando: ${editingMetric.title}`
              : "Criar métrica personalizada"}
          </h4>
        </div>
        {editingMetric && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:underline"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="sm:col-span-2 flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Nome da métrica
          </span>
          <input
            type="text"
            placeholder="Ex: Ticket médio por pedido"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
            Tipo de formato
          </span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as MetricFormatType)}
            className="h-9 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 cursor-pointer"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Montador de fórmula */}
      <div className="space-y-2">
        <span className="block text-[11px] font-medium text-gray-600 dark:text-gray-400">
          Montar fórmula
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <select
              aria-label="Selecionar variável base"
              value={selectedVariable}
              onChange={(e) =>
                setSelectedVariable(e.target.value as keyof MetricsInput)
              }
              className="h-8 flex-1 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {METRICS_VARIABLE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {METRICS_VARIABLE_LABELS[key]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleInsertVariable}
              className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              + Variável
            </button>
          </div>

          <div className="flex items-center gap-1">
            {OPERATOR_BUTTONS.map((op) => (
              <button
                key={op.label}
                type="button"
                aria-label={op.ariaLabel}
                onClick={() => appendToken(op.insert)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {op.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              aria-label="Constante numérica"
              placeholder="Constante"
              value={constantInput}
              onChange={(e) => setConstantInput(e.target.value)}
              className="h-8 w-24 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="button"
              onClick={handleInsertConstant}
              className="h-8 px-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              + Número
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            aria-label="Expressão da fórmula"
            placeholder="Ex: (faturamentoBruto - reembolsos) / conversoes"
            value={formula}
            onChange={(e) => {
              setTouched(true);
              setFormula(e.target.value);
            }}
            className={`h-9 w-full px-3 pr-16 font-mono text-xs rounded-md border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              touched && !evaluation.ok
                ? "border-red-400 dark:border-red-700 focus:ring-red-500/30"
                : "border-gray-200 dark:border-gray-800 focus:ring-blue-500/40 focus:border-blue-500"
            }`}
          />
          {formula.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFormula("");
                setTouched(false);
              }}
              aria-label="Limpar expressão da fórmula"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          {touched && !evaluation.ok ? (
            <span
              role="alert"
              className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{evaluation.error}</span>
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              Use variáveis, números e operadores (+, −, ×, ÷).
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Prévia:</span>
            <strong className="font-semibold tabular-nums">
              {previewFormatted}
            </strong>
          </span>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
          Descrição curta (texto de ajuda do card)
        </span>
        <input
          type="text"
          placeholder="Ex: Receita líquida média gerada por cada venda confirmada."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:pointer-events-none text-white text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          {editingMetric ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Atualizar métrica</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar métrica</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ============================================================================
   CustomSectionModal — Modal de personalização da seção e métricas
============================================================================ */

interface CustomSectionModalProps {
  isOpen: boolean;
  config: CustomSectionConfig;
  metricsInput: MetricsInput;
  initialEditingCustomId?: string | null;
  onClose: () => void;
  onSaveConfig: (nextConfig: CustomSectionConfig) => void;
  onResetDefault: () => CustomSectionConfig;
}

export function CustomSectionModal({
  isOpen,
  config,
  metricsInput,
  initialEditingCustomId = null,
  onClose,
  onSaveConfig,
  onResetDefault,
}: CustomSectionModalProps) {
  const [sectionTitle, setSectionTitle] = useState(config.sectionTitle);
  const [selectedStandardIds, setSelectedStandardIds] = useState<StandardMetricId[]>(
    config.selectedStandardIds
  );
  const [customMetrics, setCustomMetrics] = useState<CustomMetricDefinition[]>(
    config.customMetrics
  );
  const [editingCustomId, setEditingCustomId] = useState<string | null>(
    initialEditingCustomId
  );

  useEffect(() => {
    if (!isOpen) return;
    setSectionTitle(config.sectionTitle);
    setSelectedStandardIds(config.selectedStandardIds);
    setCustomMetrics(config.customMetrics);
    setEditingCustomId(initialEditingCustomId);
  }, [isOpen, config, initialEditingCustomId]);

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

  const orderedStandardList = useMemo(() => {
    const selectedSet = new Set(selectedStandardIds);
    const selectedItems = selectedStandardIds
      .map((id) => STANDARD_METRICS.find((m) => m.id === id))
      .filter((m): m is (typeof STANDARD_METRICS)[number] => Boolean(m));
    const unselectedItems = STANDARD_METRICS.filter((m) => !selectedSet.has(m.id));
    return [...selectedItems, ...unselectedItems];
  }, [selectedStandardIds]);

  const toggleStandardMetric = (id: StandardMetricId) => {
    setSelectedStandardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const moveSelectedStandard = (id: StandardMetricId, direction: -1 | 1) => {
    setSelectedStandardIds((prev) => {
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

  const handleSaveCustomMetric = (
    draft: Omit<CustomMetricDefinition, "id">,
    editId?: string
  ) => {
    if (editId) {
      setCustomMetrics((prev) =>
        prev.map((m) => (m.id === editId ? { ...draft, id: editId } : m))
      );
      setEditingCustomId(null);
      return;
    }

    const newMetric: CustomMetricDefinition = {
      ...draft,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setCustomMetrics((prev) => [...prev, newMetric]);
  };

  const handleDeleteCustomMetric = (id: string) => {
    setCustomMetrics((prev) => prev.filter((m) => m.id !== id));
    if (editingCustomId === id) {
      setEditingCustomId(null);
    }
  };

  const handleReset = () => {
    const defaults = onResetDefault();
    setSectionTitle(defaults.sectionTitle);
    setSelectedStandardIds(defaults.selectedStandardIds);
    setCustomMetrics(defaults.customMetrics);
    setEditingCustomId(null);
  };

  const handleApplyAndClose = () => {
    onSaveConfig({
      sectionTitle: sectionTitle.trim() || "Minha seção personalizada",
      selectedStandardIds,
      customMetrics,
    });
    onClose();
  };

  const editingMetric = useMemo(
    () => customMetrics.find((m) => m.id === editingCustomId) ?? null,
    [customMetrics, editingCustomId]
  );

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
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl overflow-hidden"
          >
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <div>
                <h2
                  id="custom-section-modal-title"
                  className="text-base font-bold text-gray-900 dark:text-gray-100"
                >
                  Personalizar seção de gráficos
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Escolha os indicadores padrão, reordene a exibição ou crie fórmulas próprias.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal de personalização"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  Nome da seção
                </span>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Minha seção personalizada"
                  className="h-9 px-3 text-xs rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
              </label>

              {/* Seleção e ordenação de métricas padrão */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Gráficos padrão exibidos ({selectedStandardIds.length} selecionados)
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Use as setas para ordenar
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {orderedStandardList.map((metric) => {
                    const checked = selectedStandardIds.includes(metric.id);
                    const selectedIdx = selectedStandardIds.indexOf(metric.id);

                    return (
                      <div
                        key={metric.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <label className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStandardMetric(metric.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500/40"
                          />
                          <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                            {metric.title}
                          </span>
                        </label>

                        {checked && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={selectedIdx === 0}
                              onClick={() => moveSelectedStandard(metric.id, -1)}
                              aria-label={`Mover ${metric.title} para cima`}
                              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-35 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={selectedIdx === selectedStandardIds.length - 1}
                              onClick={() => moveSelectedStandard(metric.id, 1)}
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

              {/* Lista de métricas personalizadas */}
              {customMetrics.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                    Métricas personalizadas criadas ({customMetrics.length})
                  </span>
                  <div className="rounded-md border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    {customMetrics.map((custom) => (
                      <div
                        key={custom.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white dark:bg-gray-900"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {custom.title}
                          </p>
                          <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 truncate">
                            {formatFormulaDisplay(custom.formula)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCustomId(custom.id)}
                            aria-label={`Editar métrica personalizada ${custom.title}`}
                            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomMetric(custom.id)}
                            aria-label={`Excluir métrica personalizada ${custom.title}`}
                            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormulaBuilder
                metricsInput={metricsInput}
                editingMetric={editingMetric}
                onSaveMetric={handleSaveCustomMetric}
                onCancelEdit={() => setEditingCustomId(null)}
              />
            </div>

            {/* Rodapé do modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restaurar padrão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyAndClose}
                  className="h-9 inline-flex items-center gap-1.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Salvar seção</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}