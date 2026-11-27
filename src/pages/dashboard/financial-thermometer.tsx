import { useEffect, useMemo, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";
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
    hubBorderHex: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    summary: string;
    icon: typeof Flame;
  }
> = {
  critical: {
    label: "Crítico",
    hubBorderHex: "#ef4444", // red-500
    badgeBg: "bg-red-500/8 dark:bg-red-500/12",
    badgeText: "text-red-700 dark:text-red-400",
    badgeBorder: "border-red-500/20",
    summary: "Volume de cliques e conversões abaixo do esperado para o período.",
    icon: AlertTriangle,
  },
  warning: {
    label: "Atenção",
    hubBorderHex: "#f59e0b", // amber-500
    badgeBg: "bg-amber-500/8 dark:bg-amber-500/12",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
    summary: "Há fluxo de tráfego, mas a conversão em vendas ainda apresenta margem de ajuste.",
    icon: AlertTriangle,
  },
  healthy: {
    label: "Saudável",
    hubBorderHex: "#10b981", // emerald-500
    badgeBg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    summary: "Operação equilibrada, com ritmo constante de tráfego e comissões recorrentes.",
    icon: CheckCircle2,
  },
  excellent: {
    label: "Excelente",
    hubBorderHex: "#10b981", // emerald-500
    badgeBg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    badgeText: "text-emerald-700 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    summary: "Desempenho elevado em tráfego, consistência e conversão de ofertas.",
    icon: Flame,
  },
};

function computeHealthLevel(score: number): HealthLevel {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
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
  duration = 0.95,
}: {
  target: number;
  duration?: number;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(prefersReducedMotion ? target : 0);
  const [display, setDisplay] = useState(prefersReducedMotion ? Math.round(target) : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(target);
      setDisplay(Math.round(target));
      return;
    }

    const controls = animate(count, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [target, duration, count, prefersReducedMotion]);

  return <span className="tabular-nums">{display}</span>;
};

const GaugeArc = ({
  score,
  level,
  hubBorderColor,
}: {
  score: number;
  level: HealthLevel;
  hubBorderColor: string;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const clampedScore = Math.max(0, Math.min(100, score));

  // Geometria solicitada: viewBox 240x160, pivô em (120, 130), raio ~96, espessura ~16
  const cx = 120;
  const cy = 130;
  const radius = 94;
  const stroke = 16;
  const hubRadius = 28;

  // Converte score (0..100) em ponto (x, y) no semicírculo superior
  const polarToCartesian = (pct: number, r = radius) => {
    const angleRad = Math.PI * (1 - pct / 100);
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy - r * Math.sin(angleRad),
    };
  };

  const describeSegment = (startPct: number, endPct: number) => {
    const start = polarToCartesian(startPct);
    const end = polarToCartesian(endPct);
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  // Vão uniforme de ~1.5° (0.83% de 180°) entre as 3 zonas
  const gapPct = 0.83;
  const zones = [
    {
      id: "red" as const,
      start: 0,
      end: 40 - gapPct / 2,
      color: "#ef4444", // red-500
      active: clampedScore < 40,
    },
    {
      id: "yellow" as const,
      start: 40 + gapPct / 2,
      end: 70 - gapPct / 2,
      color: "#f59e0b", // amber-500
      active: clampedScore >= 40 && clampedScore < 70,
    },
    {
      id: "green" as const,
      start: 70 + gapPct / 2,
      end: 100,
      color: "#10b981", // emerald-500
      active: clampedScore >= 70,
    },
  ];

  // Rótulos externos nos limites das zonas (0, 40, 70, 100)
  const boundaryMarkers = [
    { value: 0, pct: 0, anchor: "end" as const, dx: -4, dy: 3 },
    { value: 40, pct: 40, anchor: "end" as const, dx: -2, dy: -2 },
    { value: 70, pct: 70, anchor: "start" as const, dx: 2, dy: -2 },
    { value: 100, pct: 100, anchor: "start" as const, dx: 4, dy: 3 },
  ];

  // Ângulo alvo: -90° (esquerda, score 0) até +90° (direita, score 100)
  const targetAngle = -90 + clampedScore * 1.8;
  const needleAngle = useMotionValue(prefersReducedMotion ? targetAngle : -90);

  useEffect(() => {
    if (prefersReducedMotion) {
      needleAngle.set(targetAngle);
      return;
    }

    const controls = animate(needleAngle, targetAngle, {
      duration: 0.95,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [targetAngle, needleAngle, prefersReducedMotion]);

  // Calcula os vértices (x, y) do polígono da agulha diretamente a partir do ângulo,
  // evitando depender de transformOrigin em elementos SVG internos.
  const needlePoints = useTransform(needleAngle, (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const perpX = -sin;
    const perpY = cos;

    // Ponta chega exatamente até a borda interna da faixa colorida (radius - stroke / 2 - 2)
    const tipLength = radius - stroke / 2 - 2; // 84px
    // Contrapeso curto do lado oposto do pivô (aparece levemente atrás do hub se necessário ou estabiliza o eixo)
    const tailLength = 14;
    const halfBaseWidth = 4.5;

    const tipX = cx + tipLength * cos;
    const tipY = cy + tipLength * sin;

    const leftX = cx + halfBaseWidth * perpX;
    const leftY = cy + halfBaseWidth * perpY;

    const tailX = cx - tailLength * cos;
    const tailY = cy - tailLength * sin;

    const rightX = cx - halfBaseWidth * perpX;
    const rightY = cy - halfBaseWidth * perpY;

    return `${tipX.toFixed(2)},${tipY.toFixed(2)} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${tailX.toFixed(2)},${tailY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}`;
  });

  const levelLabel = LEVEL_CONFIG[level].label;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedScore}
      aria-label="Score geral da operação"
      className="relative w-full max-w-[260px] mx-auto select-none"
    >
      <span className="sr-only">
        {clampedScore} de 100, nível {levelLabel}
      </span>

      <svg
        viewBox="0 0 240 160"
        width="100%"
        className="block overflow-visible"
        aria-hidden="true"
      >
        {/* 1. Arco dividido em 3 faixas de cor com pontas retas */}
        {zones.map((zone) => (
          <path
            key={zone.id}
            d={describeSegment(zone.start, zone.end)}
            fill="none"
            stroke={zone.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            style={{
              opacity: zone.active ? 1 : 0.3,
              transition: "opacity 300ms ease",
            }}
          />
        ))}

        {/* 2. Rótulos externos nos limites (0, 40, 70, 100) */}
        {boundaryMarkers.map((marker) => {
          const pos = polarToCartesian(marker.pct, radius + stroke / 2 + 8);
          return (
            <text
              key={marker.value}
              x={pos.x + marker.dx}
              y={pos.y + marker.dy}
              textAnchor={marker.anchor}
              className="fill-gray-400 dark:fill-gray-500 text-[10px] font-medium tabular-nums"
            >
              {marker.value}
            </text>
          );
        })}

        {/* 3. Agulha afilada que nasce no pivô (120, 130) — desenhada ANTES do hub para sair por trás */}
        <motion.polygon
          points={needlePoints}
          fill="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className="text-gray-900 dark:text-gray-100 stroke-white dark:stroke-gray-900"
        />

        {/* 4. Hub circular no pivô (raio 28) com borda na cor da zona atual */}
        <circle
          cx={cx}
          cy={cy}
          r={hubRadius}
          stroke={hubBorderColor}
          strokeWidth={2}
          className="fill-white dark:fill-gray-900 transition-colors duration-300"
        />
      </svg>

      {/* Número centralizado exatamente sobre o hub (pivô em 50% X, 81.25% Y do viewBox 240x160) */}
      <div
        aria-hidden="true"
        style={{ left: "50%", top: "81.25%" }}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center"
      >
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-50 leading-none">
          <AnimatedNumber target={clampedScore} duration={0.95} />
        </span>
        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none mt-0.5">
          /100
        </span>
      </div>
    </div>
  );
};

const FactorRow = ({ factor }: { factor: FinancialFactorInput }) => {
  const Icon = FACTOR_ICONS[factor.id];
  const clampedValue = Math.max(0, Math.min(100, factor.value));
  const hasRealDelta = Boolean(factor.delta && factor.delta.trim().length > 0);

  const barTone =
    clampedValue >= 70
      ? "bg-emerald-500/85 dark:bg-emerald-400/80"
      : clampedValue >= 40
      ? "bg-amber-500/85 dark:bg-amber-400/80"
      : "bg-red-500/85 dark:bg-red-400/80";

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

      {/* Velocímetro com Agulha Central e Hub */}
      <div className="my-3 flex flex-col items-center">
        <GaugeArc
          score={clampedScore}
          level={level}
          hubBorderColor={config.hubBorderHex}
        />

        {/* Legenda das 3 faixas com intervalos */}
        <div className="flex items-center justify-center gap-3.5 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>0–39</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>40–69</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>70–100</span>
          </span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2.5 leading-relaxed max-w-[270px]">
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