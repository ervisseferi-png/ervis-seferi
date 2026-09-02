import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserClient, getStayLoggedInUntil, setStayLoggedIn } from "./client";

export type AdminSession = {
  user: User | null;
  aal: string | null;
  isPending: boolean;
};

export function useAdminSession(): AdminSession {
  const [state, setState] = useState<AdminSession>({
    user: null,
    aal: null,
    isPending: true,
  });

  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserClient();

    async function load() {
      try {
        const until = getStayLoggedInUntil();
        const { data } = await supabase.auth.getSession();
        if (!until && data.session) {
          /* sessionStorage-backed; leave as-is */
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        let aal: string | null = null;
        if (user) {
          const { data: level } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          aal = level?.currentLevel ?? null;
        }
        if (!cancelled) setState({ user, aal, isPending: false });
      } catch {
        if (!cancelled) setState({ user: null, aal: null, isPending: false });
      }
    }

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export { setStayLoggedIn };
