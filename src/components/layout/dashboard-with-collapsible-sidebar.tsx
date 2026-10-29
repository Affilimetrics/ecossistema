import FinancialThermometer from "../../pages/dashboard/financial-thermometer";
import { useState, createContext, useContext, Dispatch, SetStateAction } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, DollarSign, ShoppingCart, Tag, BarChart3, Users, ChevronDown, ChevronsRight,
  TrendingUp, Activity, Package, Bell, Settings, HelpCircle, LucideIcon, Flame, Radar, Target, Megaphone
} from "lucide-react";
import {
  Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationPopover } from "../ui/notification-popover";
import { UserNav } from "../ui/user-nav";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

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

interface TitleSectionProps { open: boolean; }
interface ToggleCloseProps { open: boolean; setOpen: Dispatch<SetStateAction<boolean>>; }
interface ExampleContentProps { isDark: boolean; setIsDark: Dispatch<SetStateAction<boolean>>; }
interface DashboardShellProps { children: React.ReactNode; isDark: boolean; setIsDark: Dispatch<SetStateAction<boolean>>; }

/* ============================================================
   DASHBOARD SHELL
   ============================================================ */

export const DashboardShell = ({ children, isDark }: DashboardShellProps) => {
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
   SIDEBAR COM MENU AVANÇADO
   ============================================================ */

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Painel");
  const [advancedOpen, setAdvancedOpen] = useState(false); // Controla a expansão do menu avançado

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out ${
        open ? "w-64" : "w-16"
      } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm`}
    >
      <TitleSection open={open} />

      <div className="space-y-1 mb-8 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Dashboard sempre visível */}
        <Option Icon={Home} title="Dashboard" selected={selected} setSelected={setSelected} open={open} path="/dashboardv2" />

        {/* Botão Avançado */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={`relative flex h-11 w-full items-center rounded-md transition-colors duration-200 focus:outline-none text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200`}
        >
          <div className="grid h-full w-12 place-content-center">
            <ChevronsRight className={`h-4 w-4 transition-transform duration-300 ${advancedOpen ? "rotate-90" : ""}`} />
          </div>
          {open && (
            <span className="text-sm font-medium transition-opacity duration-200">
              Avançado
            </span>
          )}
        </button>

        {/* Opções Avançadas (Expansíveis) */}
        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden space-y-1 pl-2 border-l border-gray-200 dark:border-gray-800 ml-6"
            >
              <Option Icon={Megaphone} title="Central de Divulgação" selected={selected} setSelected={setSelected} open={open} path="/divulgacao" />
              <Option Icon={ShoppingCart} title="Produtos" selected={selected} setSelected={setSelected} open={open} path="/products" />  
              <Option Icon={Flame} title="Produtos Em Alta" selected={selected} setSelected={setSelected} open={open} path="/hot-products" />
              <Option Icon={Radar} title="Coleta geral" selected={selected} setSelected={setSelected} open={open} path="/coleta-geral" />
              <Option Icon={BarChart3} title="Análises" selected={selected} setSelected={setSelected} open={open} />
              <Option Icon={Target} title="Remarketing" selected={selected} setSelected={setSelected} open={open} path="/remarketing" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conta e Suporte */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1 pb-14">
        {open && (
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Conta
          </div>
        )}
        <Option Icon={Settings} title="Configurações" selected={selected} setSelected={setSelected} open={open} path="/settings" />
        <Option Icon={HelpCircle} title="Ajuda e suporte" selected={selected} setSelected={setSelected} open={open} />
      </div>

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
      className={`relative flex h-11 w-full items-center rounded-md transition-colors duration-200 focus:outline-none ${
        isSelected
          ? "text-blue-700 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      {isSelected && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 bg-blue-50 dark:bg-blue-900/40 rounded-md shadow-sm border-l-2 border-blue-500"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative z-10 grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span className="relative z-10 text-sm font-medium transition-opacity duration-200">
          {title}
        </span>
      )}

      {notifs && open && (
        <span className="relative z-10 absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-xs text-white font-medium">
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
      <svg width="20" height="16" viewBox="0 0 50 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="fill-white">
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
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none z-10"
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

const categoryMultiplier: Record<Category, number> = {
  Todas: 1,
  Eletrônicos: 1.15,
  "Casa e Cozinha": 0.85,
  Moda: 0.72,
  Esportes: 0.6,
  Livros: 0.4,
  Brinquedos: 0.32,
};

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
        <div className="h-full w-full min-h-[288px]" tabIndex={-1} style={{ outline: "none" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
              tabIndex={-1}
              style={{ outline: "none" }}
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
                strokeWidth={0.5}
                strokeDasharray="2 6"
                strokeOpacity={0.25}
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
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
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
   GRÁFICOS DINÂMICOS
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
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
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
        <div className="h-80 w-full" tabIndex={-1} style={{ outline: "none" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
              tabIndex={-1}
              style={{ outline: "none" }}
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
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
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
   CARD DE LINKS POR CATEGORIA
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
        <div className="h-72 w-full" tabIndex={-1} style={{ outline: "none" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
              tabIndex={-1}
              style={{ outline: "none" }}
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
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
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

export const ExampleContent = ({ isDark, setIsDark }: ExampleContentProps) => {
  const [selectedCard, setSelectedCard] = useState<ChartType | null>(null);

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* Header Padronizado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bem-vindo de volta</p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => {
          const isActive = selectedCard === card.key;
          return (
            <motion.button
              key={card.key}
              variants={itemVars}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => setSelectedCard(isActive ? null : card.key)}
              className={`text-left p-6 rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-200 cursor-pointer focus:outline-none ${
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
            </motion.button>
          );
        })}
      </motion.div>

      {selectedCard && <DynamicChart type={selectedCard} onClose={() => setSelectedCard(null)} />}

      {/* ROI + Termômetro Financeiro */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        <div className="lg:col-span-2">
          <ROIChart />
        </div>
        <div className="lg:col-span-1">
          <FinancialThermometer isDark={isDark} setIsDark={setIsDark} />
        </div>
      </motion.div>

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