import { MOCK_HOT_PRODUCTS } from "../mocks/mockHotProducts";
import type { Product } from "../types/hotProductsTypes";

// Altere para `true` caso queira forçar o estado de erro sem usar ?erro=1 na URL
const FORCE_MOCK_ERROR = false;

function shouldSimulateError(): boolean {
  if (FORCE_MOCK_ERROR) return true;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    return params.get("erro") === "1";
  }
  return false;
}

/**
 * Único ponto de acesso a dados da tela "Produtos em Alta".
 * Hoje retorna mocks com latência simulada de ~500 ms.
 */
export async function getHotProducts(): Promise<Product[]> {
  // TODO(backend): trocar por fetch(`${import.meta.env.VITE_API_URL}/api/products/hot/`) ou djangoClient
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (shouldSimulateError()) {
    throw new Error(
      "Não foi possível carregar os produtos em alta no momento. Tente novamente."
    );
  }

  return MOCK_HOT_PRODUCTS.map((item) => ({ ...item }));
}

/**
 * Recalcula/recarrega os dados de produtos em alta (acionado pelo botão "Recalcular").
 */
export async function refreshHotProducts(): Promise<Product[]> {
  // TODO(backend): trocar por fetch(`${import.meta.env.VITE_API_URL}/api/products/hot/refresh/`, { method: "POST" })
  await new Promise((resolve) => setTimeout(resolve, 650));

  if (shouldSimulateError()) {
    throw new Error(
      "Falha ao recalcular as métricas de rentabilidade. Verifique sua conexão."
    );
  }

  const nowIso = new Date().toISOString();
  return MOCK_HOT_PRODUCTS.map((item) => ({
    ...item,
    updatedAt: nowIso,
  }));
}