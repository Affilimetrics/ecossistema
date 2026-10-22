/**
 * ⚠️  CAMADA DE SERVIÇO — PRODUTOS
 *
 * Esta é a única parte do frontend que conversa com o Django.
 * Enquanto o backend não expuser as rotas, TODAS as funções retornam
 * `null`/`[]`/`false` — nunca dados fictícios apresentados como reais.
 */

import type {
  NewProductInput,
  Product,
  ProductFilters,
  ProductKpis,
  ProductSortKey,
} from "../dashboardv2/productTypes";

async function http<T>(url: string, init: RequestInit = {}): Promise<T | null> {
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

function buildQuery(
  filters: ProductFilters,
  sort: ProductSortKey,
  page: number,
  pageSize: number
): string {
  const q = new URLSearchParams();
  if (filters.search) q.set("search", filters.search);
  if (filters.marketplaceId !== "all") q.set("marketplace", filters.marketplaceId);
  if (filters.category !== "all") q.set("category", filters.category);
  if (filters.origin !== "all") q.set("origin", filters.origin);
  if (filters.availability !== "all") q.set("availability", filters.availability);
  if (filters.from) q.set("from", filters.from);
  if (filters.to) q.set("to", filters.to);
  q.set("sort", sort);
  q.set("page", String(page));
  q.set("page_size", String(pageSize));
  return q.toString();
}

export interface ProductListResponse {
  results: Product[];
  count: number;
}

export async function fetchProducts(
  filters: ProductFilters,
  sort: ProductSortKey,
  page: number,
  pageSize = 12
): Promise<ProductListResponse | null> {
  return http<ProductListResponse>(
    `/api/products/?${buildQuery(filters, sort, page, pageSize)}`
  );
}

export async function fetchProduct(id: string): Promise<Product | null> {
  return http<Product>(`/api/products/${id}/`);
}

export async function createProduct(
  input: NewProductInput
): Promise<Product | null> {
  return http<Product>("/api/products/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  id: string,
  patch: Partial<NewProductInput>
): Promise<Product | null> {
  return http<Product>(`/api/products/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  const res = await http<unknown>(`/api/products/${id}/`, { method: "DELETE" });
  return res !== undefined;
}

export async function syncProducts(): Promise<{ synced: number } | null> {
  return http<{ synced: number }>("/api/products/sync/", { method: "POST" });
}

export async function fetchProductKpis(): Promise<ProductKpis | null> {
  return http<ProductKpis>("/api/products/kpis/");
}