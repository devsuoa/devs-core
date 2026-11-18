import { supabase } from "./supabase";

/**
 * Client for the DEVS API (apps/api). All data goes through it; Supabase is only used to log in.
 * In dev, Vite proxies /api to the API on localhost:8080 (see vite.config.ts), so the base URL
 * can stay empty. In production, set VITE_API_URL to the API's address.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** An error response from the API. `code` is stable and safe to switch on. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Sent as multipart/form-data instead of `body`. */
  form?: FormData;
};

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function send(
  path: string,
  { method = "GET", body, form }: RequestOptions,
): Promise<Response> {
  const headers = await authHeader();
  let payload: BodyInit | undefined;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  if (!res.ok) {
    let problem: { code?: string; detail?: string; fields?: Record<string, string> } = {};
    try {
      problem = await res.json();
    } catch {
      // Not JSON (e.g. a proxy error page).
    }
    throw new ApiError(
      res.status,
      problem.code ?? "error",
      problem.detail ?? `Request failed (${res.status})`,
      problem.fields,
    );
  }
  return res;
}

/** Calls the API and returns the parsed JSON response (undefined for empty responses). */
export async function api<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(path, options);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Calls the API for a file (e.g. a payment screenshot) and returns a temporary object URL for it. */
export async function apiFileUrl(path: string): Promise<string> {
  const res = await send(path, {});
  return URL.createObjectURL(await res.blob());
}

/** A JSON part for multipart requests, so the API reads it as JSON rather than text. */
export function jsonPart(value: unknown): Blob {
  return new Blob([JSON.stringify(value)], { type: "application/json" });
}

/** The logged-in user as the API sees them. Roles come from the database, not the browser. */
export type Me = {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
  team: string | null;
  is_superuser: boolean;
};

export function fetchMe(): Promise<Me> {
  return api<Me>("/api/me");
}
