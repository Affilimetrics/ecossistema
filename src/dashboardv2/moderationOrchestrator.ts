/**
 * ORQUESTRADOR DAS 3 CAMADAS
 *
 * Coordena texto, OCR e visual, e calcula o estado consolidado.
 * Regra: NUNCA aprovar se alguma camada estiver not_verified ou technical_error.
 */

import { moderateText } from "./textModeration";
import { moderateImageText } from "./ocrService";
import { moderateImageVisual } from "./visualModeration";
import type {
  DisclosureModerationResult,
  DisclosureForm,
  ModerationStatus,
} from "./disclosureTypes";

/** Hash simples do conteúdo pra detectar alterações */
async function hashContent(form: DisclosureForm): Promise<string> {
  const payload = [
    form.title,
    form.caption,
    form.affiliateLink,
    form.imageFile ? `${form.imageFile.name}-${form.imageFile.size}-${form.imageFile.lastModified}` : "",
  ].join("|");
  const buf = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function runModeration(
  form: DisclosureForm,
  onProgress?: (layer: "text" | "ocr" | "visual", status: ModerationStatus) => void
): Promise<DisclosureModerationResult> {
  const contentHash = await hashContent(form);

  /* Camada 1 — texto */
  onProgress?.("text", "analyzing");
  const textResult = moderateText(`${form.title}\n${form.caption}`);
  onProgress?.("text", textResult.status);

  /* Camada 2 — OCR */
  onProgress?.("ocr", "analyzing");
  const ocrResult = form.imageFile
    ? await moderateImageText(form.imageFile)
    : { status: "not_verified" as ModerationStatus, violations: [] };
  onProgress?.("ocr", ocrResult.status);

  /* Camada 3 — visual */
  onProgress?.("visual", "analyzing");
  const visualResult = form.imageFile
    ? await moderateImageVisual(form.imageFile)
    : { status: "not_verified" as ModerationStatus, violations: [] };
  onProgress?.("visual", visualResult.status);

  const overall = computeOverall(textResult.status, ocrResult.status, visualResult.status);

  return {
    text: textResult,
    ocr: ocrResult,
    visual: visualResult,
    overall,
    contentHash,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Consolidação:
 * - rejected se qualquer camada = rejected
 * - needs_review se qualquer camada = needs_review
 * - technical_error se qualquer camada = technical_error
 * - not_verified se qualquer camada = not_verified (sem reprovação)
 * - approved SÓ se TODAS = approved
 */
function computeOverall(
  text: ModerationStatus,
  ocr: ModerationStatus,
  visual: ModerationStatus
): ModerationStatus {
  const layers = [text, ocr, visual];

  if (layers.includes("rejected")) return "rejected";
  if (layers.includes("needs_review")) return "needs_review";
  if (layers.includes("technical_error")) return "technical_error";
  if (layers.includes("not_verified")) return "not_verified";
  return "approved";
}