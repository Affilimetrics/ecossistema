// src/pages/dashboard/analytics.tsx
import React, { useState, useMemo } from "react";
import {
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  MousePointerClick,
  Percent,
  Activity,
  X,
  FileSpreadsheet,
  BarChart3,
  Search,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence, Variants } from "framer-motion";
import * as XLSX from "xlsx";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";
import { ChartConfig, ChartContainer } from "../../components/ui/line-charts-4";

/* ============================================================
   MOCKS ISOLADOS DE DESENVOLVIMENTO
   ============================================================ */
const MOCK_PLATFORMS = ["Shopee", "Mercado Livre", "Amazon", "Magalu"];

const MOCK_SALES_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(2024, 3, i + 1).toISOString().split("T")[0],
  faturamento: Math.floor(Math.random() * 5000) + 1000,
  comissoes: Math.floor(Math.random() * 500) + 100,
  cliques: Math.floor(Math.random() * 1000) + 200,
  conversoes: Math.floor(Math.random() * 50) + 10,
}));

const MOCK_PRODUCTS = [
  { id: "1", name: "iPhone 15 Pro", platform: "Amazon", cliques: 1200, vendas: 45, comissao: 4500 },
  { id: "2", name: "MacBook Air M2", platform: "Mercado Livre", cliques: 850, vendas: 20, comissao: 3200 },
  { id: "3", name: "Fritadeira Air Fryer", platform: "Magalu", cliques: 2100, vendas: 110, comissao: 1800 },
  { id: "4", name: "Fone QCY T13", platform: "Shopee", cliques: 3400, vendas: 250, comissao: 1250 },
];

const MOCK_PLATFORM_TREND_DATA = [
  { date: "01 Abr", amazon: 2200, mercadoLivre: 1800, shopee: 1200, magalu: 800 },
  { date: "05 Abr", amazon: 3800, mercadoLivre: 2600, shopee: 1900, magalu: 1200 },
  { date: "10 Abr", amazon: 5400, mercadoLivre: 4100, shopee: 2800, magalu: 1900 },
  { date: "15 Abr", amazon: 7900, mercadoLivre: 5800, shopee: 3900, magalu: 2600 },
  { date: "20 Abr", amazon: 9600, mercadoLivre: 7300, shopee: 4900, magalu: 3200 },
  { date: "25 Abr", amazon: 11200, mercadoLivre: 8700, shopee: 5800, magalu: 3800 },
  { date: "30 Abr", amazon: 12500, mercadoLivre: 9800, shopee: 6400, magalu: 4200 },
];

const platformChartConfig = {
  amazon: {
    label: "Amazon",
    color: "#3b82f6",
  },
  mercadoLivre: {
    label: "Mercado Livre",
    color: "#eab308",
  },
  shopee: {
    label: "Shopee",
    color: "#f97316",
  },
  magalu: {
    label: "Magalu",
    color: "#06b6d4",
  },
} satisfies ChartConfig;

/* ============================================================
   TIPOS E FORMATADORES
   ============================================================ */
type DateRange = "today" | "7days" | "30days" | "90days" | "thisMonth" | "lastMonth" | "custom";
type MetricType = "faturamento" | "comissoes" | "cliques" | "conversoes";

const formatBRL = (val: number) =>
  val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatNum = (val: number) => val.toLocaleString("pt-BR");
const formatPercent = (val: number) => `${val.toFixed(1)}%`;

/* ============================================================
   VARIANTS DE ANIMAÇÃO DO DASHBOARD
   ============================================================ */
const containerVars: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVars: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/* ============================================================
   MAPA DE CORES ESTÁTICAS PARA O TAILWIND CSS
   ============================================================ */
const colorStyles: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
  slate: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
};

/* ============================================================
   COMPONENTE PRINCIPAL: AnalyticsPage
   ============================================================ */
interface AnalyticsPageProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

export function AnalyticsPage({ isDark, setIsDark }: AnalyticsPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [platform, setPlatform] = useState<string>("all");
  const [activeMetric, setActiveMetric] = useState<MetricType>("faturamento");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");

  const kpis = useMemo(() => {
    return {
      faturamento: { current: 32450.0, previous: 28100.0, trend: "up" },
      comissoes: { current: 4850.0, previous: 4100.0, trend: "up" },
      cliques: { current: 15420, previous: 16100, trend: "down" },
      conversao: { current: 3.2, previous: 2.8, trend: "up" },
      ticketMedio: { current: 145.2, previous: 142.0, trend: "up" },
    };
  }, [dateRange, platform]);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(
      (p) =>
        (platform === "all" || p.platform === platform) &&
        p.name.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [platform, searchProduct]);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* CABEÇALHO PADRONIZADO COM O DASHBOARD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Análises</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tenha uma visão detalhada do desempenho do seu negócio e transforme dados em decisões.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </motion.div>

      {/* FILTROS GERAIS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/40 outline-none"
            >
              <option value="today">Hoje</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="90days">Últimos 90 dias</option>
              <option value="thisMonth">Este mês</option>
              <option value="lastMonth">Mês anterior</option>
            </select>
          </div>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/40 outline-none"
          >
            <option value="all">Todas as plataformas</option>
            {MOCK_PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Exportar relatório
        </button>
      </motion.div>

      {/* KPIS COM STAGGER ANIMATION */}
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <KpiCard title="Faturamento" value={formatBRL(kpis.faturamento.current)} prevValue={formatBRL(kpis.faturamento.previous)} trend={kpis.faturamento.trend} icon={DollarSign} color="blue" />
        <KpiCard title="Comissões" value={formatBRL(kpis.comissoes.current)} prevValue={formatBRL(kpis.comissoes.previous)} trend={kpis.comissoes.trend} icon={Activity} color="green" />
        <KpiCard title="Cliques" value={formatNum(kpis.cliques.current)} prevValue={formatNum(kpis.cliques.previous)} trend={kpis.cliques.trend} icon={MousePointerClick} color="purple" />
        <KpiCard title="Taxa de Conversão" value={formatPercent(kpis.conversao.current)} prevValue={formatPercent(kpis.conversao.previous)} trend={kpis.conversao.trend} icon={Percent} color="orange" />
        <KpiCard title="Ticket Médio" value={formatBRL(kpis.ticketMedio.current)} prevValue={formatBRL(kpis.ticketMedio.previous)} trend={kpis.ticketMedio.trend} icon={ShoppingCart} color="slate" />
      </motion.div>

      {/* GRÁFICO PRINCIPAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mb-6"
      >
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Desempenho Geral</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Evolução diária no período selecionado</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(["faturamento", "comissoes", "cliques", "conversoes"] as MetricType[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  activeMetric === metric
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
        <div
          className="h-[300px] w-full focus:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none"
          tabIndex={-1}
          style={{ outline: "none" }}
        >
          <ResponsiveContainer width="100%" height="100%" debounce={300}>
            <LineChart
              data={MOCK_SALES_DATA}
              margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
              style={{ outline: "none" }}
            >
              <defs>
                <filter id="lineShadow-analytics" x="-100%" y="-100%" width="300%" height="300%">
                  <feDropShadow dx="4" dy="6" stdDeviation="25" floodColor="#3b82f660" />
                </filter>
                <filter id="dotShadow-analytics" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={10}
                tickFormatter={(val) => new Date(val).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
                tickMargin={8}
                width={65}
                tickCount={6}
                tickFormatter={(val) =>
                  activeMetric === "faturamento" || activeMetric === "comissoes"
                    ? `R$ ${val / 1000}k`
                    : val
                }
              />
              <RechartsTooltip
                content={<CustomTooltip activeMetric={activeMetric} />}
                cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
              />
              <Line
                type="monotone"
                dataKey={activeMetric}
                stroke="#3b82f6"
                strokeWidth={2}
                filter="url(#lineShadow-analytics)"
                dot={false}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                activeDot={{
                  r: 6,
                  fill: "#3b82f6",
                  stroke: "white",
                  strokeWidth: 2,
                  filter: "url(#dotShadow-analytics)",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* SEÇÕES INFERIORES: DIVIDIDAS EM 50% / 50% COM ESPAÇAMENTO REFORÇADO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        {/* PLATAFORMAS (GRÁFICO MULTI-LINHAS) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center gap-2.5 pt-2 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Distribuição por Plataforma
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Evolução do faturamento por plataforma no período
                </p>
              </div>
            </div>

            {/* CONTAINER DO GRÁFICO */}
            <ChartContainer
              config={platformChartConfig}
              className="h-[250px] w-full mt-4 mb-4 focus:outline-none [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-300 dark:[&_.recharts-curve.recharts-tooltip-cursor]:stroke-gray-700"
              style={{ outline: "none" }}
            >
              <LineChart
                data={MOCK_PLATFORM_TREND_DATA}
                margin={{ top: 25, right: 20, left: 20, bottom: 0 }}
                style={{ outline: "none" }}
              >
                <CartesianGrid
                  strokeDasharray="4 8"
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-800 opacity-60"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-gray-500 dark:text-gray-400"
                  tickMargin={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-gray-500 dark:text-gray-400"
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(1)}k`}
                  tickMargin={8}
                  width={65}
                  domain={[0, "dataMax + 2500"]}
                />
                <RechartsTooltip
                  content={<PlatformTrendTooltip />}
                  cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
                />
                <Line
                  type="monotone"
                  dataKey="amazon"
                  stroke="var(--color-amazon)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="mercadoLivre"
                  stroke="var(--color-mercadoLivre)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="shopee"
                  stroke="var(--color-shopee)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="magalu"
                  stroke="var(--color-magalu)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={900}
                />
              </LineChart>
            </ChartContainer>

            {/* LEGENDA PADRONIZADA */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <PlatformLegendItem label="Amazon" color={platformChartConfig.amazon.color} />
              <PlatformLegendItem label="Mercado Livre" color={platformChartConfig.mercadoLivre.color} />
              <PlatformLegendItem label="Shopee" color={platformChartConfig.shopee.color} />
              <PlatformLegendItem label="Magalu" color={platformChartConfig.magalu.color} />
            </div>
          </div>
        </div>

        {/* PRODUTOS TOP (OCUPA 50% DA LARGURA) */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Produtos com Melhor Desempenho</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="pb-3 font-medium">Produto</th>
                    <th className="pb-3 font-medium">Plataforma</th>
                    <th className="pb-3 font-medium text-right">Cliques</th>
                    <th className="pb-3 font-medium text-right">Vendas</th>
                    <th className="pb-3 font-medium text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{p.platform}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{formatNum(p.cliques)}</td>
                      <td className="py-3 text-right text-gray-600 dark:text-gray-300">{formatNum(p.vendas)}</td>
                      <td className="py-3 text-right font-medium text-green-600 dark:text-green-400">{formatBRL(p.comissao)}</td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-gray-500">Nenhum produto encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExportModalOpen && (
          <ExportModal onClose={() => setIsExportModalOpen(false)} dateRange={dateRange} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES E TOOLTIPS
   ============================================================ */

function KpiCard({ title, value, prevValue, trend, icon: Icon, color }: any) {
  const isUp = trend === "up";
  const badgeStyle = colorStyles[color] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

  return (
    <motion.div
      variants={itemVars}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${badgeStyle}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`flex items-center text-[10px] font-medium ${isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">vs {prevValue} anterior</span>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label, activeMetric }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isMoney = activeMetric === "faturamento" || activeMetric === "comissoes";
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[140px]">
        <div className="flex items-center gap-2 text-sm">
          <div className="size-1.5 rounded-full bg-blue-500" />
          <span className="text-gray-500 dark:text-gray-400 capitalize">{activeMetric}:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {isMoney ? formatBRL(val) : formatNum(val)}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
          {new Date(label).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })}
        </p>
      </div>
    );
  }
  return null;
};

const PlatformTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-lg min-w-[170px]">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            const config = platformChartConfig[entry.dataKey as keyof typeof platformChartConfig];
            return (
              <div key={index} className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-500 dark:text-gray-400">{config?.label || entry.dataKey}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatBRL(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const PlatformLegendItem = ({ label, color }: { label: string; color: string }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
      <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
};

function ExportModal({ onClose, dateRange }: { onClose: () => void; dateRange: string }) {
  const [reportType, setReportType] = useState("completo");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const wb = XLSX.utils.book_new();

      const resumoData = [{
        "Período Analisado": dateRange,
        "Faturamento Total": 32450.0,
        "Comissões": 4850.0,
        "Cliques": 15420,
        "Conversões": 490,
        "Taxa Conversão (%)": 3.2,
        "Ticket Médio": 145.2
      }];
      const wsResumo = XLSX.utils.json_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      const vendasData = MOCK_SALES_DATA.map(v => ({
        "Data": v.date,
        "Faturamento (R$)": v.faturamento,
        "Comissão (R$)": v.comissoes,
        "Cliques": v.cliques,
        "Conversões": v.conversoes
      }));
      const wsVendas = XLSX.utils.json_to_sheet(vendasData);
      XLSX.utils.book_append_sheet(wb, wsVendas, "Evolução Diária");

      const produtosData = MOCK_PRODUCTS.map(p => ({
        "Produto": p.name,
        "Plataforma": p.platform,
        "Cliques": p.cliques,
        "Vendas": p.vendas,
        "Comissão (R$)": p.comissao,
        "Taxa Conv. (%)": ((p.vendas / p.cliques) * 100).toFixed(2)
      }));
      const wsProdutos = XLSX.utils.json_to_sheet(produtosData);
      XLSX.utils.book_append_sheet(wb, wsProdutos, "Produtos");

      const platformData = MOCK_PLATFORM_TREND_DATA.map(p => ({
        "Data": p.date,
        "Amazon (R$)": p.amazon,
        "Mercado Livre (R$)": p.mercadoLivre,
        "Shopee (R$)": p.shopee,
        "Magalu (R$)": p.magalu
      }));
      const wsPlatform = XLSX.utils.json_to_sheet(platformData);
      XLSX.utils.book_append_sheet(wb, wsPlatform, "Plataformas");

      const today = new Date().toISOString().split("T")[0];
      const filename = `Scallora_Analises_${reportType}_${today}.xlsx`;
      XLSX.writeFile(wb, filename);

      onClose();
    } catch (error) {
      console.error("Erro na exportação:", error);
      alert("Ocorreu um erro ao gerar o arquivo Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold">Exportar Relatório Excel</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de relatório</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
              <option value="completo">Relatório Completo (Múltiplas abas)</option>
              <option value="vendas">Apenas Vendas</option>
              <option value="produtos">Apenas Produtos</option>
            </select>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            O relatório respeitará o período atual selecionado na tela de análises. O download iniciará automaticamente após a geração.
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleExport} disabled={isExporting} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
            {isExporting ? "Gerando planilha..." : "Baixar .xlsx"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AnalyticsPage;