"use client";

import React, { useState, useEffect, useRef } from "react";

export const Cursor = ({ size = 60 }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const previousPos = useRef({ x: -size, y: -size });
  
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: -size, y: -size });

  useEffect(() => {
    // Desativa em mobile/touch
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const animate = () => {
      if (!cursorRef.current) return;
      const currentX = previousPos.current.x;
      const currentY = previousPos.current.y;
      const targetX = position.x - size / 2;
      const targetY = position.y - size / 2;
      
      const newX = currentX + (targetX - currentX) * 0.2;
      const newY = currentY + (targetY - currentY) * 0.2;

      previousPos.current = { x: newX, y: newY };
      cursorRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      requestRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setVisible(true);
      setPosition({ x: e.clientX, y: e.clientY });
    };
    const handleMouseLeave = () => setVisible(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.body.style.cursor = "none";
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      document.body.style.cursor = "auto";
    };
  }, [position.x, position.y, size]);

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none rounded-full bg-white mix-blend-difference z-[100] transition-opacity duration-300"
      style={{ width: size, height: size, opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    />
  );
};