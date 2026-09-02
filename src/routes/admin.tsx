import { Outlet, createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Chargement…
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  return <Outlet />;
}
