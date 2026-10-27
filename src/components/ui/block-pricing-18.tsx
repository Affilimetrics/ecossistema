"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  features: string[];
  featured?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Para quem está começando no mercado",
    monthly: 0,
    yearly: 0,
    cta: "Criar Conta Grátis",
    features: ["Até 1.000 cliques/mês", "Relatórios básicos", "Suporte via e-mail"],
  },
  {
    name: "Pro",
    tagline: "Para afiliados em fase de escala",
    monthly: 97,
    yearly: 77,
    cta: "Assinar Pro",
    features: [
      "Cliques ilimitados",
      "Módulo de Remarketing",
      "Relatórios em tempo real",
      "Suporte prioritário",
    ],
    featured: true,
  },
  {
    name: "Scale",
    tagline: "Para grandes operações e agências",
    monthly: 297,
    yearly: 237,
    cta: "Falar com Consultor",
    features: [
      "Múltiplas contas",
      "API de integração nativa",
      "Gerente de conta dedicado",
    ],
  },
];

export default function Pricing18() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="planos" className="bg-slate-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Planos para qualquer escala
          </h2>
          <p className="text-base text-slate-400 sm:text-lg">
            Escolha o plano ideal para alavancar os seus resultados.
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="mb-14 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1.5">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !yearly ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                yearly ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Anual <span className="text-xs text-blue-200 ml-1">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 border backdrop-blur-md transition-all ${
                  plan.featured
                    ? "border-blue-500/80 bg-slate-900/80 shadow-2xl shadow-blue-600/20 md:scale-105"
                    : "border-slate-800 bg-slate-900/40"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold uppercase text-white shadow-md">
                    Mais Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    R$ {price}
                  </span>
                  <span className="text-sm text-slate-400">/mês</span>
                </div>

                <a
                  href="/sign-up"
                  className={`mb-8 w-full text-center py-3 rounded-xl font-semibold transition-all ${
                    plan.featured
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                      : "border border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </a>

                <ul className="space-y-4 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}