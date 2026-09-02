import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const AUTH_STORAGE_KEY = "ervis-admin-auth";
const REMEMBER_UNTIL_KEY = "ervis-admin-remember-until";
const REMEMBER_MS = 15 * 24 * 60 * 60 * 1000;

function rememberUntil(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMEMBER_UNTIL_KEY);
    if (!raw) return null;
    const until = Number(raw);
    if (!Number.isFinite(until) || until < Date.now()) {
      window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
      return null;
    }
    return until;
  } catch {
    return null;
  }
}

export function setStayLoggedIn(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) {
      window.localStorage.setItem(
        REMEMBER_UNTIL_KEY,
        String(Date.now() + REMEMBER_MS),
      );
      const existing =
        window.sessionStorage.getItem(AUTH_STORAGE_KEY) ??
        window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (existing) window.localStorage.setItem(AUTH_STORAGE_KEY, existing);
    } else {
      window.localStorage.removeItem(REMEMBER_UNTIL_KEY);
      const existing = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (existing) window.sessionStorage.setItem(AUTH_STORAGE_KEY, existing);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function getStayLoggedInUntil(): string | null {
  const until = rememberUntil();
  return until ? new Date(until).toISOString() : null;
}

function activeStorage(): Storage {
  if (typeof window === "undefined") {
    const mem = new Map<string, string>();
    return {
      get length() {
        return mem.size;
      },
      clear: () => mem.clear(),
      getItem: (k) => mem.get(k) ?? null,
      key: () => null,
      removeItem: (k) => {
        mem.delete(k);
      },
      setItem: (k, v) => {
        mem.set(k, v);
      },
    };
  }
  return rememberUntil() ? window.localStorage : window.sessionStorage;
}

function authStorage() {
  return {
    getItem: (key: string) => {
      try {
        return activeStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        activeStorage().setItem(key, value);
      } catch {
        /* ignore */
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

let browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!key) {
    throw new Error(
      "Clé Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.",
    );
  }
  browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: AUTH_STORAGE_KEY,
      storage: authStorage(),
    },
  });
  return browserClient;
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { data } = await getBrowserClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
