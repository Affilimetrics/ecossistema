import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

export function FloatingPathsBackground({ position, children, className }) {
  // useMemo evita recalcular (e reiniciar) as animações a cada re-render
  const paths = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
          380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
          152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
          684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.03,
        duration: 20 + Math.random() * 10,
      })),
    [position],
  );

  // Em vez de anexar o portal no FINAL do <body> (ordem imprevisível frente
  // ao #root e a qualquer background que o CssBaseline/tema MUI aplique),
  // criamos um <div> dedicado e o inserimos como o PRIMEIRO filho do <body>.
  // Assim, por ordem natural do DOM (sem precisar de z-index), tudo que a
  // MUI renderiza dentro de #root pinta por cima dele automaticamente.
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.setAttribute('data-floating-paths-bg', '');
    document.body.insertBefore(node, document.body.firstChild);
    setPortalNode(node);
    return () => {
      node.remove();
    };
  }, []);

  const backgroundNode = (
    <div className={cn('fixed inset-0 pointer-events-none', className)}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
              strokeOpacity={0.1 + path.id * 0.03}
              initial={{ pathLength: 0.3, opacity: 0.6 }}
              animate={{
                pathLength: 1,
                opacity: [0.3, 0.6, 0.3],
                pathOffset: [0, 1, 0],
              }}
              transition={{
                duration: path.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );

  return (
    <>
      {portalNode && createPortal(backgroundNode, portalNode)}
      {children}
    </>
  );
}

FloatingPathsBackground.propTypes = {
  position: PropTypes.number.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default FloatingPathsBackground;