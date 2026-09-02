"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "login" | "mfa" | "enroll";

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("login");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") {
          router.replace("/admin/dashboard");
          return;
        }
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];
        if (totp?.status === "verified") {
          setFactorId(totp.id);
          setStep("mfa");
        } else {
          await startEnroll();
        }
      }
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Ervis Seferi Admin",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStep("enroll");
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];

    if (totp?.status === "verified") {
      setFactorId(totp.id);
      setStep("mfa");
    } else {
      await startEnroll();
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setLoading(true);
    setError(null);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: otp,
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin/dashboard");
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-slate-400">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-serif text-3xl text-white text-center">
        Administration
      </h1>
      <p className="mt-2 text-center text-sm text-slate-400">
        Accès sécurisé — mot de passe + application d&apos;authentification
      </p>

      <div className="mt-10 glass-card rounded-2xl p-8">
        {error && (
          <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-500/50"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white outline-none focus:border-gold-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 hover:bg-gold-400 disabled:opacity-50 transition"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}

        {step === "enroll" && (
          <div className="space-y-6">
            <p className="text-sm text-slate-300">
              Scannez ce QR code avec Google Authenticator, Authy ou une
              application TOTP similaire. Conservez le secret en lieu sûr
              (codes de récupération).
            </p>
            {qrCode && (
              <div className="flex justify-center rounded-xl bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="QR Code TOTP" className="h-48 w-48" />
              </div>
            )}
            {secret && (
              <div className="rounded-lg bg-navy-900 p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">
                  Secret (si scan impossible)
                </div>
                <code className="text-sm text-gold-400 break-all">{secret}</code>
              </div>
            )}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                  Code à 6 chiffres
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-gold-500/50"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 hover:bg-gold-400 disabled:opacity-50"
              >
                {loading ? "Vérification…" : "Activer et continuer"}
              </button>
            </form>
          </div>
        )}

        {step === "mfa" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-sm text-slate-300">
              Entrez le code à 6 chiffres de votre application
              d&apos;authentification.
            </p>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">
                Code OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-center text-lg tracking-widest text-white outline-none focus:border-gold-500/50"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gold-500 py-3 text-sm font-medium text-navy-950 hover:bg-gold-400 disabled:opacity-50"
            >
              {loading ? "Vérification…" : "Valider"}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link href="/" className="hover:text-slate-400">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
