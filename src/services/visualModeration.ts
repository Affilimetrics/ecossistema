/**
 * CAMADA 3 — MODERAÇÃO VISUAL
 *
 * Usa NSFWJS + TensorFlow.js (100% local, gratuito).
 *
 * ⚠️ LIMITAÇÕES REAIS:
 * - Detecta APENAS nudez/sexual. NÃO detecta violência, gore ou ódio [citation:5].
 * - Primeira execução baixa o modelo TensorFlow (~3MB) [citation:5].
 * - Não é 100% preciso; pode gerar falsos positivos (ex.: praia com pessoas de biquíni).
 */

import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import type { LayerResult } from "./disclosureTypes";

let modelPromise: Promise<nsfwjs.NSFWJS> | null = null;

async function getModel() {
  if (!modelPromise) {
    tf.enableProdMode();
    modelPromise = nsfwjs.load();
  }
  return modelPromise;
}

/**
 * Limiares (ajustáveis):
 * - Porn/Hentai > 0.7 → rejected
 * - Porn/Hentai entre 0.5 e 0.7 → needs_review
 * - Sexy > 0.6 → needs_review
 */
const REJECT_THRESHOLD = 0.7;
const REVIEW_THRESHOLD = 0.5;
const SEXY_REVIEW = 0.6;

export async function moderateImageVisual(file: File): Promise<LayerResult> {
  try {
    const model = await getModel();

    const img = await loadImage(file);
    const predictions = await model.classify(img, 5);

    const get = (name: string) =>
      predictions.find((p) => p.className === name)?.probability ?? 0;

    const porn = get("Porn");
    const hentai = get("Hentai");
    const sexy = get("Sexy");

    const visualCategories = predictions.map((p) => ({
      name: p.className,
      probability: p.probability,
    }));

    const maxExplicit = Math.max(porn, hentai);

    if (maxExplicit >= REJECT_THRESHOLD) {
      return {
        status: "rejected",
        visualCategories,
        violations: [
          {
            category: "sexual",
            severity: "high",
            explanation: `Conteúdo sexual explícito detectado (confiança: ${(maxExplicit * 100).toFixed(1)}%).`,
          },
        ],
      };
    }

    if (maxExplicit >= REVIEW_THRESHOLD || sexy >= SEXY_REVIEW) {
      return {
        status: "needs_review",
        visualCategories,
        violations: [
          {
            category: "sexual",
            severity: "medium",
            explanation: `Conteúdo possivelmente sensual detectado (confiança: ${(Math.max(maxExplicit, sexy) * 100).toFixed(1)}%). Revisão manual recomendada.`,
          },
        ],
      };
    }

    return { status: "approved", visualCategories, violations: [] };
  } catch (err) {
    return {
      status: "not_verified",
      violations: [],
      error: err instanceof Error ? err.message : "Moderação visual indisponível",
    };
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}