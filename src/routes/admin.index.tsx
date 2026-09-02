import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getAdminStatus } from "@/lib/cms/queries";
import { AdminDashboard, SetupAdmin } from "@/components/admin/dashboard";

export const Route = createFileRoute("/admin/")({ component: AdminIndex });

function AdminIndex() {
  const [status, setStatus] = useState<{
    isOwner: boolean;
    needsSetup: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAdminStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Accès impossible.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center text-red-300">{error}</div>
    );
  }

  if (!status) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Vérification des droits…
      </div>
    );
  }

  if (status.needsSetup) {
    return (
      <SetupAdmin
        onReady={() => setStatus({ isOwner: true, needsSetup: false })}
      />
    );
  }

  if (!status.isOwner) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-white">Accès refusé</h1>
        <p className="mt-3 text-sm text-slate-400">
          Ce compte n’est pas administrateur du site.
        </p>
      </div>
    );
  }

  return <AdminDashboard />;
}
