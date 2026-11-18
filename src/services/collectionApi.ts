/**
 * CAMADA DE SERVIÇO — COLETA GERAL
 *
 * Conversa com a API autenticada do Django (/api/desktop/*), que controla o
 * mesmo coletor Magalu usado pelo painel web:
 *
 *  - GET  /api/desktop/magalu/status/   → estado do coletor + progresso
 *  - GET  /api/desktop/executions/      → execuções (data da última)
 *  - GET  /api/desktop/logs/            → logs de uma execução
 *  - POST /api/desktop/magalu/start/    → inicia (categorias, keywords, loops)
 *  - POST /api/desktop/magalu/pause/    → pausa (no próximo ponto seguro)
 *  - POST /api/desktop/magalu/resume/   → retoma
 *  - POST /api/desktop/magalu/stop/     → parada segura
 *
 * Limitações atuais do backend (sem endpoint equivalente em /api/desktop):
 *  - Listar/criar categorias personalizadas (hoje só via páginas Django com
 *    sessão + CSRF). As categorias nativas vêm de CATEGORIAS_PRINCIPAIS.
 *  - Marketplaces além do Magalu: o Mercado Livre roda no app desktop.
 */

import type {
  Category,
  CollectionActionResult,
  CollectionLog,
  CollectionState,
  CollectionStatus,
  LogLevel,
  Marketplace,
  NewCategoryInput,
} from "../types/collectionTypes";
import { djangoRequest, type ApiResult } from "./djangoClient";

/* ============================================================
   MAPEAMENTOS BACKEND → FRONT
   ============================================================ */

/** Estados do controlador Django (minúsculos) → estados da UI. */
function mapStatus(raw: unknown): CollectionStatus {
  switch (String(raw ?? "parado").toLowerCase()) {
    case "iniciando":
    case "verificando_login":
    case "aguardando_login":
    case "logado":
      return "starting";
    case "executando":
      return "running";
    case "pausado":
      return "paused";
    case "parando":
      return "stopping";
    case "erro":
    case "ocupado": // coletor em uso por outro usuário
      return "error";
    default: // parado, finalizado
      return "idle";
  }
}

function mapLevel(raw: unknown): LogLevel {
  switch (String(raw ?? "").toUpperCase()) {
    case "OK":
    case "SUCCESS":
    case "SUCESSO":
      return "success";
    case "WARNING":
    case "WARN":
    case "AVISO":
      return "warning";
    case "ERROR":
    case "ERRO":
      return "error";
    default:
      return "info";
  }
}

function toCategoryName(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ============================================================
   CATÁLOGOS (estáticos — o backend não expõe endpoints)
   ============================================================ */

/** Valores exatos de CATEGORIAS_PRINCIPAIS (magalu_bot/config/config.py). */
const NATIVE_CATEGORIES = ["cozinha", "quarto", "sala", "banheiro", "acessórios"];

export const MAGALU_ID = "magalu";

export async function fetchMarketplaces(): Promise<Marketplace[]> {
  return [
    { id: "magalu", name: "Magazine Luiza", description: "Coleta automática de ofertas e links de afiliado.", color: "#0086ff", status: "available" },
    { id: "mercadolivre", name: "Mercado Livre", description: "Disponível pelo aplicativo desktop.", color: "#ffe600", status: "unavailable" },
    { id: "amazon", name: "Amazon", description: "Integração ainda não disponível.", color: "#ff9900", status: "unavailable" },
    { id: "shopee", name: "Shopee", description: "Integração ainda não disponível.", color: "#ee4d2d", status: "unavailable" },
    { id: "tiktokshop", name: "TikTok Shop", description: "Integração em desenvolvimento.", color: "#000000", status: "developing" },
  ];
}

export async function fetchCategories(): Promise<Category[]> {
  return NATIVE_CATEGORIES.map((value) => ({
    id: value,
    name: toCategoryName(value),
    isNative: true,
    loop: false,
  }));
}

/**
 * Ainda não existe endpoint com token para salvar categorias personalizadas
 * (hoje: POST /coleta/categoria-personalizada/, que exige sessão + CSRF).
 * Retorna null para a tela criar a categoria apenas localmente.
 */
export async function createCategory(_input: NewCategoryInput): Promise<Category | null> {
  return null;
}

/* ============================================================
   LEITURA
   ============================================================ */

export async function fetchCollectionState(): Promise<CollectionState | null> {
  const [statusRes, execRes] = await Promise.all([
    djangoRequest<any>("/api/desktop/magalu/status/"),
    djangoRequest<any>("/api/desktop/executions/?limit=1"),
  ]);
  if (!statusRes.ok) return null;

  const s = statusRes.data ?? {};
  const lastExecution = execRes.ok ? execRes.data?.execucoes?.[0] : null;
  const status = mapStatus(s.status ?? s.estado);
  const busyByOther = String(s.status ?? "").toLowerCase() === "ocupado";

  const keywords: string[] = Array.isArray(s.keywords) ? s.keywords : [];
  const categories: string[] = Array.isArray(s.categorias) ? s.categorias : [];

  return {
    status,
    marketplaceId: status === "idle" || status === "error" ? null : MAGALU_ID,
    categoryIds: [...categories, ...keywords],
    lastRunAt: s.inicio ?? lastExecution?.inicio ?? null,
    processedProducts: typeof s.progresso?.processados === "number" ? s.progresso.processados : null,
    error: busyByOther
      ? "O coletor está em uso por outro usuário. Aguarde a finalização."
      : s.erro || null,
    executionId: s.execucao_id ?? lastExecution?.id ?? null,
  };
}

/** Logs da execução informada (mais recentes primeiro). */
export async function fetchCollectionLogs(executionId?: number | null): Promise<CollectionLog[]> {
  if (!executionId) return [];
  const res = await djangoRequest<any>(`/api/desktop/logs/?execution_id=${executionId}&limit=500`);
  if (!res.ok || !Array.isArray(res.data?.logs)) return [];
  return res.data.logs
    .slice(-50)
    .reverse()
    .map((l: any) => ({
      id: String(l.id),
      at: l.criado_em,
      level: mapLevel(l.nivel),
      message: String(l.mensagem ?? ""),
    }));
}

/* ============================================================
   ESCRITA
   ============================================================ */

async function afterAction(res: ApiResult<any>): Promise<CollectionActionResult> {
  if (!res.ok) {
    const missing: string[] | undefined = res.data?.keywords_sem_template;
    const error = missing?.length
      ? `Configure um template de divulgação para: ${missing.join(", ")}.`
      : res.error;
    return { state: null, error, warnings: [] };
  }
  const warnings: string[] = Array.isArray(res.data?.avisos)
    ? res.data.avisos.map((a: any) => String(a.mensagem ?? a)).filter(Boolean)
    : [];
  return { state: await fetchCollectionState(), error: null, warnings };
}

export async function startCollection(args: {
  marketplaceId: string;
  categories: Category[];
}): Promise<CollectionActionResult> {
  if (args.marketplaceId !== MAGALU_ID) {
    return { state: null, error: "Este marketplace ainda não está disponível para coleta na web.", warnings: [] };
  }
  const natives = args.categories.filter((c) => c.isNative);
  const customs = args.categories.filter((c) => !c.isNative);
  const res = await djangoRequest<any>("/api/desktop/magalu/start/", {
    method: "POST",
    body: {
      categorias: natives.map((c) => c.id),
      keywords: customs.map((c) => c.id),
      categorias_loop: natives.filter((c) => c.loop).map((c) => c.id),
      keywords_loop: customs.filter((c) => c.loop).map((c) => c.id),
    },
  });
  return afterAction(res);
}

export async function pauseCollection(): Promise<CollectionActionResult> {
  return afterAction(await djangoRequest<any>("/api/desktop/magalu/pause/", { method: "POST" }));
}

export async function resumeCollection(): Promise<CollectionActionResult> {
  return afterAction(await djangoRequest<any>("/api/desktop/magalu/resume/", { method: "POST" }));
}

export async function stopCollection(): Promise<CollectionActionResult> {
  return afterAction(await djangoRequest<any>("/api/desktop/magalu/stop/", { method: "POST" }));
}
