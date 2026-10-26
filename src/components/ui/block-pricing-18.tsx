"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface Plan {
  name: string;
  tagline: string;
  monthly: number | null;
  yearly: number | null;
  cta: string;
  featuresHeading: string;
  features: string[];
  featured?: boolean;
}

const EASE_ENTRANCE = [0.21, 0.47, 0.32, 0.98] as const;
const REVEAL_VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

const plans: Plan[] = [
  {
    name: "Starter",
    tagline: "Para quem está começando no mercado",
    monthly: 0,
    yearly: 0,
    cta: "Criar Conta Grátis",
    featuresHeading: "Recursos Inclusos:",
    features: [
      "Até 1.000 cliques/mês",
      "Relatórios básicos",
      "Suporte via e-mail",
    ],
  },
  {
    name: "Pro",
    tagline: "Para afiliados em fase de escala",
    monthly: 97,
    yearly: 77,
    cta: "Assinar Pro",
    featuresHeading: "Tudo do Starter, mais:",
    features: [
      "Cliques ilimitados",
      "Módulo de Remarketing",
      "Recuperação de vendas automatizada",
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
    featuresHeading: "Tudo do Pro, mais:",
    features: [
      "Múltiplas contas de afiliados",
      "API de integração nativa",
      "Gerente de conta dedicado",
    ],
  },
];

function useIsCompact() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const list = window.matchMedia("(max-width: 767px)");
    list.addEventListener("change", onStoreChange);
    return () => list.removeEventListener("change", onStoreChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

export default function Pricing18() {
  const [yearly, setYearly] = useState(true);
  const reduce = useReducedMotion();
  const cardsSelfReveal = useIsCompact();

  return (
    <section className="bg-slate-950 py-16 sm:py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Planos transparentes para qualquer escala
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Escolha a opção ideal para impulsionar suas conversões.
          </p>
        </div>

        <div className="mb-14 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1.5">
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
                    <motion.span
                      layoutId="billing-toggle-pill"
                      className="absolute inset-0 rounded-full bg-blue-600"
                      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{option === "yearly" ? "Anual" : "Mensal"}</span>
                  {option === "yearly" && (
                    <Badge variant="secondary" className="relative z-10 bg-white/20 text-xs text-white">
                      Economize 20%
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={cardsSelfReveal ? undefined : "hidden"}
          whileInView={cardsSelfReveal ? undefined : "show"}
          viewport={cardsSelfReveal ? undefined : REVEAL_VIEWPORT}
          variants={cardsSelfReveal ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-1 items-end gap-6 md:grid-cols-3"
        >
          {plans.map((plan) => {
            const price = yearly ? plan.yearly : plan.monthly;
            const isFree = price === 0;

            return (
              <motion.div
                key={plan.name}
                initial={cardsSelfReveal ? "hidden" : undefined}
                whileInView={cardsSelfReveal ? "show" : undefined}
                viewport={cardsSelfReveal ? REVEAL_VIEWPORT : undefined}
                variants={{
                  hidden: { opacity: 0, y: reduce ? 0 : 28 },
                  show: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: EASE_ENTRANCE }}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 border border-slate-800 bg-slate-900/60 backdrop-blur-md",
                  plan.featured && "border-blue-500/50 bg-slate-900 shadow-xl shadow-blue-500/10 md:scale-105"
                )}
              >
                {plan.featured && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase">
                    Mais Popular
                  </span>
                )}

                <div className={cn("mb-6", plan.featured && "mt-3")}>
                  <h3 className="mb-1 text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">{plan.tagline}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`${plan.name}-${price}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-bold tracking-tight text-white"
                    >
                      R$ {price}
                    </motion.span>
                  </AnimatePresence>
                  {!isFree && <span className="text-sm text-slate-400">/mês</span>}
                </div>

                <Button
                  onClick={() => {}}
                  variant={plan.featured ? "default" : "outline"}
                  size="lg"
                  className={cn("mb-8 w-full rounded-lg", plan.featured && "bg-blue-600 text-white hover:bg-blue-500")}
                >
                  {plan.cta}
                </Button>

                <div className="flex-1">
                  <p className="mb-4 text-xs font-semibold tracking-widest uppercase text-slate-400">
                    {plan.featuresHeading}
                  </p>
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
        </motion.div>
      </div>
    </section>
  );
}