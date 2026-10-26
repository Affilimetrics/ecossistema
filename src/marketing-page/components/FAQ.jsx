import * as React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export default function FAQ() {
  const faqs = [
    {
      question: "Como funciona a integração com marketplaces?",
      answer:
        "A plataforma conecta-se diretamente via API com Amazon, Shopee e Magazine Luiza para extração automática de dados.",
    },
    {
      question: "Como funciona a verificação de moderação?",
      answer:
        "Analisamos o texto digitado, fazemos leitura de caracteres em imagens (OCR) e efetuamos análise visual para garantir total conformidade.",
    },
  ];

  return (
    <div className={cn("max-w-4xl mx-auto py-12 px-4")}>
      <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg bg-card"
          >
            <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
            <p className="text-muted-foreground text-sm">{faq.answer}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

FAQ.propTypes = {
  className: PropTypes.string,
};