import React from "react";
import { LayoutDashboard, Package, Sparkles, TrendingUp } from "lucide-react";

const features = [
  { icon: LayoutDashboard, title: "Dashboard Unificado", description: "Acompanhe métricas e vendas em uma interface moderna." },
  { icon: Package, title: "Gestão de Produtos", description: "Organize links e monitore a performance individual." },
  { icon: Sparkles, title: "Módulo de Remarketing", description: "Identifique oportunidades sem conversão." },
  { icon: TrendingUp, title: "Relatórios Financeiros", description: "Acompanhe o ROI com gráficos claros." },
];

export default function FeaturesSection() {
  return (
    <section id="sobre" className="py-24 bg-slate-950 text-white relative border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Diferenciais da Plataforma</h2>
          <p className="text-slate-400 text-base sm:text-lg">Ferramentas desenvolvidas para dar clareza ao seu negócio.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition-all hover:bg-slate-900/80">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-500/20">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}