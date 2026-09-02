const FALLBACK_URL = "https://mzmfncofzwomtbbnkipt.supabase.co";

function readEnv(name: string): string {
  if (typeof process !== "undefined" && process.env[name]?.trim()) {
    return process.env[name]!.trim();
  }
  try {
    const meta = import.meta.env as Record<string, string | undefined>;
    const value = meta[name];
    if (value?.trim()) return value.trim();
  } catch {
    /* import.meta.env unavailable in some server contexts */
  }
  return "";
}

export function getSupabaseUrl(): string {
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    readEnv("VITE_SUPABASE_URL") ||
    FALLBACK_URL
  );
}

export function getSupabaseAnonKey(): string {
  return (
    readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    readEnv("VITE_SUPABASE_ANON_KEY")
  );
}
