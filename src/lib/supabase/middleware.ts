import { createMiddleware } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export const supabaseAuthMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getAccessToken } = await import("./client");
    return next({
      sendContext: { accessToken: (await getAccessToken()) ?? undefined },
    });
  })
  .server(async ({ next, context }) => {
    const token = context.accessToken;
    if (!token) throw new UnauthorizedError();
    const key = getSupabaseAnonKey();
    if (!key) throw new UnauthorizedError();
    const supabase = createClient(getSupabaseUrl(), key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedError();
    return next({ context: { userId: data.user.id } });
  });
