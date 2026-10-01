// Base is an origin, without /api. An empty production value uses this domain.
const API_URL = (import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "")).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function getToken(): string | null {
  return localStorage.getItem("hdm_token");
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem("hdm_token", token);
  else localStorage.removeItem("hdm_token");
}

export function resolveApiAsset(value: unknown): string {
  if (typeof value !== "string") return "";
  // Legacy images used /uploads; new files use /api/uploads or /api/documentos.
  if (value.startsWith("/uploads/") || value.startsWith("/api/uploads/") || value.startsWith("/api/documentos/")) return `${API_URL}${value}`;
  if (/^(https?:\/\/|\/(?!\/))/.test(value)) return value;
  return "";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("X-Auth-Token", token);
  let method = options.method;
  if (method === "PUT" || method === "DELETE" || method === "PATCH") {
    headers.set("X-HTTP-Method-Override", method);
    method = "POST";
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, method, headers });
  if (!res.ok) {
    let detail = `Ocurrió un error (HTTP ${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
    } catch { detail = `El servidor no pudo atender la solicitud (HTTP ${res.status}). Intenta nuevamente.`; }
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event("hdm:unauthorized"));
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  if (!res.headers.get("content-type")?.includes("application/json")) throw new ApiError("No se pudo conectar con el servicio. Intenta nuevamente.", res.status);
  return res.json();
}

export async function downloadApiFile(path: string) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("X-Auth-Token", token);
  const res = await fetch(resolveApiAsset(path), { headers });
  if (!res.ok) throw new ApiError("No se pudo descargar el archivo.", res.status);
  const objectUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = path.split("/").pop() || "documento";
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }),
};
export { API_URL };
