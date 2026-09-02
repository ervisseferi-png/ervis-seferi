import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { savePost } from "@/lib/cms/queries";
import { cn, slugify } from "@/lib/utils";
import { pathLabel, pathOf, toTree, type TreeNode } from "@/lib/cms/tree";
import type { Category, Post, PostCategoryLink, PostStatus } from "@/lib/cms/types";
import { Field, GhostButton, GoldButton, TextArea, TextInput } from "./fields";

const PREVIEW_KEY = "ervis.preview-post";
export const EDITOR_KEY = "ervis.editor-form";

export type PreviewPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
  show_published_date: boolean;
  show_updated_date: boolean;
  categories: Category[];
};

function emptyPost(): {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  scheduled_at: string;
  show_published_date: boolean;
  show_updated_date: boolean;
  categoryIds: number[];
  categoryOrder: Record<number, number>;
} {
  return {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    seo_title: "",
    seo_description: "",
    scheduled_at: "",
    show_published_date: false,
    show_updated_date: false,
    categoryIds: [],
    categoryOrder: {},
  };
}

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CategoryTreePicker({
  categories,
  selectedIds,
  onToggle,
  categoryOrder,
  onOrderChange,
  usedCount,
}: {
  categories: Category[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  categoryOrder: Record<number, number>;
  onOrderChange: (id: number, n: number) => void;
  usedCount: (id: number) => number;
}) {
  const tree = useMemo(() => toTree(categories), [categories]);
  const [openIds, setOpenIds] = useState<Set<number>>(() => {
    const open = new Set<number>();
    for (const id of selectedIds) {
      for (const cat of pathOf(id, categories)) open.add(cat.id);
    }
    return open;
  });

  function toggleOpen(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 text-xs text-gold-400"
            >
              {pathLabel(id, categories)}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {tree.map((node) => (
          <PickerBranch
            key={node.id}
            node={node}
            depth={1}
            openIds={openIds}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleOpen={toggleOpen}
            categoryOrder={categoryOrder}
            onOrderChange={onOrderChange}
            usedCount={usedCount}
          />
        ))}
      </div>
    </div>
  );
}

function PickerBranch({
  node,
  depth,
  openIds,
  selectedIds,
  onToggle,
  onToggleOpen,
  categoryOrder,
  onOrderChange,
  usedCount,
}: {
  node: TreeNode<Category>;
  depth: number;
  openIds: Set<number>;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleOpen: (id: number) => void;
  categoryOrder: Record<number, number>;
  onOrderChange: (id: number, n: number) => void;
  usedCount: (id: number) => number;
}) {
  const checked = selectedIds.includes(node.id);
  const open = openIds.has(node.id);
  const hasKids = node.children.length > 0;
  const others = usedCount(node.id);

  return (
    <div className={depth > 1 ? "border-l border-white/10 pl-3 sm:pl-4" : ""}>
      <div className="rounded-xl border border-white/10 bg-navy-900/60">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(node.id)}
              className="h-4 w-4 shrink-0"
            />
            <span className="truncate">{node.name}</span>
          </label>
          {checked ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Position</span>
              <input
                type="number"
                min={1}
                value={categoryOrder[node.id] ?? 1}
                onChange={(e) => onOrderChange(node.id, Number(e.target.value) || 1)}
                className="h-10 w-16 rounded-lg border border-white/10 bg-navy-950 px-2 text-center text-white"
              />
              {others > 0 ? (
                <span className="hidden sm:inline">
                  {others} autre{others > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          ) : null}
          {hasKids ? (
            <button
              type="button"
              onClick={() => onToggleOpen(node.id)}
              aria-expanded={open}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gold-400 hover:bg-white/5"
            >
              <ChevronDown
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  open ? "rotate-180" : "rotate-0",
                )}
              />
              <span className="sr-only">
                {open ? "Replier" : "Déplier"} {node.name}
              </span>
            </button>
          ) : null}
        </div>
      </div>
      {open && hasKids ? (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <PickerBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              openIds={openIds}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onToggleOpen={onToggleOpen}
              categoryOrder={categoryOrder}
              onOrderChange={onOrderChange}
              usedCount={usedCount}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ArticleEditor({
  categories,
  posts,
  links,
  editing,
  onClose,
  onSaved,
}: {
  categories: Category[];
  posts: Post[];
  links: PostCategoryLink[];
  editing: Post | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const navigate = useNavigate();
  const initial = useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(EDITOR_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as ReturnType<typeof emptyPost>;
          if (!editing || saved.id === editing.id) return saved;
        }
      } catch {
        /* ignore */
      }
    }
    if (!editing) return emptyPost();
    const assigned = links.filter((l) => l.post_id === editing.id);
    const categoryOrder: Record<number, number> = {};
    for (const l of assigned) categoryOrder[l.category_id] = l.sort_order + 1;
    return {
      id: editing.id,
      title: editing.title,
      slug: editing.slug,
      excerpt: editing.excerpt,
      content: editing.content,
      cover_image: editing.cover_image,
      seo_title: editing.seo_title,
      seo_description: editing.seo_description,
      scheduled_at: toDatetimeLocal(editing.scheduled_at),
      show_published_date: editing.show_published_date,
      show_updated_date: editing.show_updated_date,
      categoryIds: assigned.map((l) => l.category_id),
      categoryOrder,
    };
  }, [editing, links]);

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState<PostStatus | "preview" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(id: number) {
    setForm((f) => {
      const has = f.categoryIds.includes(id);
      const categoryIds = has
        ? f.categoryIds.filter((x) => x !== id)
        : [...f.categoryIds, id];
      const categoryOrder = { ...f.categoryOrder };
      if (has) delete categoryOrder[id];
      else if (!categoryOrder[id]) {
        const used = links
          .filter((l) => l.category_id === id)
          .map((l) => l.sort_order);
        categoryOrder[id] = (used.length ? Math.max(...used) : -1) + 2;
      }
      return { ...f, categoryIds, categoryOrder };
    });
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_600_000) {
      setError("Image trop lourde (1,5 Mo max).");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      patch("cover_image", String(reader.result || ""));
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Lecture de l’image impossible.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  function buildPayload(status: PostStatus) {
    return {
      id: form.id,
      title: form.title,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt,
      content: form.content,
      cover_image: form.cover_image,
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      status,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      show_published_date: form.show_published_date,
      show_updated_date: form.show_updated_date,
      categories: form.categoryIds.map((category_id) => ({
        category_id,
        sort_order: Math.max(0, (form.categoryOrder[category_id] ?? 1) - 1),
      })),
    };
  }

  function previewNow() {
    sessionStorage.setItem(EDITOR_KEY, JSON.stringify(form));
    const payload: PreviewPayload = {
      title: form.title || "Sans titre",
      slug: form.slug || slugify(form.title) || "apercu",
      excerpt: form.excerpt,
      content: form.content,
      cover_image: form.cover_image,
      status: "draft",
      published_at: form.show_published_date ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
      show_published_date: form.show_published_date,
      show_updated_date: form.show_updated_date,
      categories: categories
        .filter((c) => form.categoryIds.includes(c.id))
        .map((c) => ({ ...c, name: pathLabel(c.id, categories) })),
    };
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(payload));
    void navigate({ to: "/admin/preview" });
  }

  async function persist(status: PostStatus) {
    if (status === "scheduled" && !form.scheduled_at) {
      setError("Choisissez une date et une heure pour planifier.");
      return;
    }
    setSaving(status);
    setError(null);
    setMessage(null);
    try {
      await savePost({ data: buildPayload(status) });
      sessionStorage.removeItem(EDITOR_KEY);
      sessionStorage.removeItem(PREVIEW_KEY);
      await onSaved();
      const label =
        status === "published"
          ? "Article publié."
          : status === "scheduled"
            ? "Article planifié."
            : "Brouillon enregistré.";
      setMessage(label);
      if (!form.id) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setSaving(null);
    }
  }

  const usedPositions = (categoryId: number) =>
    posts
      .filter((p) => p.id !== form.id)
      .filter((p) =>
        links.some((l) => l.post_id === p.id && l.category_id === categoryId),
      ).length;

  return (
    <form
      className="glass-card space-y-5 rounded-2xl p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        void persist("published");
      }}
    >
      <h2 className="font-serif text-xl text-white">
        {form.id ? "Modifier l’article" : "Nouvel article"}
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Titre">
          <TextInput
            value={form.title}
            required
            onChange={(v) => {
              patch("title", v);
              if (!form.id) patch("slug", slugify(v));
            }}
          />
        </Field>
        <Field label="Slug (URL)">
          <TextInput value={form.slug} onChange={(v) => patch("slug", v)} />
        </Field>
      </div>

      <Field label="Extrait">
        <TextArea value={form.excerpt} onChange={(v) => patch("excerpt", v)} rows={2} />
      </Field>

      <Field label="Image de couverture">
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => void handleImage(e.target.files?.[0])}
          className="text-sm text-slate-400"
        />
        {uploading ? <span className="ml-2 text-xs text-slate-500">Lecture…</span> : null}
        {form.cover_image ? (
          <div className="mt-3">
            <img src={form.cover_image} alt="" className="h-32 rounded-lg object-cover" />
            <button
              type="button"
              className="mt-1 text-xs text-red-400"
              onClick={() => patch("cover_image", "")}
            >
              Retirer
            </button>
          </div>
        ) : null}
      </Field>

      <Field label="Contenu (HTML simple)" hint="p, h2, h3, strong, em, a, ul, li, img, blockquote…">
        <TextArea
          value={form.content}
          onChange={(v) => patch("content", v)}
          rows={12}
          mono
          required
        />
      </Field>

      <div>
        <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
          Catégories et ordre d’apparition
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Dépliez une rubrique pour voir ses sous-catégories. Un article peut être
          rattaché à n’importe quel niveau.
        </p>
        <CategoryTreePicker
          categories={categories}
          selectedIds={form.categoryIds}
          onToggle={toggleCategory}
          categoryOrder={form.categoryOrder}
          onOrderChange={(id, n) =>
            setForm((f) => ({
              ...f,
              categoryOrder: { ...f.categoryOrder, [id]: n },
            }))
          }
          usedCount={usedPositions}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="SEO titre">
          <TextInput value={form.seo_title} onChange={(v) => patch("seo_title", v)} />
        </Field>
        <Field label="SEO description">
          <TextInput
            value={form.seo_description}
            onChange={(v) => patch("seo_description", v)}
          />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-navy-900/40 p-4">
        <label className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.show_published_date}
            onChange={(e) => patch("show_published_date", e.target.checked)}
            className="h-4 w-4"
          />
          Afficher la date de publication
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.show_updated_date}
            onChange={(e) => patch("show_updated_date", e.target.checked)}
            className="h-4 w-4"
          />
          Afficher la date de modification
        </label>
        <p className="text-xs text-slate-500">
          Par défaut, les articles sont publiés sans date visible.
        </p>
      </div>

      <Field
        label="Planification"
        hint="Utilisé uniquement si vous cliquez sur « Planifier »."
      >
        <TextInput
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(v) => patch("scheduled_at", v)}
        />
      </Field>

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

      <div className="flex flex-wrap gap-3 pt-1">
        <GhostButton onClick={previewNow}>Aperçu</GhostButton>
        <GhostButton
          disabled={saving !== null}
          onClick={() => void persist("draft")}
        >
          {saving === "draft" ? "Enregistrement…" : "Laisser en brouillon"}
        </GhostButton>
        <GhostButton
          disabled={saving !== null}
          onClick={() => void persist("scheduled")}
        >
          {saving === "scheduled" ? "Planification…" : "Planifier"}
        </GhostButton>
        <GoldButton type="submit" disabled={saving !== null}>
          {saving === "published" ? "Publication…" : "Publier"}
        </GoldButton>
        <GhostButton onClick={onClose}>Fermer</GhostButton>
      </div>
    </form>
  );
}

export { PREVIEW_KEY };
