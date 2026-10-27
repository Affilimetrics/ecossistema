import React from "react";
import Navbar from "@/components/ui/navbar";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";
import FeaturesSection from "@/components/ui/features";
import Pricing18 from "@/components/ui/block-pricing-18";

export default function MarketingPage() {
  return (
    <div
      id="top"
      className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden"
    >
      {/* Navbar Fixa no Topo */}
      <Navbar />

      {/* Hero Cinematográfico com Cursor Invertido Restrito e Card à Direita */}
      <CinematicHero />

      {/* Recursos da Plataforma */}
      <FeaturesSection />

      {/* Tabela de Planos */}
      <Pricing18 />

      {/* Rodapé Comercial */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-sm">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
              S
            </div>
            <span className="font-bold text-white text-base">Scallora</span>
          </div>
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Scallora. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-xs font-medium">
            <a href="#recursos" className="hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
            <a href="/" className="hover:text-white transition-colors">
              Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}