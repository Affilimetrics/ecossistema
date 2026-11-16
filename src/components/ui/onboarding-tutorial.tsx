import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Store,
  Tag,
  BarChart3,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    title: "Bem-vindo ao Scallora",
    subtitle: "Passo 1 de 4 • Visão Geral",
    description:
      "Sua central completa para automatizar a coleta de produtos, gerenciar links de afiliado e escalar suas conversões.",
    highlights: [
      "Monitore faturamento, comissões e cliques em tempo real",
      "Gerencie múltiplos marketplaces em um único painel",
      "Alterne facilmente entre os temas claro e escuro no topo da tela",
    ],
    icon: Sparkles,
    accentColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
  },
  {
    title: "Configure sua Coleta Geral",
    subtitle: "Passo 2 de 4 • Automação",
    description:
      "Na aba Coleta Geral, você escolhe o marketplace de origem e define quais categorias deseja minerar automaticamente.",
    highlights: [
      "Selecione plataformas como Amazon, Mercado Livre, Shopee e Magalu",
      "Crie categorias personalizadas com palavras-chave específicas",
      "Ative o modo Loop para coletas contínuas sem intervenção manual",
    ],
    icon: Store,
    accentColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
  },
  {
    title: "Recupere Vendas no Remarketing",
    subtitle: "Passo 3 de 4 • Conversão",
    description:
      "Nem todo clique vira compra imediata. Acompanhe os visitantes que clicaram nos seus links e não finalizaram o pedido.",
    highlights: [
      "Filtre oportunidades por produto, link de afiliado ou período",
      "Adicione observações internas e altere o status de acompanhamento",
      "Acompanhe sua taxa de recuperação e receita recuperada",
    ],
    icon: RefreshCw,
    accentColor: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
  },
  {
    title: "Analise e Exporte Resultados",
    subtitle: "Passo 4 de 4 • Inteligência de Dados",
    description:
      "Use a aba Análises para comparar o desempenho entre plataformas e identificar os produtos mais lucrativos.",
    highlights: [
      "Visualize gráficos de evolução diária por métrica",
      "Compare Amazon, Mercado Livre, Shopee e Magalu lado a lado",
      "Exporte relatórios completos em Excel (.xlsx) com um clique",
    ],
    icon: BarChart3,
    accentColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40",
  },
];

interface OnboardingTutorialProps {
  /** Identificador único do usuário logado (ex: user.id ou user.email) */
  userId?: string;
  /** Permite forçar a abertura manualmente (ex: botão "Ver tutorial") */
  forceOpen?: boolean;
  /** Callback executado ao concluir ou pular o tutorial */
  onComplete?: () => void;
  /** Etapas customizadas (opcional) */
  steps?: OnboardingStep[];
}

export function OnboardingTutorial({
  userId = "default_user",
  forceOpen = false,
  onComplete,
  steps = DEFAULT_STEPS,
}: OnboardingTutorialProps) {
  const storageKey = `scallora_onboarding_seen_${userId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
      return;
    }

    // Verifica se o usuário já visualizou o tutorial neste navegador
    const hasSeen = localStorage.getItem(storageKey);
    if (!hasSeen) {
      // Pequeno delay para a tela principal terminar de montar suavemente
      const timer = window.setTimeout(() => {
        setIsOpen(true);
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [storageKey, forceOpen]);

  const handleFinish = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    setCurrentStep(0);
    onComplete?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-lg rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
          >
            {/* BARRA DE PROGRESSO SUPERIOR */}
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {step.subtitle}
              </span>
              <button
                type="button"
                onClick={handleFinish}
                title="Pular tutorial"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <span>Pular</span>
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* CONTEÚDO ANIMADO DA ETAPA */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-3.5 mb-4">
                    <div className={`p-2.5 rounded-none shrink-0 ${step.accentColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {step.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* LISTA DE DESTAQUES */}
                  <div className="mt-5 p-4 rounded-none border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/60 space-y-2.5">
                    {step.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-none bg-blue-600 text-white flex items-center justify-center">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* INDICADORES DE PÁGINA (DOTS QUADRADOS) */}
              <div className="flex items-center justify-center gap-1.5 mt-6">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Ir para etapa ${idx + 1}`}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 transition-all rounded-none ${
                      idx === currentStep
                        ? "w-6 bg-blue-600"
                        : "w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* RODAPÉ COM NAVEGAÇÃO */}
            <div className="px-5 py-3.5 bg-gray-50/70 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-none border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="h-9 inline-flex items-center gap-1.5 px-4 rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <span>{isLastStep ? "Começar a usar" : "Próximo"}</span>
                {isLastStep ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}