import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getRememberStatus,
  persistRememberSession,
  refreshRememberSession,
} from "@/lib/cms/queries";
import { formatDate } from "@/lib/utils";
import { GhostButton } from "./fields";

export function RememberSessionKeeper() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (isPending || !user) return;
    void refreshRememberSession().catch(() => {});
  }, [user, isPending]);

  return null;
}

export function AdminSessionCard() {
  const [state, setState] = useState<{
    remembered: boolean;
    until: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getRememberStatus()
      .then((s) => {
        if (!cancelled) setState(s);
      })
      .catch(() => {
        if (!cancelled) setState({ remembered: false, until: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const result = await persistRememberSession();
      setState({ remembered: true, until: result.until });
    } catch {
      /* keep current state */
    } finally {
      setBusy(false);
    }
  }

  if (!state) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
      {state.remembered && state.until ? (
        <p className="text-sm text-slate-300">
          Resté connecté sur cet appareil jusqu’au{" "}
          <span className="text-gold-400">{formatDate(state.until)}</span>.
          Le mot de passe ne sera redemandé qu’après cette date.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-300">
            Rester connecté 15 jours sur cet appareil
            <span className="mt-0.5 block text-xs text-slate-500">
              Sans cette option, la session se termine à la fermeture du
              navigateur.
            </span>
          </p>
          <GhostButton onClick={() => void enable()} disabled={busy}>
            {busy ? "Activation…" : "Activer"}
          </GhostButton>
        </div>
      )}
    </div>
  );
}
