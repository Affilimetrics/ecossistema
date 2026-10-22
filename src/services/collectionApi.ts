/**
 * ⚠️  CAMADA DE SERVIÇO — COLETA GERAL
 *
 * Esta é a ÚNICA parte do frontend que conversa com o Django.
 * Tudo abaixo é um STUB — está estruturado para ligar em endpoints reais
 * sem precisar mexer nos componentes visuais.
 *
 * Ajuste os caminhos conforme as rotas reais do seu Django:
 *  - GET    /api/collection/state/          → estado atual + últimas métricas
 *  - GET    /api/collection/logs/           → últimas execuções
 *  - GET    /api/collection/marketplaces/   → catálogo com status real
 *  - GET    /api/collection/categories/     → categorias nativas + personalizadas
 *  - POST   /api/collection/categories/     → cria categoria personalizada
 *  - POST   /api/collection/start/          → inicia coleta
 *  - POST   /api/collection/pause/          → pausa
 *  - POST   /api/collection/resume/         → retoma
 *  - POST   /api/collection/stop/           → para
 *
 * Enquanto o backend não expõe essas rotas, TODAS as funções retornam
 * `null`/`[]`/`false` — nunca dados fictícios apresentados como reais.
 */

import type {
  Category,
  CollectionLog,
  CollectionState,
  Marketplace,
  NewCategoryInput,
} from "../dashboardv2/collectionTypes";

/** Helper genérico com CSRF pronto e parse seguro de JSON. */
async function http<T>(
  url: string,
  init: RequestInit = {}
): Promise<T | null> {
  try {
    const csrf =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((c) => c.startsWith("csrftoken="))
            ?.split("=")[1]
        : undefined;

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRFToken": csrf } : {}),
        ...(init.headers ?? {}),
      },
      ...init,
    });

    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (null as unknown as T);
  } catch {
    return null;
  }
}

/* ============================================================
   LEITURA
   ============================================================ */

export async function fetchCollectionState(): Promise<CollectionState | null> {
  return http<CollectionState>("/api/collection/state/");
}

export async function fetchCollectionLogs(): Promise<CollectionLog[]> {
  const data = await http<CollectionLog[]>("/api/collection/logs/");
  return data ?? [];
}

export async function fetchMarketplaces(): Promise<Marketplace[]> {
  const data = await http<Marketplace[]>("/api/collection/marketplaces/");
  return data ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const data = await http<Category[]>("/api/collection/categories/");
  return data ?? [];
}

/* ============================================================
   ESCRITA
   ============================================================ */

export async function createCategory(
  input: NewCategoryInput
): Promise<Category | null> {
  return http<Category>("/api/collection/categories/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function startCollection(args: {
  marketplaceId: string;
  categoryIds: string[];
}): Promise<CollectionState | null> {
  return http<CollectionState>("/api/collection/start/", {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export async function pauseCollection(): Promise<CollectionState | null> {
  return http<CollectionState>("/api/collection/pause/", { method: "POST" });
}

export async function resumeCollection(): Promise<CollectionState | null> {
  return http<CollectionState>("/api/collection/resume/", { method: "POST" });
}

export async function stopCollection(): Promise<CollectionState | null> {
  return http<CollectionState>("/api/collection/stop/", { method: "POST" });
}