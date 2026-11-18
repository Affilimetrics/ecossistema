/**
 * Cliente HTTP do backend Django (API /api/desktop/*).
 *
 * Autenticação: token Bearer assinado, obtido em POST /api/desktop/login/.
 * Em desenvolvimento o Vite faz proxy de /api para o Django (vite.config.mjs),
 * então não há CORS nem CSRF. Em produção, defina VITE_DJANGO_URL com a URL
 * do backend (e libere CORS no Django) ou sirva front e API na mesma origem.
 */

const TOKEN_KEY = "skallora_token";
const BASE_URL: string = ((import.meta as any).env?.VITE_DJANGO_URL as string | undefined) ?? "";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* armazenamento indisponível */
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível */
  }
};

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data: any };

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Login não usa token e não deve limpá-lo em caso de 401. */
  anonymous?: boolean;
}

export async function djangoRequest<T = any>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const token = options.anonymous ? null : getToken();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null; // resposta não-JSON (ex.: página de erro do Django)
    }

    if (res.status === 401 && !options.anonymous) clearToken();

    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.erro ?? `Erro ${res.status} no servidor.`, data };
    }
    return { ok: true, status: res.status, data: data as T };
  } catch {
    return { ok: false, status: 0, error: "Não foi possível conectar ao servidor.", data: null };
  }
}
