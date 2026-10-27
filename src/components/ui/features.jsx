import React from "react";
import { LayoutDashboard, Package, Sparkles, TrendingUp } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Unificado",
    description:
      "Acompanhe métricas, vendas e taxas de conversão em tempo real em uma interface moderna e intuitiva.",
  },
  {
    icon: Package,
    title: "Gestão de Produtos",
    description:
      "Organize seus links de afiliados e monitore a performance individual de cada oferta.",
  },
  {
    icon: Sparkles,
    title: "Módulo de Remarketing",
    description:
      "Identifique oportunidades sem conversão e gerencie suas ações de recuperação ativamente.",
  },
  {
    icon: TrendingUp,
    title: "Relatórios Financeiros",
    description:
      "Acompanhe o retorno sobre investimento (ROI) com relatórios detalhados e gráficos claros.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="recursos" className="py-24 bg-slate-950 text-white relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tudo o que sua operação precisa
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Ferramentas desenvolvidas para dar clareza e previsibilidade ao seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-md transition-all hover:border-blue-500/50 hover:-translate-y-1 shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-4 border border-blue-500/30">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}