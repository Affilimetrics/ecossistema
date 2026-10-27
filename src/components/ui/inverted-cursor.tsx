"use client";

import React, { useEffect, useRef } from "react";

interface CursorProps {
  size?: number;
}

export const Cursor: React.FC<CursorProps> = ({ size = 70 }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const cursorElement = cursorRef.current;
    if (!cursorElement) return;

    const parent = cursorElement.parentElement;
    if (!parent) return;

    // Desativa em dispositivos de toque ou com redução de movimento
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (isTouchDevice || prefersReducedMotion) {
      cursorElement.style.display = "none";
      return;
    }

    let targetX = -size;
    let targetY = -size;
    let currentX = -size;
    let currentY = -size;
    let isVisible = false;

    const animate = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      if (cursorElement) {
        cursorElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      targetX = event.clientX - rect.left - size / 2;
      targetY = event.clientY - rect.top - size / 2;

      if (!isVisible) {
        isVisible = true;
        cursorElement.style.opacity = "1";
      }
    };

    const handleMouseEnter = () => {
      isVisible = true;
      cursorElement.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      isVisible = false;
      cursorElement.style.opacity = "0";
    };

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [size]);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-30 rounded-full bg-white mix-blend-difference opacity-0 transition-opacity duration-200"
      style={{
        width: size,
        height: size,
        willChange: "transform",
      }}
    />
  );
};

export default Cursor;