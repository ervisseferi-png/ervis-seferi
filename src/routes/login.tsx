import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { getBrowserClient, setStayLoggedIn } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/use-session";

export const Route = createFileRoute("/login")({ component: Login });

type Step = "login" | "mfa" | "enroll";

function Login() {
  const { user, aal, isPending } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [stayLoggedIn, setStay] = useState(false);
  const [step, setStep] = useState<Step>("login");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPending) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = getBrowserClient();
        if (user && aal === "aal2") return;
        if (user) {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const totp = factors?.totp?.[0];
          if (cancelled) return;
          if (totp?.status === "verified") {
            setFactorId(totp.id);
            setStep("mfa");
          } else {
            await startEnroll();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Connexion impossible.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, aal, isPending]);

  if (!isPending && user && aal === "aal2") return <Navigate to="/admin" />;

  async function startEnroll() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Ervis Seferi Admin",
      });
      if (enrollError) throw new Error(enrollError.message);
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription MFA impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setStayLoggedIn(stayLoggedIn);
      const supabase = getBrowserClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signError) throw new Error(signError.message);
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (totp?.status === "verified") {
        setFactorId(totp.id);
        setStep("mfa");
      } else {
        await startEnroll();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw new Error(challengeError.message);
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: otp,
      });
      if (verifyError) throw new Error(verifyError.message);
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-center font-serif text-3xl text-white">Administration</h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Accès sécurisé — mot de passe + application d'authentification
      </p>

      <div className="glass-card mt-10 rounded-2xl p-8">
        {error ? (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {step === "login" ? (
          <form onSubmit={(e) => void handleLogin(e)} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                required
                autoComplete="username"
                placeholder="votre@email.com"
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
                autoComplete="current-password"
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
                onChange={(e) => setStay(e.target.checked)}
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
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        ) : null}

        {step === "enroll" ? (
          <div className="space-y-6">
            <p className="text-sm text-slate-300">
              Scannez ce QR code avec Google Authenticator, Authy ou une
              application TOTP similaire. Conservez le secret en lieu sûr.
            </p>
            {qrCode ? (
              <div className="flex justify-center rounded-xl bg-white p-4">
                <img src={qrCode} alt="QR Code TOTP" className="h-48 w-48" />
              </div>
            ) : null}
            {secret ? (
              <div className="rounded-lg bg-navy-900 p-3 text-center">
                <div className="mb-1 text-xs text-slate-500">
                  Secret (si scan impossible)
                </div>
                <code className="break-all text-sm text-gold-400">{secret}</code>
              </div>
            ) : null}
            <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
                  Code à 6 chiffres
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  required
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-gold-500/50"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
              >
                {loading ? "Vérification…" : "Activer et continuer"}
              </button>
            </form>
          </div>
        ) : null}

        {step === "mfa" ? (
          <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-5">
            <p className="text-sm text-slate-300">
              Entrez le code à 6 chiffres de votre application
              d'authentification.
            </p>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-500">
                Code OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                required
                autoFocus
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-gold-500/50"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 transition hover:bg-gold-400 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Valider"}
            </button>
          </form>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link to="/" className="hover:text-slate-400">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
