import { useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getAuthBootstrap, persistRememberSession } from "@/lib/cms/queries";

export const Route = createFileRoute("/login")({
  loader: () => getAuthBootstrap(),
  component: Login,
});

function Login() {
  const { allowSignup } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPending && user) return <Navigate to="/admin" />;

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (allowSignup) {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: "Ervis Seferi",
          callbackURL: "/admin",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/admin",
          rememberMe: stayLoggedIn,
        });
        if (err) throw new Error(err.message);
      }
      if (stayLoggedIn) {
        try {
          await persistRememberSession();
        } catch {
          /* session is already created; 15-day cookie is best-effort */
        }
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : allowSignup
            ? "Création impossible."
            : "Connexion impossible.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-center font-serif text-3xl text-white">
        {allowSignup ? "Créer le compte administrateur" : "Administration"}
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        {allowSignup
          ? "Première configuration du site. Ce compte sera le seul administrateur ; l’inscription se ferme ensuite."
          : "Accès réservé à la publication et à la gestion du site."}
      </p>

      <div className="glass-card mt-10 rounded-2xl p-8">
        {error ? (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={(e) => void handleEmail(e)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              required
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              required
              minLength={8}
              autoComplete={allowSignup ? "new-password" : "current-password"}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-500/50"
            />
          </div>
          <label className="flex min-h-11 items-start gap-3 text-sm text-slate-300">
            <input
              id="stay-logged-in"
              name="stayLoggedIn"
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              Rester connecté 15 jours sur cet appareil
              <span className="mt-0.5 block text-xs text-slate-500">
                Le mot de passe ne sera redemandé qu’après 15 jours.
              </span>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
          >
            {loading
              ? "Patientez…"
              : allowSignup
                ? "Créer le compte"
                : "Se connecter"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link to="/" className="hover:text-slate-400">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
