import { useEffect, useMemo, useState } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import {
  Thermometer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info,
  MousePointerClick,
  Percent,
  CalendarCheck2,
  Lightbulb,
} from "lucide-react";

export type HealthLevel = "critical" | "warning" | "healthy" | "excellent";

export interface FinancialFactorInput {
  id: "clicks" | "conversion" | "consistency";
  label: string;
  value: number;
  delta?: string | null;
  hint: string;
}

interface FinancialThermometerProps {
  score?: number;
  factors?: FinancialFactorInput[];
  isDark?: boolean;
  setIsDark?: (value: boolean) => void;
}

const DEFAULT_FACTORS: FinancialFactorInput[] = [
  {
    id: "clicks",
    label: "Cliques nos Links",
    value: 82,
    delta: "+14%",
    hint: "Volume de acessos gerados pelas suas divulgações.",
  },
  {
    id: "conversion",
    label: "Taxa de Conversão",
    value: 64,
    delta: "+6%",
    hint: "Percentual de cliques que resultaram em vendas confirmadas.",
  },
  {
    id: "consistency",
    label: "Consistência",
    value: 78,
    delta: "+9%",
    hint: "Regularidade na publicação de novos links de afiliado.",
  },
];

const FACTOR_ICONS: Record<FinancialFactorInput["id"], typeof MousePointerClick> = {
  clicks: MousePointerClick,
  conversion: Percent,
  consistency: CalendarCheck2,
};

const LEVEL_CONFIG: Record<
  HealthLevel,
  {
    label: string;
    arcStart: string;
    arcEnd: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    summary: string;
    icon: typeof Flame;
  }
> = {
  critical: {
    label: "Crítico",
    arcStart: "#f87171",
    arcEnd: "#dc2626",
    accent: "#dc2626",
    badgeBg: "bg-red-500/8 dark:bg-red-500/12",
    badgeText: "text-red-700 dark:text-red-400",
    badgeBorder: "border-red-500/20",
    summary: "Volume de cliques e conversões abaixo do esperado para o período.",
    icon: AlertTriangle,
  },
  warning: {
    label: "Atenção",
    arcStart: "#fbbf24",
    arcEnd: "#d97706",
    accent: "#d97706",
    badgeBg: "bg-amber-500/8 dark:bg-amber-500/12",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
    summary: "Há fluxo de tráfego, mas a conversão em vendas ainda apresenta margem de ajuste.",
    icon: AlertTriangle,
  },
  healthy: {
    label: "Saudável",
    arcStart: "#60a5fa",
    arcEnd: "#2563eb",
    accent: "#2563eb",
    badgeBg: "bg-blue-500/8 dark:bg-blue-500/12",
    badgeText: "text-blue-700 dark:text-blue-400",
    badgeBorder: "border-blue-500/20",
    summary: "Operação equilibrada, com ritmo constante de tráfego e comissões recorrentes.",
    icon: CheckCircle2,
  },
  excellent: {
    label: "Excelente",
    arcStart: "#34d399",
    arcEnd: "#059669",
    accent: "#059669",
    badgeBg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    summary: "Desempenho elevado em tráfego, consistência e conversão de ofertas.",
    icon: Flame,
  },
};

function computeHealthLevel(score: number): HealthLevel {
  if (score >= 85) return "excellent";
  if (score >= 65) return "healthy";
  if (score >= 40) return "warning";
  return "critical";
}

function generateOperationalInsight(factors: FinancialFactorInput[]): string {
  const clicks = factors.find((f) => f.id === "clicks")?.value ?? 0;
  const conversion = factors.find((f) => f.id === "conversion")?.value ?? 0;
  const consistency = factors.find((f) => f.id === "consistency")?.value ?? 0;

  if (clicks >= 70 && conversion < 55) {
    return "O volume de cliques está alto, mas a conversão indica atrito na oferta. Revise os produtos divulgados e a aderência das páginas de destino.";
  }

  if (conversion < 55) {
    return "A taxa de conversão é o principal ponto de alavancagem agora. Avalie a competitividade de preço e a qualidade das páginas de destino.";
  }

  if (consistency < 60) {
    return "A oscilação na frequência de divulgação reduz o alcance orgânico. Estabeleça uma cadência regular de novos links para estabilizar o retorno.";
  }

  if (clicks < 55) {
    return "A conversão está saudável, mas o volume de tráfego limita o faturamento. Amplie a distribuição dos links nos canais de maior resposta.";
  }

  if (clicks >= 75 && conversion >= 75 && consistency >= 75) {
    return "Tráfego, conversão e cadência operam em equilíbrio. Escale os produtos de maior margem mantendo a frequência atual.";
  }

  return "Bom ritmo de cliques e consistência. Priorizar ofertas com comissão acima de 20% pode elevar a eficiência do retorno sem aumentar o esforço.";
}

const AnimatedNumber = ({
  target,
  duration = 0.85,
}: {
  target: number;
  duration?: number;
}) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [target, duration, count]);

  return <span className="tabular-nums">{display}</span>;
};

const GaugeArc = ({
  score,
  startColor,
  endColor,
  accentColor,
  size = 204,
}: {
  score: number;
  startColor: string;
  endColor: string;
  accentColor: string;
  size?: number;
}) => {
  const stroke = 11;
  const radius = (size - stroke * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const progress = (clampedScore / 100) * circumference;

  const angleRad = Math.PI * (1 - clampedScore / 100);
  const knobX = cx + radius * Math.cos(angleRad);
  const knobY = cy - radius * Math.sin(angleRad);

  const ticks = Array.from({ length: 17 }, (_, i) => {
    const tAngle = Math.PI * (1 - i / 16);
    const innerR = radius - stroke / 2 - 5;
    const outerR = radius - stroke / 2 - (i % 4 === 0 ? 10 : 7.5);
    return {
      x1: cx + innerR * Math.cos(tAngle),
      y1: cy - innerR * Math.sin(tAngle),
      x2: cx + outerR * Math.cos(tAngle),
      y2: cy - outerR * Math.sin(tAngle),
      major: i % 4 === 0,
    };
  });

  return (
    <svg
      width={size}
      height={size / 1.72}
      viewBox={`0 0 ${size} ${size / 1.72}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="scalloraGaugeProgress" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
      </defs>

      {ticks.map((t, idx) => (
        <line
          key={idx}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="currentColor"
          strokeWidth={t.major ? 1.25 : 0.85}
          strokeLinecap="round"
          className={
            t.major
              ? "text-gray-300 dark:text-gray-700"
              : "text-gray-200 dark:text-gray-800"
          }
        />
      ))}

      {/* Trilho base neutro */}
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        className="text-gray-100 dark:text-gray-800/90"
      />

      {/* Arco de progresso refinado */}
      <motion.path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="url(#scalloraGaugeProgress)"
        strokeWidth={stroke}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${progress} ${circumference}` }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Marcador integrado à extremidade do arco */}
      <motion.g
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.35, ease: "easeOut" }}
      >
        <circle
          cx={knobX}
          cy={knobY}
          r={4.25}
          fill="#ffffff"
          stroke={accentColor}
          strokeWidth={2.25}
        />
      </motion.g>
    </svg>
  );
};

const FactorRow = ({ factor }: { factor: FinancialFactorInput }) => {
  const Icon = FACTOR_ICONS[factor.id];
  const clampedValue = Math.max(0, Math.min(100, factor.value));
  const hasRealDelta = Boolean(factor.delta && factor.delta.trim().length > 0);

  const barTone =
    clampedValue >= 75
      ? "bg-emerald-500/80 dark:bg-emerald-400/75"
      : clampedValue >= 55
      ? "bg-blue-500/80 dark:bg-blue-400/75"
      : "bg-amber-500/80 dark:bg-amber-400/75";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
          <span className="font-medium text-gray-600 dark:text-gray-300 truncate">
            {factor.label}
          </span>
          <span
            className="text-gray-400/80 hover:text-gray-600 dark:hover:text-gray-300 cursor-help shrink-0 transition-colors"
            title={factor.hint}
          >
            <Info className="h-3 w-3" />
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasRealDelta && (
            <span className="text-[11px] font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {factor.delta}
            </span>
          )}
          <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100 w-9 text-right">
            <AnimatedNumber target={clampedValue} duration={0.8} />%
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800/80 rounded-full h-1 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barTone}`}
        />
      </div>
    </div>
  );
};

export default function FinancialThermometer({
  score = 76,
  factors = DEFAULT_FACTORS,
}: FinancialThermometerProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const level = computeHealthLevel(clampedScore);
  const config = LEVEL_CONFIG[level];
  const LevelIcon = config.icon;

  const operationalInsight = useMemo(
    () => generateOperationalInsight(factors),
    [factors]
  );

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100 truncate">
              Termômetro Financeiro
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Índice de saúde da operação
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium shrink-0 ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
        >
          <LevelIcon className="h-3 w-3 shrink-0" />
          <span>{config.label}</span>
        </span>
      </div>

      {/* Velocímetro e Score Principal */}
      <div className="my-4 flex flex-col items-center">
        <div className="relative flex flex-col items-center justify-center">
          <GaugeArc
            score={clampedScore}
            startColor={config.arcStart}
            endColor={config.arcEnd}
            accentColor={config.accent}
            size={204}
          />

          <div className="absolute bottom-0.5 flex flex-col items-center">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Score Geral
            </span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-none">
                <AnimatedNumber target={clampedScore} duration={0.9} />
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                /100
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 leading-relaxed max-w-[270px]">
          {config.summary}
        </p>
      </div>

      {/* Indicadores Financeiros */}
      <div className="space-y-3.5 pt-4 border-t border-gray-100 dark:border-gray-800/90">
        {factors.map((factor) => (
          <FactorRow key={factor.id} factor={factor} />
        ))}
      </div>

      {/* Insight da Operação */}
      <div className="mt-5 p-3.5 rounded-md border border-gray-200/80 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 flex items-start gap-2.5">
        <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
            Insight da operação
          </p>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">
            {operationalInsight}
          </p>
        </div>
      </div>
    </div>
  );
}