"use client";

import React, { useState, Dispatch, SetStateAction } from "react";
import {
  Bell,
  Sun,
  Moon,
  User,
  Loader2,
  Play,
  Square,
  Plus,
  Settings2,
} from "lucide-react";

/* ============================================================
   TIPOS
   ============================================================ */

interface ColetaGeralProps {
  isDark: boolean;
  setIsDark: Dispatch<SetStateAction<boolean>>;
}

interface Marketplace {
  id: string;
  name: string;
  status: "ativo" | "em-breve";
}

interface Categoria {
  id: string;
  name: string;
  loop: boolean;
}

/* ============================================================
   DADOS
   ============================================================ */

const MARKETPLACES: Marketplace[] = [
  { id: "magalu", name: "Magalu", status: "ativo" },
  { id: "mercado-livre", name: "Mercado Livre", status: "em-breve" },
  { id: "amazon", name: "Amazon", status: "em-breve" },
];

const CATEGORIAS_INICIAIS: Categoria[] = [
  { id: "cozinha", name: "Cozinha", loop: false },
  { id: "quarto", name: "Quarto", loop: false },
  { id: "sala", name: "Sala", loop: false },
  { id: "banheiro", name: "Banheiro", loop: false },
  { id: "acessorios", name: "Acessórios", loop: false },
];

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export default function ColetaGeral({ isDark, setIsDark }: ColetaGeralProps) {
  const [marketplaceAtivo, setMarketplaceAtivo] = useState<string>("magalu");
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_INICIAIS);
  const [executando, setExecutando] = useState(true);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    Set<string>
  >(new Set());

  const toggleCategoria = (id: string) => {
    const next = new Set(categoriasSelecionadas);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCategoriasSelecionadas(next);
  };

  const toggleLoop = (id: string) => {
    setCategorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, loop: !c.loop } : c))
    );
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* ============ HEADER ============ */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Fluxo multi-marketplace
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Coleta geral
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Categorias nativas e personalizadas ficam disponíveis em um único
            lugar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Settings2 className="h-4 w-4" />
            Visão geral
          </button>
          <button className="relative p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ============ CARD 1: MARKETPLACES ============ */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
          1. Marketplaces
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKETPLACES.map((mp) => {
            const ativo = mp.status === "ativo";
            const selecionado = marketplaceAtivo === mp.id;

            return (
              <button
                key={mp.id}
                disabled={!ativo}
                onClick={() => ativo && setMarketplaceAtivo(mp.id)}
                className={`text-left rounded-lg border p-4 transition-all ${
                  !ativo
                    ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 cursor-not-allowed opacity-60"
                    : selecionado
                    ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-400/40"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      selecionado && ativo
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selecionado && ativo && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {mp.name}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                  {ativo ? "Funcional" : "Em breve"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ CARD 2: CATEGORIAS ============ */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              2. Categorias de coleta
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              Palavras-chave salvas viram categorias personalizadas e podem ser
              reutilizadas em qualquer marketplace compatível.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
            <Plus className="h-4 w-4" />
            Nova personalizada
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categorias.map((cat) => {
            const selecionada = categoriasSelecionadas.has(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggleCategoria(cat.id)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                  selecionada
                    ? "border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      selecionada
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selecionada && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {cat.name}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLoop(cat.id);
                  }}
                  className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <span
                    className={`h-4 w-4 rounded border flex items-center justify-center ${
                      cat.loop
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {cat.loop && (
                      <svg
                        viewBox="0 0 12 12"
                        className="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Loop
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ CARD 3: ESTADO ============ */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Estado
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-gray-100">
                {executando ? "EXECUTANDO" : "PARADO"}
              </span>
              {executando && (
                <Loader2 className="h-4 w-4 text-gray-500 dark:text-gray-400 animate-spin" />
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pronto para iniciar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Central Magalu
            </button>

            <button
              onClick={() => setExecutando(false)}
              disabled={!executando}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                executando
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Square className="h-4 w-4" />
              Parar coleta
            </button>

            <button
              onClick={() => setExecutando(true)}
              disabled={executando}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !executando
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Play className="h-4 w-4" />
              Iniciar coleta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}