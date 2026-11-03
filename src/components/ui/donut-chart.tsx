// src/components/ui/donut-chart.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface DonutChartSegment {
  value: number;
  color: string;
  label: string;
  [key: string]: any;
}

interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartSegment[];
  totalValue?: number;
  size?: number;
  strokeWidth?: number;
  animationDuration?: number;
  animationDelayPerSegment?: number;
  highlightOnHover?: boolean;
  centerContent?: React.ReactNode;
  activeLabel?: string | null;
  onSegmentHover?: (segment: DonutChartSegment | null) => void;
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data,
      totalValue: propTotalValue,
      size = 230,
      strokeWidth = 24,
      animationDuration = 1,
      animationDelayPerSegment = 0.05,
      highlightOnHover = true,
      centerContent,
      activeLabel,
      onSegmentHover,
      className,
      ...props
    },
    ref
  ) => {
    const [internalHoveredSegment, setInternalHoveredSegment] =
      React.useState<DonutChartSegment | null>(null);

    const currentHovered = React.useMemo(() => {
      if (activeLabel !== undefined && activeLabel !== null) {
        return data.find((d) => d.label === activeLabel) || null;
      }
      return internalHoveredSegment;
    }, [activeLabel, internalHoveredSegment, data]);

    const internalTotalValue = React.useMemo(
      () =>
        propTotalValue || data.reduce((sum, segment) => sum + segment.value, 0),
      [data, propTotalValue]
    );

    const padding = 12;
    const radius = size / 2 - strokeWidth / 2 - padding;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    React.useEffect(() => {
      onSegmentHover?.(internalHoveredSegment);
    }, [internalHoveredSegment, onSegmentHover]);

    const handleMouseLeave = () => {
      setInternalHoveredSegment(null);
      if (activeLabel === undefined) {
        onSegmentHover?.(null);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("relative flex items-center justify-center select-none", className)}
        style={{ width: size, height: size }}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible -rotate-90"
        >
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-gray-200/50 dark:text-gray-800/50"
            strokeWidth={strokeWidth}
          />

          {/* Data Segments */}
          <AnimatePresence>
            {data.map((segment, index) => {
              if (segment.value === 0) return null;

              const percentage =
                internalTotalValue === 0
                  ? 0
                  : (segment.value / internalTotalValue) * 100;

              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = (cumulativePercentage / 100) * circumference;

              const isActive = currentHovered?.label === segment.label;
              const isAnyActive = currentHovered !== null;

              cumulativePercentage += percentage;

              return (
                <motion.circle
                  key={segment.label || index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  initial={{ opacity: 0, strokeDashoffset: circumference, strokeWidth }}
                  animate={{
                    opacity: isAnyActive ? (isActive ? 1 : 0.35) : 1,
                    strokeDashoffset: -strokeDashoffset,
                    strokeWidth: isActive ? strokeWidth + 4 : strokeWidth,
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    strokeWidth: { duration: 0.2, ease: "easeOut" },
                    strokeDashoffset: {
                      duration: animationDuration,
                      delay: index * animationDelayPerSegment,
                      ease: "easeOut",
                    },
                  }}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  className={cn(
                    "origin-center transition-all duration-200 pointer-events-auto",
                    highlightOnHover && "cursor-pointer"
                  )}
                  style={{
                    transformOrigin: `${size / 2}px ${size / 2}px`,
                    filter: isActive
                      ? `drop-shadow(0px 0px 8px ${segment.color}) brightness(1.15)`
                      : "none",
                  }}
                  onMouseEnter={() => setInternalHoveredSegment(segment)}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Center Content */}
        {centerContent && (
          <div
            className="absolute flex flex-col items-center justify-center pointer-events-none"
            style={{
              width: size - strokeWidth * 2.5,
              height: size - strokeWidth * 2.5,
            }}
          >
            {centerContent}
          </div>
        )}
      </div>
    );
  }
);

DonutChart.displayName = "DonutChart";

export { DonutChart };