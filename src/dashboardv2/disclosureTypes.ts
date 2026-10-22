/* ============================================================
   TIPOS — CENTRAL DE DIVULGAÇÃO / MODERAÇÃO
   ============================================================ */

export type ModerationStatus =
  | "pending"       // ainda não iniciada
  | "analyzing"     // em análise
  | "approved"      // aprovado
  | "rejected"      // rejeitado
  | "needs_review"  // inconclusivo ou possível falso positivo
  | "not_verified"  // verificação não executada (ex.: ferramenta não configurada)
  | "technical_error"; // falha técnica

export interface ModerationViolation {
  category: string;         // ex.: "profanity", "spam", "sexual"
  severity: "low" | "medium" | "high";
  explanation: string;
  /** Trecho sinalizado (não reproduzir conteúdo ofensivo completo) */
  snippet?: string;
}

export interface LayerResult {
  status: ModerationStatus;
  violations: ModerationViolation[];
  /** Texto extraído pelo OCR (apenas camada 2) */
  extractedText?: string;
  /** Categorias detectadas pelo NSFWJS (apenas camada 3) */
  visualCategories?: { name: string; probability: number }[];
  error?: string;
}

export interface DisclosureModerationResult {
  text: LayerResult;
  ocr: LayerResult;
  visual: LayerResult;
  overall: ModerationStatus;
  /** Hash da versão do conteúdo analisado — invalida aprovação anterior se mudar */
  contentHash: string;
  analyzedAt: string | null;
}

export interface DisclosureForm {
  productId: string | null;
  productName: string;
  title: string;
  caption: string;
  affiliateLink: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
}