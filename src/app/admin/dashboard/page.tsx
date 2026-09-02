"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Article = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  published_at: string | null;
};

export default function AdminDashboard() {
  const supabase = createClient();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, published, created_at, published_at")
      .order("created_at", { ascending: false });
    setArticles((data as Article[]) || []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/admin");
        return;
      }

      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        router.replace("/admin");
        return;
      }

      setUserEmail(user.email ?? null);
      await loadArticles();
      setLoading(false);
    })();
  }, [supabase, router, loadArticles]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setCoverImage("");
    setSeoTitle("");
    setSeoDescription("");
    setPublished(false);
    setShowForm(false);
    setMessage(null);
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|$)/g, "");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      setMessage("Erreur upload: " + error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(path);

    setCoverImage(publicUrl);
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      title,
      slug: slug || slugify(title),
      excerpt: excerpt || null,
      content,
      cover_image: coverImage || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      published,
      published_at: published ? new Date().toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
      setMessage("Article mis à jour.");
    } else {
      const { error } = await supabase.from("articles").insert(payload);
      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }
      setMessage("Article créé.");
    }

    setSaving(false);
    await loadArticles();
    resetForm();
  }

  async function handleEdit(id: string) {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return;
    setEditingId(data.id);
    setTitle(data.title);
    setSlug(data.slug);
    setExcerpt(data.excerpt || "");
    setContent(data.content || "");
    setCoverImage(data.cover_image || "");
    setSeoTitle(data.seo_title || "");
    setSeoDescription(data.seo_description || "");
    setPublished(data.published);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("articles").delete().eq("id", id);
    await loadArticles();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-400">{userEmail}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-full bg-gold-500 px-5 py-2 text-sm font-medium text-navy-950 hover:bg-gold-400"
          >
            Nouvel article
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-400 hover:text-white"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mt-8 glass-card rounded-2xl p-8 space-y-5"
        >
          <h2 className="font-serif text-xl text-white">
            {editingId ? "Modifier l'article" : "Créer un article"}
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Titre *</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editingId) setSlug(slugify(e.target.value));
                }}
                required
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none focus:border-gold-500/40"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none focus:border-gold-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Extrait (résumé court)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none focus:border-gold-500/40"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Image de couverture
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="text-sm text-slate-400"
              />
              {uploading && (
                <span className="text-xs text-slate-500">Upload…</span>
              )}
            </div>
            {coverImage && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImage}
                  alt="Cover"
                  className="h-32 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="mt-1 text-xs text-red-400"
                >
                  Retirer
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Contenu (HTML autorisé) *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={14}
              className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-3 font-mono text-sm text-white outline-none focus:border-gold-500/40"
              placeholder={`<p>Votre texte ici...</p>\n<p>Vous pouvez utiliser <strong>gras</strong>, <a href=\"https://...\">liens</a>, <img src=\"...\" /> etc.</p>`}
            />
            <p className="mt-1 text-xs text-slate-500">
              HTML simple supporté : p, h2, h3, strong, em, a, ul, li, img,
              blockquote…
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                SEO Titre (optionnel)
              </label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none focus:border-gold-500/40"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                SEO Description (optionnel)
              </label>
              <input
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none focus:border-gold-500/40"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Publier immédiatement
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-gold-500 px-6 py-2.5 text-sm font-medium text-navy-950 hover:bg-gold-400 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/10 px-6 py-2.5 text-sm text-slate-400 hover:text-white"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="mt-12">
        <h2 className="text-sm uppercase tracking-wider text-slate-500 mb-4">
          Articles existants ({articles.length})
        </h2>
        {articles.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun article pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {articles.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-navy-800/40 px-5 py-4"
              >
                <div>
                  <div className="font-medium text-white">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    /{a.slug} · {formatDate(a.created_at)} ·{" "}
                    {a.published ? (
                      <span className="text-emerald-400">Publié</span>
                    ) : (
                      <span className="text-amber-400">Brouillon</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {a.published && (
                    <Link
                      href={`/blog/${a.slug}`}
                      target="_blank"
                      className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      Voir
                    </Link>
                  )}
                  <button
                    onClick={() => handleEdit(a.id)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-400/80 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
