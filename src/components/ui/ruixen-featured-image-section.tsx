"use client";

import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { LayoutDashboard, TrendingUp, Activity } from "lucide-react";

const tabs = [
  {
    icon: LayoutDashboard,
    title: "Dashboard Inteligente",
    description: "Acompanhe indicadores financeiros, vendas, comissões e conversões em uma visão unificada.",
    bgPos: { x: 0, y: 0, size: 150 }
  },
  {
    icon: TrendingUp,
    title: "Produtos em Alta",
    description: "Descubra produtos com maior potencial, avalie descontos e encontre as melhores oportunidades.",
    bgPos: { x: 80, y: 90, size: 135 }
  },
  {
    icon: Activity,
    title: "Termômetro Financeiro",
    description: "Monitore visualmente o desempenho das suas campanhas e entenda seus resultados rapidamente.",
    bgPos: { x: 120, y: 30, size: 170 }
  },
];

const FeatureTab = (props: any) => {
  const tabRef = useRef<HTMLDivElement>(null);
  const xPercent = useMotionValue(100);
  const yPercent = useMotionValue(0);
  const maskImage = useMotionTemplate`radial-gradient(100px 50px at ${xPercent}% ${yPercent}%, black, transparent)`;

  useEffect(() => {
    if (!tabRef.current || !props.selected) return;
    xPercent.set(0); yPercent.set(0);
    const { height, width } = tabRef.current.getBoundingClientRect();
    const circumference = height * 2 + width * 2;
    const times = [0, width / circumference, (width + height) / circumference, (width * 2 + height) / circumference, 1];
    animate(xPercent, [0, 100, 100, 0, 0], { duration: 4, times, ease: "linear", repeat: Infinity });
    animate(yPercent, [0, 0, 100, 100, 0], { times, duration: 4, ease: "linear", repeat: Infinity });
  }, [props.selected]);

  return (
    <div
      ref={tabRef}
      className={`border ${props.selected ? 'border-blue-500/50 bg-slate-900' : 'border-slate-800 bg-slate-900/40'} rounded-xl flex items-center gap-3 p-3 relative cursor-pointer transition-colors hover:bg-slate-800`}
      onClick={props.onClick}
    >
      {props.selected && (
        <motion.div style={{ maskImage }} className="absolute inset-0 -m-px border border-blue-500 rounded-xl pointer-events-none" />
      )}
      <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 inline-flex items-center justify-center shrink-0">
        <props.icon size={18} />
      </div>
      <div className="text-sm font-semibold text-white">{props.title}</div>
    </div>
  );
};

export default function RuixenFeaturedImageSection() {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const backgroundPositionX = useMotionValue(tabs[0].bgPos.x);
  const backgroundPositionY = useMotionValue(tabs[0].bgPos.y);
  const backgroundSizeX = useMotionValue(tabs[0].bgPos.size);
  const backgroundPosition = useMotionTemplate`${backgroundPositionX}% ${backgroundPositionY}%`;
  const backgroundSize = useMotionTemplate`${backgroundSizeX}% auto`;

  const handleSelecttab = (index: number) => {
    setSelectedTab(index);
    animate(backgroundSizeX, [backgroundSizeX.get(), 100, tabs[index].bgPos.size], { duration: 2, ease: "easeInOut" });
    animate(backgroundPositionX, [backgroundPositionX.get(), 100, tabs[index].bgPos.x], { duration: 2, ease: "easeInOut" });
    animate(backgroundPositionY, [backgroundPositionY.get(), 100, tabs[index].bgPos.y], { duration: 2, ease: "easeInOut" });
  };

  return (
    <section className="py-20 md:py-28 bg-slate-950" id="funcionalidades">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-medium text-center tracking-tight text-white mb-4">
          Tudo o que sua operação precisa
        </h2>
        <p className="text-slate-400 text-lg text-center max-w-2xl mx-auto mb-12">
          Ferramentas desenhadas para dar clareza, controle e previsibilidade ao seu negócio de afiliado.
        </p>
        
        <div className="relative mt-10 flex justify-center mb-10">
          <div className="flex flex-col md:flex-row gap-3 w-full max-w-3xl">
            {tabs.map((tab, tabIndex) => (
              <FeatureTab {...tab} selected={selectedTab === tabIndex} onClick={() => handleSelecttab(tabIndex)} key={tab.title} />
            ))}
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-2 mt-4 max-w-5xl mx-auto shadow-2xl overflow-hidden">
          <motion.div
            className="aspect-video bg-cover border border-slate-800 rounded-xl flex items-center justify-center relative"
            style={{
              backgroundPosition,
              backgroundSize,
              backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop')`,
            }}
          >
            <div className="absolute inset-0 bg-slate-950/60 rounded-xl mix-blend-multiply" />
            <div className="relative z-10 text-center">
              <p className="text-white font-medium text-lg shadow-sm mb-2">
                {tabs[selectedTab].description}
              </p>
              <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                Demonstração Visual
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}