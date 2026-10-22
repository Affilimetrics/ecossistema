/**
 * CAMADA 2 — OCR + MODERAÇÃO DO TEXTO EXTRAÍDO
 *
 * Usa tesseract.js (100% local, gratuito).
 *
 * ⚠️ LIMITAÇÕES REAIS:
 * - A qualidade cai MUITO em imagens promocionais com fundo colorido,
 *   tipografia decorativa ou texto em ângulo [citation:3].
 * - Pré-processamento (grayscale + threshold) ajuda, mas não resolve tudo.
 * - A primeira execução baixa o language data (~15MB).
 */

import { createWorker } from "tesseract.js";
import { moderateText } from "./textModeration";
import type { LayerResult } from "./disclosureTypes";

let workerPromise: Promise<any> | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker("por");
  }
  return workerPromise;
}

/**
 * Pré-processa a imagem: grayscale + contraste pra melhorar OCR.
 * Retorna um canvas com a imagem tratada.
 */
async function preprocessImage(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D indisponível"));
      ctx.drawImage(img, 0, 0);

      // Grayscale + contraste simples
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const contrast = gray > 128 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = contrast;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Executa OCR e modera o texto extraído.
 * Retorna `not_verified` se o OCR falhar.
 */
export async function moderateImageText(file: File): Promise<LayerResult> {
  try {
    const canvas = await preprocessImage(file);
    const worker = await getWorker();
    const { data } = await worker.recognize(canvas);
    const extractedText = data.text?.trim() ?? "";

    if (!extractedText) {
      return {
        status: "not_verified",
        violations: [],
        extractedText: "",
      };
    }

    const result = moderateText(extractedText);
    return {
      status: result.status,
      violations: result.violations,
      extractedText,
    };
  } catch (err) {
    return {
      status: "technical_error",
      violations: [],
      error: err instanceof Error ? err.message : "Falha no OCR",
    };
  }
}