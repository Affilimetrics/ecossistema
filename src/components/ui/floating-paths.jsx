"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Constantes FORA do componente — referência nunca muda,
// o Framer Motion NUNCA reinicia a animação.
const PATH_INITIAL = { pathLength: 0.3, opacity: 0.6 };

const PATH_ANIMATE = {
  pathLength: 1,
  opacity: [0.3, 0.6, 0.3],
  pathOffset: [0, 1, 0],
};

export function FloatingPathsBackground({ position, children, className }) {
  const paths = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const duration = 25 + (i % 6) * 3;

        return {
          id: i,
          d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
          } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
          } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
          } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
          width: 0.5 + i * 0.03,
          opacity: 0.1 + i * 0.03,
          // transition embutida no path → referência estável
          transition: {
            duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          },
        };
      }),
    [position]
  );

  return (
    <div className={cn("w-full relative overflow-hidden", className)}>
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full text-slate-950 dark:text-white"
          viewBox="0 0 696 316"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.width}
              strokeOpacity={path.opacity}
              initial={PATH_INITIAL}
              animate={PATH_ANIMATE}
              transition={path.transition}
            />
          ))}
        </svg>
      </div>
      {children}
    </div>
  );
}

export default FloatingPathsBackground;