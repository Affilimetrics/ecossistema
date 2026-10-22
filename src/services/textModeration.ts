/**
 * CAMADA 1 — MODERAÇÃO DO TEXTO DIGITADO
 *
 * Lista configurável de termos em PT-BR + normalização robusta.
 * Sem dependência externa. Sem IA.
 */

import type { ModerationViolation } from "./disclosureTypes";

/* ============================================================
   LISTA CONFIGURÁVEL
   ============================================================ */

interface BannedTerm {
  /** Termo proibido, já normalizado (minúsculo, sem acento) */
  term: string;
  category: string;
  severity: "low" | "medium" | "high";
  /** Se true, só dispara se a palavra estiver isolada (evita falsos positivos) */
  wholeWord?: boolean;
}

/**
 * Lista inicial — expanda conforme necessário.
 * NUNCA coloque termos aqui se puderem gerar falsos positivos em contexto de e-commerce.
 */
export const BANNED_TERMS: BannedTerm[] = [
  // Palavrões PT-BR (exemplos genéricos — ajuste conforme sua política)
  { term: "merda", category: "profanity", severity: "medium" },
  { term: "porra", category: "profanity", severity: "medium" },
  { term: "caralho", category: "profanity", severity: "high" },
  { term: "foder", category: "profanity", severity: "high" },
  { term: "puta", category: "profanity", severity: "high", wholeWord: true },
  { term: "viado", category: "offensive", severity: "high" },
  { term: "idiota", category: "insult", severity: "low" },
  { term: "imbecil", category: "insult", severity: "low" },
  { term: "otario", category: "insult", severity: "low" },

  // Ameaças
  { term: "vou te matar", category: "threat", severity: "high" },
  { term: "vou te bater", category: "threat", severity: "high" },

  // Spam / abuso promocional
  { term: "clique aqui e ganhe", category: "spam", severity: "medium" },
  { term: "dinheiro facil", category: "spam", severity: "medium" },
  { term: "ganhe dinheiro rapido", category: "spam", severity: "medium" },
  { term: "renda extra garantida", category: "spam", severity: "medium" },
  { term: "sem esforco", category: "spam", severity: "low" },

  // Sexual explícito
  { term: "pornografia", category: "sexual", severity: "high" },
  { term: "sexo explicito", category: "sexual", severity: "high" },
];

/** Substituições comuns de leet speak → letra */
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t",
  "@": "a", "$": "s", "!": "i",
};

/* ============================================================
   NORMALIZAÇÃO
   ============================================================ */

/**
 * Normaliza o texto para comparação:
 * 1. Minúsculas
 * 2. Remove acentos
 * 3. Substitui leet speak
 * 4. Colapsa caracteres repetidos (3+ → 1)
 * 5. Remove pontuação e espaços extras
 */
export function normalize(text: string): string {
  let s = text.toLowerCase();

  // Remove acentos
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Substitui leet speak caractere por caractere
  s = s
    .split("")
    .map((c) => LEET_MAP[c] ?? c)
    .join("");

  // Colapsa repetições (ex.: "meeeerda" → "merda")
  s = s.replace(/(.)\1{2,}/g, "$1");

  // Remove pontuação
  s = s.replace(/[^\w\s]/g, " ");

  // Colapsa espaços
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/* ============================================================
   ANÁLISE
   ============================================================ */

export interface TextModerationResult {
  status: "approved" | "rejected" | "needs_review";
  violations: ModerationViolation[];
}

/**
 * Analisa o texto digitado contra a lista de termos proibidos.
 * Retorna `rejected` se houver violação high, `needs_review` se low/medium.
 */
export function moderateText(input: string): TextModerationResult {
  const normalized = normalize(input);
  const violations: ModerationViolation[] = [];

  for (const banned of BANNED_TERMS) {
    const termNorm = normalize(banned.term);
    if (!termNorm) continue;

    let found = false;
    if (banned.wholeWord) {
      // Busca palavra isolada
      const regex = new RegExp(`\\b${escapeRegex(termNorm)}\\b`);
      found = regex.test(normalized);
    } else {
      found = normalized.includes(termNorm);
    }

    if (found) {
      violations.push({
        category: banned.category,
        severity: banned.severity,
        explanation: explanationFor(banned.category, banned.severity),
        snippet: maskSnippet(normalized, termNorm),
      });
    }
  }

  // Classificação final
  if (violations.some((v) => v.severity === "high")) {
    return { status: "rejected", violations };
  }
  if (violations.length > 0) {
    return { status: "needs_review", violations };
  }
  return { status: "approved", violations: [] };
}

/* ============================================================
   HELPERS
   ============================================================ */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function explanationFor(category: string, severity: string): string {
  const map: Record<string, string> = {
    profanity: "Palavrão ou expressão de baixo calão detectada.",
    offensive: "Linguagem ofensiva ou discriminatória detectada.",
    insult: "Insulto ou xingamento detectado.",
    threat: "Ameaça detectada — conteúdo não permitido.",
    sexual: "Conteúdo de teor sexual explícito detectado.",
    spam: "Conteúdo com características de spam ou promessa abusiva.",
  };
  const base = map[category] ?? "Conteúdo sinalizado.";
  return severity === "high" ? `${base} Violação grave.` : base;
}

/** Mascara o trecho para não reproduzir ofensa em log */
function maskSnippet(text: string, term: string): string {
  const idx = text.indexOf(term);
  if (idx === -1) return "***";
  const start = Math.max(0, idx - 10);
  const end = Math.min(text.length, idx + term.length + 10);
  const snippet = text.slice(start, end);
  return snippet.replace(term, "*".repeat(term.length));
}