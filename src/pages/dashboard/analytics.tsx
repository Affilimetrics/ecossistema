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
  PieChart as PieChartIcon,
  Search,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { NotificationPopover } from "../../components/ui/notification-popover";
import { UserNav } from "../../components/ui/user-nav";
import { AnimatedThemeToggler } from "../../components/ui/animated-theme-toggler";
import { DonutChart, DonutChartSegment } from "../../components/ui/donut-chart";
import { Card, CardContent } from "../../components/ui/card";

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

const MOCK_PLATFORM_PERFORMANCE: DonutChartSegment[] = [
  { label: "Amazon", value: 12500, color: "hsl(38 92% 50%)" },
  { label: "Mercado Livre", value: 9800, color: "hsl(48 96% 53%)" },
  { label: "Shopee", value: 6400, color: "hsl(25 95% 53%)" },
  { label: "Magalu", value: 4200, color: "hsl(217 91% 60%)" },
];

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

  const [hoveredSegment, setHoveredSegment] = useState<DonutChartSegment | null>(null);

  const totalPlatformValue = useMemo(
    () => MOCK_PLATFORM_PERFORMANCE.reduce((sum, d) => sum + d.value, 0),
    []
  );

  const displayValue = hoveredSegment?.value ?? totalPlatformValue;
  const displayLabel = hoveredSegment?.label ?? "Faturamento Total";
  const displayPercentage = hoveredSegment
    ? (hoveredSegment.value / totalPlatformValue) * 100
    : 100;

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
      {/* CABEÇALHO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Análises</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tenha uma visão detalhada do desempenho do seu negócio e transforme dados em decisões.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NotificationPopover isDark={isDark} />
          <AnimatedThemeToggler />
          <UserNav />
        </div>
      </div>

      {/* FILTROS GERAIS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
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
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard title="Faturamento" value={formatBRL(kpis.faturamento.current)} prevValue={formatBRL(kpis.faturamento.previous)} trend={kpis.faturamento.trend} icon={DollarSign} color="blue" />
        <KpiCard title="Comissões" value={formatBRL(kpis.comissoes.current)} prevValue={formatBRL(kpis.comissoes.previous)} trend={kpis.comissoes.trend} icon={Activity} color="green" />
        <KpiCard title="Cliques" value={formatNum(kpis.cliques.current)} prevValue={formatNum(kpis.cliques.previous)} trend={kpis.cliques.trend} icon={MousePointerClick} color="purple" />
        <KpiCard title="Taxa de Conversão" value={formatPercent(kpis.conversao.current)} prevValue={formatPercent(kpis.conversao.previous)} trend={kpis.conversao.trend} icon={Percent} color="orange" />
        <KpiCard title="Ticket Médio" value={formatBRL(kpis.ticketMedio.current)} prevValue={formatBRL(kpis.ticketMedio.previous)} trend={kpis.ticketMedio.trend} icon={ShoppingCart} color="slate" />
      </div>

      {/* GRÁFICO PRINCIPAL */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mb-6">
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
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_SALES_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(val) => activeMetric === "faturamento" || activeMetric === "comissoes" ? `R$ ${val / 1000}k` : val} />
              <RechartsTooltip content={<CustomTooltip activeMetric={activeMetric} />} cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }} />
              <Line type="monotone" dataKey={activeMetric} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEÇÕES INFERIORES */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        
        {/* PLATAFORMAS (DonutChart) */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-5">
            <div className="w-full flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-blue-500" />
                  Distribuição por Plataforma
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Faturamento acumulado no período
                </p>
              </div>
            </div>

            {/* DONUT CHART */}
            <div className="relative flex items-center justify-center">
              <DonutChart
                data={MOCK_PLATFORM_PERFORMANCE}
                size={230}
                strokeWidth={28}
                animationDuration={1.2}
                animationDelayPerSegment={0.05}
                highlightOnHover={true}
                activeLabel={hoveredSegment?.label}
                onSegmentHover={(s) => setHoveredSegment(s)}
                centerContent={
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={displayLabel}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: "circOut" }}
                      className="flex flex-col items-center justify-center text-center"
                    >
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate max-w-[150px]">
                        {displayLabel}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatBRL(displayValue)}
                      </p>
                      {hoveredSegment && (
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          [{displayPercentage.toFixed(0)}%]
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            {/* LEGENDA */}
            <div className="flex flex-col space-y-1 w-full pt-3 border-t border-gray-100 dark:border-gray-800">
              {MOCK_PLATFORM_PERFORMANCE.map((segment, index) => {
                const isActive = hoveredSegment?.label === segment.label;
                return (
                  <motion.div
                    key={segment.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
                    className={`flex items-center justify-between p-2 rounded-md transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800/80"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                    onMouseEnter={() => setHoveredSegment(segment)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                        {segment.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {formatBRL(segment.value)}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded tabular-nums">
                        {((segment.value / totalPlatformValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* PRODUTOS TOP */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
          
          <div className="flex-1 overflow-x-auto">
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

      <AnimatePresence>
        {isExportModalOpen && (
          <ExportModal onClose={() => setIsExportModalOpen(false)} dateRange={dateRange} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES E MODAL
   ============================================================ */

function KpiCard({ title, value, prevValue, trend, icon: Icon, color }: any) {
  const isUp = trend === "up";
  return (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <span className={`flex items-center text-[10px] font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
          {isUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">vs {prevValue} anterior</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, activeMetric }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const isMoney = activeMetric === "faturamento" || activeMetric === "comissoes";
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg shadow-lg">
        <p className="text-xs text-gray-500 mb-1">{new Date(label).toLocaleDateString("pt-BR")}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
          {activeMetric}: <span className="text-blue-600">{isMoney ? formatBRL(val) : formatNum(val)}</span>
        </p>
      </div>
    );
  }
  return null;
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

      const platformData = MOCK_PLATFORM_PERFORMANCE.map(p => ({
        "Plataforma": p.label,
        "Faturamento (R$)": p.value
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