import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md transition-colors">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Scallora */}
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm shadow-md shadow-blue-500/20">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Scallora
            </span>
          </a>

          {/* Links Centrais */}
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a
              href="#top"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Início
            </a>
            <a
              href="#recursos"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Planos
            </a>
          </div>

          {/* Ações de Autenticação */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Entrar
            </Link>
            <Link
              to="/sign-up"
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-lg bg-gradient-to-b from-white via-white/95 to-white/80 text-slate-950 hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              Criar Conta
            </Link>
          </div>

          {/* Botão Mobile */}
          <button
            type="button"
            className="md:hidden text-slate-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Menu Responsivo Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 animate-[slideDown_0.3s_ease-out]">
          <div className="px-6 py-4 flex flex-col gap-4">
            <a
              href="#top"
              className="text-sm text-slate-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Início
            </a>
            <a
              href="#recursos"
              className="text-sm text-slate-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="text-sm text-slate-300 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Planos
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800/80">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center w-full py-2 text-sm text-slate-300 border border-slate-700 rounded-lg"
              >
                Entrar
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center w-full py-2 text-sm font-semibold text-slate-950 bg-white rounded-lg"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}