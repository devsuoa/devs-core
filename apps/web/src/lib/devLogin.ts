/**
 * Logins for the seeded local accounts (db/seed/dev_seed.sql), for `pnpm dev` only.
 *
 * No Supabase Auth runs locally, so this signs a login token with the local compose secret,
 * which only the local Docker API trusts. Every caller checks `import.meta.env.DEV` first, so
 * none of this is in a production build.
 */
const LOCAL_SECRET = "local-dev-jwt-secret-not-for-production-0123456789";
const LOCAL_ISSUER = "http://localhost:54321/auth/v1";
const PASSWORD = "development";
const STORAGE_KEY = "devToken";

const ACCOUNTS: Record<string, string> = {
  "techexec@example.test": "00000000-0000-4000-8000-000000000001",
  "superuser@example.test": "00000000-0000-4000-8000-000000000002",
  "pres@example.test": "00000000-0000-4000-8000-000000000004",
};

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signToken(sub: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64url(
    encoder.encode(
      JSON.stringify({
        sub,
        email,
        iss: LOCAL_ISSUER,
        aud: "authenticated",
        role: "authenticated",
        iat: now,
        exp: now + 8 * 60 * 60,
      }),
    ),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(LOCAL_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`));
  return `${header}.${payload}.${base64url(new Uint8Array(signature))}`;
}

/** Logs in as a seeded account. False if the email isn't one of them or the password is wrong. */
export async function devSignIn(email: string, password: string): Promise<boolean> {
  const normalised = email.trim().toLowerCase();
  const sub = ACCOUNTS[normalised];
  if (!sub || password !== PASSWORD) return false;
  localStorage.setItem(STORAGE_KEY, await signToken(sub, normalised));
  return true;
}

/** The current dev login token, or null if there's none or it has expired. */
export function devToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEY);
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp: number };
    if (exp * 1000 > Date.now()) return token;
  } catch {
    // Not a token we wrote: drop it.
  }
  localStorage.removeItem(STORAGE_KEY);
  return null;
}

export function devSignOut(): void {
  localStorage.removeItem(STORAGE_KEY);
}
