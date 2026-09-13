/**
 * Client for the server-side admin API (/api/admin).
 *
 * The panel used to hold a boolean in sessionStorage and write to Supabase with
 * the anon key. Now it holds a short-lived HMAC token issued by the server, and
 * every read/write goes through the server using the service_role key — so the
 * anon key no longer needs (or has) access to registrations or name_merges.
 */

const TOKEN_KEY = "medestudia_admin_token";

export interface AdminData {
  summaries: unknown[];
  comments: unknown[];
  registrations: unknown[];
  nameMerges: Array<{ alias: string; canonical: string }>;
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}

async function call<T>(action: string, payload?: unknown): Promise<T> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token: getToken(), payload }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    // Token rejected: force a fresh login rather than failing silently.
    clearToken();
    throw new Error(data?.error ?? "Sesión expirada");
  }
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data as T;
}

/** Exchange the password for a token. Returns false on a wrong password. */
export async function login(password: string): Promise<boolean> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", password }),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  if (!data?.token) return false;
  sessionStorage.setItem(TOKEN_KEY, data.token);
  return true;
}

export const adminApi = {
  load: () => call<AdminData>("load"),
  mergeUpsert: (rows: Array<{ alias: string; canonical: string }>) =>
    call<{ ok: true }>("mergeUpsert", { rows }),
  mergeDelete: (alias: string) => call<{ ok: true }>("mergeDelete", { alias }),
  mergeClear: () => call<{ ok: true }>("mergeClear"),
  registrationInsert: (rows: Array<Record<string, unknown>>) =>
    call<{ ok: true }>("registrationInsert", { rows }),
  registrationDelete: (id: string) => call<{ ok: true }>("registrationDelete", { id }),
};
