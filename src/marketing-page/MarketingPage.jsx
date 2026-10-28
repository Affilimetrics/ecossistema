import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/ui/header-2";
import { Cursor } from "@/components/ui/inverted-cursor";
import RuixenFeaturedImageSection from "@/components/ui/ruixen-featured-image-section";
import Pricing18 from "@/components/ui/block-pricing-18";
import FeaturesSection from "@/components/ui/features"; // Opcional, caso queira usar

export default function MarketingPage() {
  return (
    <div id="top" className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">
      <Cursor />
      <Header />

      {/* Hero Section no padrão do Dashboard */}
      <section className="relative pt-40 pb-24 md:pt-52 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-800 bg-slate-900/50 text-xs font-medium text-slate-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            A nova era da gestão para afiliados
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
            Transforme dados em <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              decisões melhores.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Organize seus produtos, acompanhe comissões, descubra tendências e recupere vendas em uma única plataforma profissional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/25"
            >
              Começar gratuitamente
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white font-semibold transition-all"
            >
              Acessar minha conta
            </Link>
          </div>
        </div>
      </section>

      {/* Seção Interativa de Imagens */}
      <RuixenFeaturedImageSection />

      {/* Seção de Planos */}
      <Pricing18 />

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-blue-950/20 border-t border-slate-900" id="sobre">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Pronto para escalar seus resultados?</h2>
          <p className="text-slate-400 text-lg">Junte-se aos afiliados que já utilizam a inteligência de dados do Scallora.</p>
          <Link
            to="/sign-up"
            className="inline-block mt-4 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold transition-all shadow-md"
          >
            Criar conta agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-sm">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-content-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
              <svg width="14" height="auto" viewBox="0 0 50 39" fill="none" className="fill-white">
                <path d="M16.4992 2H37.5808L22.0816 24.9729H1L16.4992 2Z" />
                <path d="M17.4224 27.102L11.4192 36H33.5008L49 13.0271H32.7024L23.2064 27.102H17.4224Z" />
              </svg>
            </div>
            <span className="font-bold text-white text-base">Scallora</span>
          </div>
          <p className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Scallora. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-xs font-medium">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <Link to="/" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}