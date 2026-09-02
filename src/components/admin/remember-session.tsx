import { useEffect, useState } from "react";
import { getStayLoggedInUntil, setStayLoggedIn } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { GhostButton } from "./fields";

export function AdminSessionCard() {
  const [until, setUntil] = useState<string | null>(null);

  useEffect(() => {
    setUntil(getStayLoggedInUntil());
  }, []);

  if (until) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
        <p className="text-sm text-slate-300">
          Resté connecté sur cet appareil jusqu’au{" "}
          <span className="text-gold-400">{formatDate(until)}</span>.
          Le mot de passe ne sera redemandé qu’après cette date.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-300">
          Rester connecté 15 jours sur cet appareil
          <span className="mt-0.5 block text-xs text-slate-500">
            Sans cette option, la session se termine à la fermeture du
            navigateur.
          </span>
        </p>
        <GhostButton
          onClick={() => {
            setStayLoggedIn(true);
            setUntil(getStayLoggedInUntil());
          }}
        >
          Activer
        </GhostButton>
      </div>
    </div>
  );
}
