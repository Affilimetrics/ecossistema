"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tagline: "Para quem está começando",
    monthly: 0,
    yearly: 0,
    cta: "Criar Conta Grátis",
    href: "/sign-up",
    featuresHeading: "Recursos Básicos",
    features: ["Até 1.000 cliques/mês", "Dashboard básico", "Relatórios essenciais"],
  },
  {
    name: "Pro",
    tagline: "Para afiliados em escala",
    monthly: 97,
    yearly: 77,
    cta: "Assinar Pro",
    href: "/sign-up",
    featuresHeading: "Tudo do Starter, e mais:",
    features: ["Cliques ilimitados", "Módulo de Remarketing", "Produtos em Alta", "Termômetro Financeiro"],
    featured: true,
  },
  {
    name: "Premium",
    tagline: "Para grandes operações",
    monthly: 297,
    yearly: 237,
    cta: "Falar com Consultor",
    href: "/sign-up",
    featuresHeading: "Tudo do Pro, e mais:",
    features: ["Múltiplas contas", "API de integração", "Gerente de conta", "Coleta Geral"],
  },
];

export default function Pricing18() {
  const [yearly, setYearly] = useState(true);

  return (
    <section className="bg-slate-950 py-24" id="planos">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Planos para qualquer escala
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Escolha o plano ideal para alavancar os seus resultados. Faça upgrade, downgrade ou cancele a qualquer momento.
          </p>
        </div>

        <div className="mb-14 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/50 p-1.5">
            {(["monthly", "yearly"] as const).map((option) => {
              const isActive = (option === "yearly") === yearly;
              return (
                <button
                  key={option}
                  onClick={() => setYearly(option === "yearly")}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.span layoutId="billing-toggle-pill" className="absolute inset-0 rounded-full bg-blue-600" />
                  )}
                  <span className="relative z-10 capitalize">{option === 'monthly' ? 'Mensal' : 'Anual'}</span>
                  {option === "yearly" && (
                    <Badge variant="secondary" className={cn("relative z-10 bg-blue-500/20 text-[11px] text-blue-400", isActive && "bg-white/20 text-white")}>
                      -20%
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            return (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1",
                  plan.featured
                    ? "border-blue-500/50 bg-slate-900 shadow-2xl shadow-blue-900/20 md:scale-105"
                    : "border-slate-800 bg-slate-900/40 hover:shadow-xl"
                )}
              >
                {plan.featured && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold uppercase text-white shadow-sm">
                    Mais Popular
                  </span>
                )}

                <div className={cn("mb-6", plan.featured && "mt-3")}>
                  <h3 className="mb-1 text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.tagline}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span key={`${plan.name}-${price}`} className="text-4xl font-bold text-white">
                      R$ {price}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm text-slate-400">/mês</span>
                </div>

                <Link to={plan.href} className="w-full mb-8">
                  <Button variant={plan.featured ? "default" : "outline"} className={cn("w-full h-12 rounded-lg", plan.featured ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-slate-700 text-white hover:bg-slate-800")}>
                    {plan.cta}
                  </Button>
                </Link>

                <div className="flex-1">
                  <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-slate-400">{plan.featuresHeading}</p>
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-500" />
                        <span className="text-sm text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}