import {
  useState,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  Monitor,
  ShoppingCart,
  Tag,
  BarChart3,
  Users,
  ChevronDown,
  ChevronsRight,
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  Bell,
  Settings,
  HelpCircle,
  User,
  LucideIcon,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Radar,
  Target,
  Percent,
} from "lucide-react";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import RemarketingPage from "./remarketing";

/* ============================================================
   TIPOS
   ============================================================ */

interface OptionProps {
  Icon: LucideIcon;
  title: string;
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  open: boolean;
  notifs?: number;
  path?: string;
}

interface TitleSectionProps {
  open: boolean;
}

interface ToggleCloseProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

interface ExampleContentProps {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

interface DashboardShellProps {
  children: React.ReactNode;
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

/* ============================================================
   CATEGORIAS (filtro global)
   ============================================================ */

const CATEGORIES = [
  "Todas",
  "Eletrônicos",
  "Casa e Cozinha",
  "Moda",
  "Esportes",
  "Livros",
  "Brinquedos",
] as const;

type Category = (typeof CATEGORIES)[number];

/* Fator multiplicador por categoria (simula variação dos dados) */
const categoryMultiplier: Record<Category, number> = {
  Todas: 1,
  Eletrônicos: 1.15,
  "Casa e Cozinha": 0.85,
  Moda: 0.72,
  Esportes: 0.6,
  Livros: 0.4,
  Brinquedos: 0.32,
};

/* ============================================================
   DASHBOARD SHELL
   ============================================================ */

export const DashboardShell = ({ children, isDark, setIsDark }: DashboardShellProps) => {
  return (
    <div className={`flex min-h-screen w-full ${isDark ? "dark" : ""}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Sidebar />
        {children}
      </div>
    </div>
  );
};

/* ============================================================
   TEMA (Context)
   ============================================================ */

interface DarkModeContextValue {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export const DarkModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", isDark);
  }

  return (
    <DarkModeContext.Provider value={{ isDark, setIsDark }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextValue => {
  const ctx = useContext(DarkModeContext);
  if (!ctx) {
    throw new Error("useDarkMode precisa estar dentro de <DarkModeProvider>");
  }
  return ctx;
};

/* ============================================================
   SIDEBAR
   ============================================================ */

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Painel");

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm`}
    >
      <TitleSection open={open} />

      <div className="space-y-1 mb-8">
        <Option Icon={Home} title="Painel" selected={selected} setSelected={setSelected} open={open} path="/dashboardv2" />
        <Option Icon={DollarSign} title="Vendas" selected={selected} setSelected={setSelected} open={open} notifs={3} />
        <Option Icon={Monitor} title="Ver site" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={ShoppingCart} title="Produtos" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={Flame} title="Produtos Em Alta" selected={selected} setSelected={setSelected} open={open} path="/hot-products" />
        <Option Icon={Radar} title="Coleta geral" selected={selected} setSelected={setSelected} open={open} path="/coleta-geral" />
        <Option Icon={Tag} title="Tags" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={BarChart3} title="Análises" selected={selected} setSelected={setSelected} open={open} />
        <Option Icon={Target} title="Remarketing" selected={selected} setSelected={setSelected} open={open} path="/remarketing" />
        <Option Icon={Users} title="Membros" selected={selected} setSelected={setSelected} open={open} notifs={12} />
      </div>

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Conta
          </div>
          <Option Icon={Settings} title="Configurações" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={HelpCircle} title="Ajuda e suporte" selected={selected} setSelected={setSelected} open={open} />
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, path }: OptionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSelected = path ? location.pathname === path : selected === title;

  const handleClick = () => {
    setSelected(title);
    if (path) navigate(path);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm border-l-2 border-blue-500"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span className="text-sm font-medium transition-opacity duration-200">
          {title}
        </span>
      )}

      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-xs text-white font-medium">
          {notifs}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open }: TitleSectionProps) => {
  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className="transition-opacity duration-200">
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Scallora
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Plano Pro
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
      <svg width="20" height="auto" viewBox="0 0 50 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
        <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
        <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
      </svg>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: ToggleCloseProps) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        {open && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200">
            Ocultar
          </span>
        )}
      </div>
    </button>
  );
};

/* ============================================================
   COMPONENTE DE FILTRO POR CATEGORIA
   ============================================================ */

interface CategoryFilterProps {
  value: Category;
  onChange: (c: Category) => void;
}

const CategoryFilter = ({ value, onChange }: CategoryFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Tag className="h-3.5 w-3.5 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Category)}
        className="text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors cursor-pointer"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
};

/* ============================================================
   DADOS DOS GRÁFICOS
   ============================================================ */

/**
 * ROI diário (em %) — dados de demonstração.
 */
const roiData = [
  { date: "2024-04-01", roi: 42 },
  { date: "2024-04-02", roi: 28 },
  { date: "2024-04-03", roi: 55 },
  { date: "2024-04-04", roi: 61 },
  { date: "2024-04-05", roi: 74 },
  { date: "2024-04-06", roi: 18 },
  { date: "2024-04-07", roi: 66 },
  { date: "2024-04-08", roi: 82 },
  { date: "2024-04-09", roi: 35 },
  { date: "2024-04-10", roi: 58 },
  { date: "2024-04-11", roi: 71 },
  { date: "2024-04-12", roi: 96 },
  { date: "2024-04-13", roi: 63 },
  { date: "2024-04-14", roi: 22 },
  { date: "2024-04-15", roi: 40 },
  { date: "2024-04-16", roi: 59 },
  { date: "2024-04-17", roi: 118 },
  { date: "2024-04-18", roi: 87 },
];

const roiColor = "#06b6d4";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
}

const ROITooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const positive = entry.value >= 0;
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[140px]">
        <div className="flex items-center gap-2 text-sm">
          <div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500 dark:text-gray-400">ROI:</span>
          <span
            className={`font-semibold ${
              positive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {entry.value.toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          (receita − investimento) ÷ investimento
        </p>
      </div>
    );
  }
  return null;
};

/* ============================================================
   ROI (Retorno sobre Investimento)
   ============================================================ */

const ROIChart = () => {
  const [category, setCategory] = useState<Category>("Todas");
  const multiplier = categoryMultiplier[category];

  const filteredData = roiData.map((d) => ({
    ...d,
    roi: +(d.roi * multiplier).toFixed(1),
  }));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 pt-6 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ROI — Retorno sobre Investimento
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Últimos 18 dias · {category}
          </p>
        </div>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="px-2.5 py-6 flex-1 min-h-0">
        <div className="h-full w-full min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
            >
              <defs>
                <filter id="roiLineShadow" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${roiColor}60`} />
                </filter>
                <filter id="roiDotShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={10}
                tickCount={6}
                tickFormatter={(value) => `${value}%`}
              />

              <ReferenceLine
                y={0}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />

              <RechartsTooltip
                content={<ROITooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
              />

              <Line
                type="monotone"
                dataKey="roi"
                stroke={roiColor}
                strokeWidth={2}
                filter="url(#roiLineShadow)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: roiColor,
                  stroke: "white",
                  strokeWidth: 2,
                  filter: "url(#roiDotShadow)",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-6 pb-6 shrink-0">
        <div className="grid grid-cols-3 gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              ROI médio
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {(
                filteredData.reduce((s, d) => s + d.roi, 0) / filteredData.length
              ).toFixed(1)}
              %
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Melhor dia
            </p>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              +{Math.max(...filteredData.map((d) => d.roi)).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Pior dia
            </p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {Math.min(...filteredData.map((d) => d.roi)).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SAÚDE FINANCEIRA (recebe dados prontos da API Django)
   ============================================================ */

type HealthLevelKey =
  | "critical"
  | "warning"
  | "healthy"
  | "excellent"
  | "insufficient";

interface HealthFactor {
  key: string;
  label: string;
  value: number | null;
  hint?: string;
}

interface HealthInsight {
  strongest: { key: string; label: string; value: number } | null;
  weakest: { key: string; label: string; value: number } | null;
  trendPercent: number | null;
  goalProgressPercent: number | null;
  recommendation: string | null;
}

interface FinancialHealthData {
  score: number | null;
  level: HealthLevelKey;
  factors: HealthFactor[];
  insight: HealthInsight;
}

interface FinancialThermometerProps {
  data: FinancialHealthData;
}

interface HealthLevelStyle {
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

const HEALTH_LEVEL_STYLES: Record<HealthLevelKey, HealthLevelStyle> = {
  critical: {
    label: "Crítico",
    color: "#ef4444",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-600 dark:text-red-400",
    description: "Sua operação precisa de ajustes urgentes para gerar receita consistente.",
  },
  warning: {
    label: "Atenção",
    color: "#eab308",
    badgeBg: "bg-yellow-500/10",
    badgeText: "text-yellow-600 dark:text-yellow-400",
    description: "Há progresso, mas ainda há gargalos que limitam seu resultado.",
  },
  healthy: {
    label: "Saudável",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600 dark:text-blue-400",
    description: "Sua operação está consistente e próxima do desempenho esperado.",
  },
  excellent: {
    label: "Excelente",
    color: "#22c55e",
    badgeBg: "bg-green-500/10",
    badgeText: "text-green-600 dark:text-green-400",
    description: "Desempenho acima do esperado. Mantenha o ritmo e diversifique.",
  },
  insufficient: {
    label: "Dados insuficientes",
    color: "#64748b",
    badgeBg: "bg-slate-500/10",
    badgeText: "text-slate-600 dark:text-slate-400",
    description:
      "Cadastre metas e colete dados por pelo menos 14 dias para calcular a pontuação.",
  },
};

interface HealthGaugeProps {
  score: number | null;
  levelColor: string;
  size?: number;
}

const HealthGauge = ({ score, levelColor, size = 220 }: HealthGaugeProps) => {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const progress = score == null ? 0 : (score / 100) * circumference;

  return (
    <svg
      width={size}
      height={size / 1.7}
      viewBox={`0 0 ${size} ${size / 1.7}`}
      className="overflow-visible"
      role="img"
      aria-label={
        score == null
          ? "Saúde financeira: dados insuficientes"
          : `Saúde financeira: ${score} de 100`
      }
    >
      <defs>
        <linearGradient id="gaugeTrack" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
          <stop offset="25%" stopColor="#eab308" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="gaugeProgress" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={levelColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={levelColor} stopOpacity="1" />
        </linearGradient>
        <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke="url(#gaugeTrack)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />

      <motion.path
        d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke="url(#gaugeProgress)"
        strokeWidth={stroke}
        strokeLinecap="round"
        filter={score != null ? "url(#gaugeGlow)" : undefined}
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${progress} ${circumference}` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {score != null && (
        <motion.circle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
          r={stroke / 2 - 2}
          className="fill-white dark:fill-slate-950"
          stroke={levelColor}
          strokeWidth={3}
          style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.25))" }}
          cx={cx + radius * Math.cos(Math.PI - Math.PI * (score / 100))}
          cy={cy - radius * Math.sin(Math.PI - Math.PI * (score / 100))}
        />
      )}
    </svg>
  );
};

const FactorBar = ({ factor }: { factor: HealthFactor }) => {
  const hasData = factor.value != null;
  const value = factor.value ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
            {factor.label}
          </span>
          {factor.hint && (
            <span
              className="text-[10px] text-gray-400 dark:text-slate-500 cursor-help"
              title={factor.hint}
            >
              ⓘ
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-gray-900 dark:text-slate-100">
          {hasData ? `${Math.round(value)}%` : "—"}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        {hasData ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background:
                value >= 80
                  ? "linear-gradient(90deg,#16a34a,#22c55e)"
                  : value >= 55
                  ? "linear-gradient(90deg,#1d4ed8,#3b82f6)"
                  : value >= 25
                  ? "linear-gradient(90deg,#b45309,#eab308)"
                  : "linear-gradient(90deg,#991b1b,#ef4444)",
            }}
          />
        ) : (
          <div className="h-full w-full bg-gray-300/60 dark:bg-slate-700/40" />
        )}
      </div>
    </div>
  );
};

const FinancialThermometer = ({ data }: FinancialThermometerProps) => {
  const { score, level, factors, insight } = data;
  const style = HEALTH_LEVEL_STYLES[level];

  const LevelIcon =
    level === "excellent"
      ? Flame
      : level === "healthy"
      ? CheckCircle2
      : level === "insufficient"
      ? Activity
      : AlertTriangle;

  const trendLabel =
    insight.trendPercent == null
      ? "Sem histórico"
      : `${insight.trendPercent >= 0 ? "+" : ""}${(
          insight.trendPercent * 100
        ).toFixed(1)}%`;

  const trendColor =
    insight.trendPercent == null
      ? "text-gray-500 dark:text-slate-400"
      : insight.trendPercent >= 0
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="relative rounded-2xl border border-gray-200 dark:border-slate-800 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-950 shadow-xl overflow-hidden h-full flex flex-col">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: style.color }}
      />

      <div className="relative px-6 pt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Saúde Financeira
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Indicador composto do seu desempenho
          </p>
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${style.color}20` }}
          title="Como a pontuação é calculada"
        >
          <Thermometer className="h-5 w-5" style={{ color: style.color }} />
        </div>
      </div>

      <div className="relative px-6 pt-2 flex flex-col items-center">
        <div className="relative">
          <HealthGauge score={score} levelColor={style.color} size={220} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
            {score == null ? (
              <>
                <p className="text-2xl font-bold text-gray-700 dark:text-slate-300">—</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">
                  Dados insuficientes
                </p>
              </>
            ) : (
              <>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="text-4xl font-bold text-gray-900 dark:text-slate-50 tabular-nums"
                >
                  {score}
                  <span className="text-base font-medium text-gray-400 dark:text-slate-500">
                    /100
                  </span>
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75, duration: 0.4 }}
                  className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.badgeBg}`}
                >
                  <LevelIcon className={`h-3.5 w-3.5 ${style.badgeText}`} />
                  <span className={`text-xs font-semibold ${style.badgeText}`}>
                    {style.label}
                  </span>
                </motion.div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-3 max-w-[260px]">
          {style.description}
        </p>
      </div>

      {factors.length > 0 && (
        <div className="relative px-6 pt-5 space-y-3">
          {factors.map((f) => (
            <FactorBar key={f.key} factor={f} />
          ))}
        </div>
      )}

      {(insight.strongest ||
        insight.weakest ||
        insight.recommendation ||
        insight.goalProgressPercent != null) && (
        <div className="relative mt-5 px-6 pb-6 pt-4 border-t border-gray-200 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {insight.goalProgressPercent != null && (
              <div className="rounded-lg bg-gray-100 dark:bg-slate-800/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-500">
                  Meta do período
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {insight.goalProgressPercent.toFixed(0)}%
                </p>
              </div>
            )}
            <div className="rounded-lg bg-gray-100 dark:bg-slate-800/50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-500">
                Tendência
              </p>
              <p className={`text-sm font-semibold ${trendColor}`}>
                {trendLabel}
              </p>
            </div>
          </div>

          {insight.strongest && (
            <div className="flex items-start gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 dark:text-slate-400">
                Ponto forte:{" "}
                <span className="text-gray-900 dark:text-slate-200 font-medium">
                  {insight.strongest.label}
                </span>
              </p>
            </div>
          )}

          {insight.weakest && insight.weakest.key !== insight.strongest?.key && (
            <div className="flex items-start gap-2 text-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 dark:text-slate-400">
                Atenção em:{" "}
                <span className="text-gray-900 dark:text-slate-200 font-medium">
                  {insight.weakest.label}
                </span>
              </p>
            </div>
          )}

          {insight.recommendation && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-200/90">
                💡 {insight.recommendation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ============================================================
   GRÁFICOS DINÂMICOS (com filtro)
   ============================================================ */

type ChartType = "vendas" | "afiliados" | "pedidos" | "produtos" | "linksCategoria";

interface DynamicChartProps {
  type: ChartType;
  onClose: () => void;
}

const chartConfig: Record<
  ChartType,
  { title: string; subtitle: string; color: string; prefix: string; suffix: string }
> = {
  vendas: {
    title: "Total de vendas",
    subtitle: "Últimos 18 dias",
    color: "#3b82f6",
    prefix: "$",
    suffix: "",
  },
  afiliados: {
    title: "Links Afiliados",
    subtitle: "Cliques nos últimos 18 dias",
    color: "#22c55e",
    prefix: "",
    suffix: "",
  },
  pedidos: {
    title: "Pedidos",
    subtitle: "Pedidos por dia",
    color: "#a855f7",
    prefix: "",
    suffix: "",
  },
  produtos: {
    title: "Produtos Coletados",
    subtitle: "Coletas por dia",
    color: "#f97316",
    prefix: "",
    suffix: "",
  },
  linksCategoria: {
    title: "Links por categoria",
    subtitle: "Desempenho nos últimos 18 dias",
    color: "#06b6d4",
    prefix: "",
    suffix: "",
  },
};

const generateData = (type: ChartType, multiplier: number) => {
  const baseValues: Record<ChartType, number[]> = {
    vendas: [820, 450, 680, 910, 1120, 280, 980, 1210, 380, 720, 850, 1380, 820, 310, 510, 750, 1720, 1290],
    afiliados: [45, 32, 58, 71, 92, 18, 78, 101, 28, 62, 85, 118, 72, 21, 41, 65, 142, 99],
    pedidos: [12, 8, 15, 22, 28, 5, 18, 31, 9, 16, 21, 35, 19, 7, 11, 17, 42, 29],
    produtos: [3, 1, 5, 8, 12, 0, 6, 14, 2, 4, 7, 18, 9, 1, 3, 5, 22, 13],
    linksCategoria: [50, 65, 45, 80, 95, 60, 75, 88, 55, 70, 82, 91, 68, 52, 73, 86, 99, 78],
  };

  return roiData.map((item, i) => ({
    date: item.date,
    valor: +((baseValues[type][i] ?? 0) * multiplier).toFixed(2),
  }));
};

const DynamicChart = ({ type, onClose }: DynamicChartProps) => {
  const config = chartConfig[type];
  const [category, setCategory] = useState<Category>("Todas");
  const multiplier = categoryMultiplier[category];
  const data = generateData(type, multiplier);

  const DynamicTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[120px]">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{config.title}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {config.prefix}
              {entry.value.toFixed(0)}
              {config.suffix}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm mb-8 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="px-6 pt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{config.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {config.subtitle} · {category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CategoryFilter value={category} onChange={setCategory} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fechar gráfico"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-2.5 py-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
            >
              <defs>
                <filter id={`lineShadow-${type}`} x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${config.color}60`} />
                </filter>
                <filter id={`dotShadow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickMargin={10}
                tickCount={6}
                tickFormatter={(value) => `${config.prefix}${value}${config.suffix}`}
              />

              <RechartsTooltip
                content={<DynamicTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
              />

              <Line
                type="monotone"
                dataKey="valor"
                stroke={config.color}
                strokeWidth={2}
                filter={`url(#lineShadow-${type})`}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: config.color,
                  stroke: "white",
                  strokeWidth: 2,
                  filter: `url(#dotShadow-${type})`,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   CARD DE LINKS POR CATEGORIA (só o gráfico, com filtro)
   ============================================================ */

const MetricCard = () => {
  const [category, setCategory] = useState<Category>("Todas");
  const multiplier = categoryMultiplier[category];
  const data = generateData("linksCategoria", multiplier);
  const config = chartConfig.linksCategoria;

  const MetricTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[120px]">
          <div className="flex items-center gap-2 text-sm">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{config.title}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {entry.value.toFixed(0)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 pt-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Links por categoria
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Desempenho nos últimos 18 dias · {category}
          </p>
        </div>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="px-2.5 py-6 flex-1">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
            >
              <defs>
                <filter id="lineShadow-metric-card" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor={`${config.color}60`} />
                </filter>
                <filter id="dotShadow-metric-card" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={10}
                tickCount={6}
              />

              <RechartsTooltip
                content={<MetricTooltip />}
                cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
              />

              <Line
                type="monotone"
                dataKey="valor"
                stroke={config.color}
                strokeWidth={2}
                filter="url(#lineShadow-metric-card)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: config.color,
                  stroke: "white",
                  strokeWidth: 2,
                  filter: "url(#dotShadow-metric-card)",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   CONTEÚDO DO DASHBOARD
   ============================================================ */

const statsCards = [
  {
    key: "vendas" as ChartType,
    icon: DollarSign,
    title: "Total de vendas",
    value: "$24,567",
    change: "+12% em relação ao mês passado",
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    ringColor: "ring-blue-500",
    activeBg: "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600",
  },
  {
    key: "afiliados" as ChartType,
    icon: Users,
    title: "Links Afiliados",
    value: "1,234",
    change: "+5% em relação à semana passada",
    iconBg: "bg-green-50 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    ringColor: "ring-green-500",
    activeBg: "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600",
  },
  {
    key: "pedidos" as ChartType,
    icon: ShoppingCart,
    title: "Pedidos",
    value: "456",
    change: "+8% em relação a ontem",
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    ringColor: "ring-purple-500",
    activeBg: "bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600",
  },
  {
    key: "produtos" as ChartType,
    icon: Package,
    title: "Produtos Coletados",
    value: "89",
    change: "+3 novos esta semana",
    iconBg: "bg-orange-50 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    ringColor: "ring-orange-500",
    activeBg: "bg-orange-50 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600",
  },
];

const topProducts = [
  { name: "iPhone 15 Pro", price: 1299 },
  { name: "MacBook Air M2", price: 1099 },
  { name: "AirPods Pro", price: 249 },
  { name: "iPad Air", price: 599 },
];

const MOCK_HEALTH: FinancialHealthData = {
  score: 72,
  level: "healthy",
  factors: [
    {
      key: "revenue",
      label: "Receita vs. meta",
      value: 74,
      hint: "Quanto da sua meta de receita foi atingido.",
    },
    {
      key: "conversion",
      label: "Taxa de conversão",
      value: 62,
      hint: "Conversões sobre cliques nos links.",
    },
    {
      key: "commission",
      label: "Comissões recebidas",
      value: 64,
      hint: "Proporção da comissão já paga.",
    },
    {
      key: "trend",
      label: "Tendência",
      value: 78,
      hint: "Variação vs. período anterior.",
    },
  ],
  insight: {
    strongest: { key: "trend", label: "Tendência", value: 78 },
    weakest: { key: "conversion", label: "Taxa de conversão", value: 62 },
    trendPercent: 0.21,
    goalProgressPercent: 73.6,
    recommendation:
      "Sua taxa de conversão está abaixo do esperado. Revise os produtos e links com mais cliques e menos vendas.",
  },
};

export const ExampleContent = ({ isDark, setIsDark }: ExampleContentProps) => {
  const [selectedCard, setSelectedCard] = useState<ChartType | null>(null);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Bem-vindo de volta</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => {
          const isActive = selectedCard === card.key;
          return (
            <button
              key={card.key}
              onClick={() => setSelectedCard(isActive ? null : card.key)}
              className={`text-left p-6 rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? `${card.activeBg} shadow-md ring-2 ${card.ringColor} ring-offset-1 dark:ring-offset-gray-950`
                  : "border-gray-200 dark:border-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">{card.change}</p>
              <p className={`text-xs mt-3 font-medium transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`}>
                {isActive ? "✓ Gráfico aberto abaixo" : ""}
              </p>
            </button>
          );
        })}
      </div>

      {selectedCard && <DynamicChart type={selectedCard} onClose={() => setSelectedCard(null)} />}

      {/* ROI + Saúde Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ROIChart />
        </div>
        <div className="lg:col-span-1">
          <FinancialThermometer data={MOCK_HEALTH} />
        </div>
      </div>

      {/* Links por categoria */}
      <div className="mb-8">
        <MetricCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Atividade recente</h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Ver tudo
              </button>
            </div>
            <div className="space-y-4">
              {[
                { icon: DollarSign, title: "Nova venda registrada", desc: "Pedido #1234 concluído", time: "há 2 min", color: "green" },
                { icon: Users, title: "Novo usuário registrado", desc: "john.doe@example.com entrou", time: "há 5 min", color: "blue" },
                { icon: Package, title: "Produto atualizado", desc: "Estoque do iPhone 15 Pro atualizado", time: "há 10 min", color: "purple" },
                { icon: Activity, title: "Manutenção do sistema", desc: "Backup programado concluído", time: "há 1 hora", color: "orange" },
                { icon: Bell, title: "Nova notificação", desc: "Resultados da campanha de marketing", time: "há 2 horas", color: "red" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.color === "green"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : activity.color === "blue"
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : activity.color === "purple"
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : activity.color === "orange"
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <activity.icon
                      className={`h-4 w-4 ${
                        activity.color === "green"
                          ? "text-green-600 dark:text-green-400"
                          : activity.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : activity.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : activity.color === "orange"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activity.desc}</p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Estatísticas rápidas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de conversão</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">3.2%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "32%" }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de rejeição</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">45%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: "45%" }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Visualizações de página</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">8.7k</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "87%" }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Principais produtos</h3>
            <div className="space-y-3">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{product.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    ${product.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};