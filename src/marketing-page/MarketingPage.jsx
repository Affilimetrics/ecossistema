import React from "react";
import Cursor from "@/components/ui/inverted-cursor";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import Pricing18 from "@/components/ui/block-pricing-18";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Cursor personalizado funcional em toda a landing page */}
      <Cursor size={60} />

      {/* Hero Section Cinematográfica */}
      <CinematicHero />

      {/* Seção de Tabela de Preços */}
      <Pricing18 />
    </div>
  );
}