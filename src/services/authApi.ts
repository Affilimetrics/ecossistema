import { clearToken, djangoRequest, setToken } from "./djangoClient";

interface LoginResponse {
  sucesso: boolean;
  token: string;
  usuario: { id: number; username: string; nome: string };
}

export async function login(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  // O Django guarda o username em minúsculas (e-mail), como na tela de login web.
  const res = await djangoRequest<LoginResponse>("/api/desktop/login/", {
    method: "POST",
    body: { username: username.trim().toLowerCase(), password },
    anonymous: true,
  });
  if (!res.ok) return { ok: false, error: res.error };
  setToken(res.data.token);
  return { ok: true };
}

export async function register(name: string, email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  let timezone = "America/Sao_Paulo";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
  } catch {
    /* mantém o padrão */
  }
  // Cria a conta e já recebe o token (o usuário entra logado).
  const res = await djangoRequest<LoginResponse>("/api/desktop/register/", {
    method: "POST",
    body: { nome: name.trim(), email: email.trim().toLowerCase(), password, timezone },
    anonymous: true,
  });
  if (!res.ok) return { ok: false, error: res.error };
  setToken(res.data.token);
  return { ok: true };
}

export const logout = clearToken;
