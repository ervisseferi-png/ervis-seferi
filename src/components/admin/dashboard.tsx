import { useCallback, useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { deletePost, getAdminBundle } from "@/lib/cms/queries";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/use-session";
import type { Category, Post, PostCategoryLink, SiteSettings } from "@/lib/cms/types";
import { formatDate } from "@/lib/utils";
import { ArticleEditor, EDITOR_KEY } from "./article-editor";
import { CategoriesManager } from "./categories-manager";
import { GoldButton, GhostButton } from "./fields";
import { SiteSettingsForm } from "./site-settings-form";
import { AdminSessionCard } from "./remember-session";

type Tab = "articles" | "categories" | "site";

function statusLabel(post: Post) {
  if (post.status === "published") return { text: "Publié", className: "text-emerald-400" };
  if (post.status === "scheduled") return { text: "Planifié", className: "text-sky-400" };
  return { text: "Brouillon", className: "text-amber-400" };
}

export function AdminDashboard() {
  const router = useRouter();
  const { user } = useAdminSession();
  const [tab, setTab] = useState<Tab>("articles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [links, setLinks] = useState<PostCategoryLink[]>([]);
  const [editing, setEditing] = useState<Post | null | "new">(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(EDITOR_KEY) ? "new" : null;
    } catch {
      return null;
    }
  });

  const reload = useCallback(async () => {
    const data = await getAdminBundle();
    setSite(data.site);
    setCategories(data.categories);
    setPosts(data.posts);
    setLinks(data.links);
    await router.invalidate();
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Chargement du tableau de bord…
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center text-red-300">
        {error || "Impossible de charger l’administration."}
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "articles", label: "Articles" },
    { id: "categories", label: "Catégories" },
    { id: "site", label: "Site & contacts" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-400">
            Contenu, catégories, accueil et publication.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.email ? (
            <span className="max-w-[14rem] truncate text-sm text-slate-400">
              {user.email}
            </span>
          ) : null}
          <GhostButton
            onClick={async () => {
              try {
                await getBrowserClient().auth.signOut();
              } catch {
                /* still leave */
              }
              window.location.href = "/login";
            }}
          >
            Déconnexion
          </GhostButton>
        </div>
      </div>

      <AdminSessionCard />

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setEditing(null);
            }}
            className={
              tab === t.id
                ? "rounded-full bg-white/10 px-4 py-2 text-sm text-white"
                : "rounded-full px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "articles" ? (
        <div className="mt-8 space-y-8">
          {editing !== null ? (
            <ArticleEditor
              key={editing === "new" ? "new" : editing.id}
              categories={categories}
              posts={posts}
              links={links}
              editing={editing === "new" ? null : editing}
              onClose={() => {
                try {
                  sessionStorage.removeItem(EDITOR_KEY);
                } catch {
                  /* ignore */
                }
                setEditing(null);
              }}
              onSaved={reload}
            />
          ) : (
            <GoldButton onClick={() => setEditing("new")}>Nouvel article</GoldButton>
          )}

          <div>
            <h2 className="mb-4 text-sm uppercase tracking-wider text-slate-500">
              Articles existants ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun article pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => {
                  const st = statusLabel(post);
                  const cats = categories.filter((c) =>
                    links.some((l) => l.post_id === post.id && l.category_id === c.id),
                  );
                  return (
                    <div
                      key={post.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-navy-800/40 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white">{post.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          /{post.slug}
                          {cats.length ? ` · ${cats.map((c) => c.name).join(", ")}` : ""}
                          {` · ${formatDate(post.updated_at)} · `}
                          <span className={st.className}>{st.text}</span>
                          {post.status === "scheduled" && post.scheduled_at
                            ? ` · ${formatDate(post.scheduled_at)}`
                            : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.status === "published" ? (
                          <Link
                            to="/blog/$slug"
                            params={{ slug: post.slug }}
                            className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            Voir
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setEditing(post)}
                          className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Supprimer cet article ?")) return;
                            await deletePost({ data: post.id });
                            if (editing !== "new" && editing?.id === post.id) {
                              setEditing(null);
                            }
                            await reload();
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-300"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="mt-8">
          <CategoriesManager
            categories={categories}
            posts={posts}
            links={links}
            onChanged={reload}
          />
        </div>
      ) : null}

      {tab === "site" ? (
        <div className="mt-8">
          <SiteSettingsForm
            initial={site}
            onSaved={(next) => {
              setSite(next);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function SetupAdmin({ onReady }: { onReady: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="font-serif text-3xl text-white">Initialiser l’administration</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Ce compte deviendra le seul administrateur du site. Cette étape n’est
        possible qu’une seule fois.
      </p>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <div className="mt-8 flex gap-3">
        <GoldButton
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const { claimAdmin } = await import("@/lib/cms/queries");
              await claimAdmin();
              onReady();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Impossible d’initialiser.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Activation…" : "Devenir administrateur"}
        </GoldButton>
        <GhostButton onClick={() => window.history.back()}>Retour</GhostButton>
      </div>
    </div>
  );
}
