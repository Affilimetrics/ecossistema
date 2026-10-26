import { useState } from "react";
import { motion } from "framer-motion";
import {
  Thermometer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Info,
} from "lucide-react";

/* ============================================================
   TIPOS E CONFIGURAÇÕES
   ============================================================ */

export type HealthLevel = "critical" | "warning" | "healthy" | "excellent";

interface HealthFactor {
  label: string;
  value: number; // 0 a 100
  hint: string;
}

interface FinancialThermometerProps {
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

const LEVEL_STYLES: Record<
  HealthLevel,
  {
    label: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    description: string;
    icon: typeof Flame;
  }
> = {
  critical: {
    label: "Crítico",
    color: "#ef4444",
    badgeBg: "bg-red-500/10 dark:bg-red-500/20",
    badgeText: "text-red-600 dark:text-red-400",
    description: "Seus links estão recebendo poucos cliques e conversões. Hora de trocar de estratégia!",
    icon: AlertTriangle,
  },
  warning: {
    label: "Atenção",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-600 dark:text-amber-400",
    description: "Você está gerando cliques, mas a conversão em vendas ainda precisa melhorar.",
    icon: AlertTriangle,
  },
  healthy: {
    label: "Saudável",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-600 dark:text-blue-400",
    description: "Sua operação de afiliado está constante! Bons cliques e comissões caindo.",
    icon: CheckCircle2,
  },
  excellent: {
    label: "Excelente",
    color: "#22c55e",
    badgeBg: "bg-green-500/10 dark:bg-green-500/20",
    badgeText: "text-green-600 dark:text-green-400",
    description: "Operação em alta temperatura! Suas divulgações estão convertendo super bem.",
    icon: Flame,
  },
};

/* ============================================================
   VISUAL DO TERMÔMETRO (ARCO GAUGE)
   ============================================================ */

const GaugeArc = ({ score, color, size = 200 }: { score: number; color: string; size?: number }) => {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <svg width={size} height={size / 1.7} viewBox={`0 0 ${size} ${size / 1.7}`} className="overflow-visible">
      <defs>
        <linearGradient id="affiliateTrack" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
          <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.25" />
        </linearGradient>
        <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Fundo do Arco */}
      <path
        d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke="url(#affiliateTrack)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />

      {/* Progresso Preenchido */}
      <motion.path
        d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        filter="url(#gaugeGlow)"
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${progress} ${circumference}` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
};

/* ============================================================
   BARRA DE MÉTRICA SIMPLES
   ============================================================ */

const SimpleFactorBar = ({ factor }: { factor: HealthFactor }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          {factor.label}
          <span className="text-[10px] text-gray-400 cursor-help" title={factor.hint}>
            <Info className="h-3 w-3 inline" />
          </span>
        </span>
        <span className="font-bold text-gray-900 dark:text-gray-100">{factor.value}%</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${factor.value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{
            backgroundColor:
              factor.value >= 75
                ? "#22c55e"
                : factor.value >= 50
                ? "#3b82f6"
                : factor.value >= 30
                ? "#f59e0b"
                : "#ef4444",
          }}
        />
      </div>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL (TERMÔMETRO PARA AFILIADOS)
   ============================================================ */

export default function FinancialThermometer({}: FinancialThermometerProps) {
  const [score] = useState<number>(76);

  const level: HealthLevel =
    score >= 85 ? "excellent" : score >= 65 ? "healthy" : score >= 40 ? "warning" : "critical";

  const config = LEVEL_STYLES[level];
  const LevelIcon = config.icon;

  const affiliateFactors: HealthFactor[] = [
    {
      label: "Cliques nos Links",
      value: 82,
      hint: "Mede o quanto as pessoas estão clicando nas suas divulgações.",
    },
    {
      label: "Taxa de Conversão",
      value: 64,
      hint: "Porcentagem de cliques que se transformaram em vendas reais.",
    },
    {
      label: "Consistência de Divulgação",
      value: 78,
      hint: "Frequência com que você publica novos links de afiliados.",
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 text-blue-500" />
            Termômetro de Afiliado
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Saúde da sua operação em tempo real
          </p>
        </div>
        <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <TrendingUp className="h-4 w-4" />
        </span>
      </div>

      {/* Visual do Termômetro / Gauge */}
      <div className="my-4 flex flex-col items-center justify-center relative">
        <GaugeArc score={score} color={config.color} size={190} />

        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 leading-none">
            {score}
            <span className="text-xs font-normal text-gray-400">/100</span>
          </span>

          <div
            className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}
          >
            <LevelIcon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        </div>
      </div>

      {/* Descrição resumida */}
      <p className="text-xs text-gray-600 dark:text-gray-300 text-center mb-4 leading-relaxed px-2">
        {config.description}
      </p>

      {/* Barras de fatores simples */}
      <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {affiliateFactors.map((f, i) => (
          <SimpleFactorBar key={i} factor={f} />
        ))}
      </div>

      {/* Dica para Iniciante */}
      <div className="mt-4 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight">
          <strong>Dica Pro:</strong> Foque em divulgar produtos com comissão acima de 20% para acelerar seus ganhos.
        </p>
      </div>
    </div>
  );
}