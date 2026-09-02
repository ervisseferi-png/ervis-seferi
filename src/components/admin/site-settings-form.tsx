import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { saveSiteSettings } from "@/lib/cms/queries";
import type { SiteSettings } from "@/lib/cms/types";
import { Field, GhostButton, GoldButton, TextArea, TextInput } from "./fields";

export function SiteSettingsForm({
  initial,
  onSaved,
}: {
  initial: SiteSettings;
  onSaved: (site: SiteSettings) => void;
}) {
  const router = useRouter();
  const [site, setSite] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSite((s) => ({ ...s, [key]: value }));
  }

  function handleAvatar(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_600_000) {
      setError("Photo trop lourde (1,5 Mo max).");
      return;
    }
    setError(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      set("avatar_image", String(reader.result || ""));
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Lecture de la photo impossible.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await saveSiteSettings({ data: site });
      onSaved(site);
      await router.invalidate();
      setMessage("Modifications enregistrées.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">En-tête</h2>
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-gold-500/40 bg-navy-800">
            {site.avatar_image ? (
              <img
                src={site.avatar_image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-gold-400">
                {site.initials.slice(0, 3)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Photo de profil
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading}
              onChange={(e) => handleAvatar(e.target.files?.[0])}
              className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-navy-950 hover:file:bg-gold-400"
            />
            <p className="text-xs text-slate-500">
              Affichée à côté de votre nom, en haut du site. Photo carrée de
              préférence, comme sur LinkedIn. 1,5 Mo max.
            </p>
            {uploading ? <p className="text-xs text-slate-500">Lecture…</p> : null}
            {site.avatar_image ? (
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => set("avatar_image", "")}
              >
                Retirer la photo
              </button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nom affiché">
            <TextInput value={site.brand_name} onChange={(v) => set("brand_name", v)} />
          </Field>
          <Field label="Initiales (si pas de photo)">
            <TextInput value={site.initials} onChange={(v) => set("initials", v)} />
          </Field>
        </div>
        <Field label="Sous-titre sous le nom">
          <TextInput
            value={site.brand_subtitle}
            onChange={(v) => set("brand_subtitle", v)}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Libellé Accueil">
            <TextInput
              value={site.nav_home_label}
              onChange={(v) => set("nav_home_label", v)}
            />
          </Field>
          <Field label="Libellé connaissances">
            <TextInput
              value={site.nav_blog_label}
              onChange={(v) => set("nav_blog_label", v)}
            />
          </Field>
          <Field label="Libellé Contacts">
            <TextInput
              value={site.nav_contact_label}
              onChange={(v) => set("nav_contact_label", v)}
            />
          </Field>
        </div>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Page d’accueil — Héro</h2>
        <Field label="Pastille au-dessus du nom">
          <TextInput value={site.hero_badge} onChange={(v) => set("hero_badge", v)} />
        </Field>
        <Field
          label="Titre principal"
          hint="Un retour à la ligne est conservé. Exemple : Ervis puis Seferi."
        >
          <TextArea
            value={site.hero_title}
            onChange={(v) => set("hero_title", v)}
            rows={2}
          />
        </Field>
        <Field label="Texte d’introduction">
          <TextArea
            value={site.hero_tagline}
            onChange={(v) => set("hero_tagline", v)}
            rows={4}
          />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Bouton principal">
            <TextInput
              value={site.hero_cta_primary}
              onChange={(v) => set("hero_cta_primary", v)}
            />
          </Field>
          <Field label="Bouton secondaire">
            <TextInput
              value={site.hero_cta_secondary}
              onChange={(v) => set("hero_cta_secondary", v)}
            />
          </Field>
        </div>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Cartes latérales</h2>
        <Field label="Titre carte expertise">
          <TextInput
            value={site.expertise_title}
            onChange={(v) => set("expertise_title", v)}
          />
        </Field>
        <Field label="Texte carte expertise">
          <TextArea
            value={site.expertise_body}
            onChange={(v) => set("expertise_body", v)}
            rows={3}
          />
        </Field>
        <Field label="Titre carte « pourquoi »">
          <TextInput value={site.why_title} onChange={(v) => set("why_title", v)} />
        </Field>
        <Field label="Texte carte « pourquoi »">
          <TextArea value={site.why_body} onChange={(v) => set("why_body", v)} rows={3} />
        </Field>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Page connaissances</h2>
        <Field label="Titre de la page">
          <TextInput value={site.blog_title} onChange={(v) => set("blog_title", v)} />
        </Field>
        <Field label="Introduction">
          <TextArea
            value={site.blog_intro}
            onChange={(v) => set("blog_intro", v)}
            rows={3}
          />
        </Field>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Contact</h2>
        <Field label="Titre">
          <TextInput
            value={site.contact_title}
            onChange={(v) => set("contact_title", v)}
          />
        </Field>
        <Field label="Introduction">
          <TextArea
            value={site.contact_intro}
            onChange={(v) => set("contact_intro", v)}
            rows={3}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={site.contact_email}
            onChange={(v) => set("contact_email", v)}
          />
        </Field>
        <Field label="Domaines affichés">
          <TextInput
            value={site.contact_domains}
            onChange={(v) => set("contact_domains", v)}
          />
        </Field>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Réseaux sociaux</h2>
        <Field label="LinkedIn (URL complète)" hint="Laissé vide = icône masquée.">
          <TextInput
            value={site.linkedin_url}
            onChange={(v) => set("linkedin_url", v)}
            placeholder="https://www.linkedin.com/in/…"
          />
        </Field>
        <Field label="X / Twitter (URL complète)" hint="Laissé vide = icône masquée.">
          <TextInput
            value={site.x_url}
            onChange={(v) => set("x_url", v)}
            placeholder="https://x.com/…"
          />
        </Field>
      </section>

      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">Pied de page</h2>
        <Field label="Accroche sous le nom">
          <TextArea
            value={site.footer_tagline}
            onChange={(v) => set("footer_tagline", v)}
            rows={2}
          />
        </Field>
        <Field
          label="Mention de transparence IA"
          hint="Le copyright « Tous droits réservés » n’est pas modifiable."
        >
          <TextArea
            value={site.disclaimer}
            onChange={(v) => set("disclaimer", v)}
            rows={4}
          />
        </Field>
      </section>

      {message ? (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <GoldButton onClick={() => void save()} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le site"}
        </GoldButton>
        <GhostButton onClick={() => setSite(initial)}>Annuler</GhostButton>
      </div>
    </div>
  );
}
