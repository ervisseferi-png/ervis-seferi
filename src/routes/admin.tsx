import { Outlet, createFileRoute, Navigate } from "@tanstack/react-router";
import { useAdminSession } from "@/lib/supabase/use-session";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, aal, isPending } = useAdminSession();

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Chargement…
      </div>
    );
  }

  if (!user || aal !== "aal2") return <Navigate to="/login" />;

  return <Outlet />;
}
