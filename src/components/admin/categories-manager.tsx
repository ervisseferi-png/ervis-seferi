import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  deleteCategory,
  reorderCategories,
  reorderPostsInCategory,
  saveCategory,
} from "@/lib/cms/queries";
import type { Category, Post, PostCategoryLink } from "@/lib/cms/types";
import {
  MAX_CATEGORY_DEPTH,
  canNestUnder,
  childrenOf,
  depthOf,
  descendantIds,
  flattenTree,
  pathLabel,
  pathOf,
  roots,
  toTree,
} from "@/lib/cms/tree";
import { cn } from "@/lib/utils";
import { Field, GhostButton, GoldButton, TextArea, TextInput } from "./fields";

export function CategoriesManager({
  categories,
  posts,
  links,
  onChanged,
}: {
  categories: Category[];
  posts: Post[];
  links: PostCategoryLink[];
  onChanged: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => toTree(categories), [categories]);
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const top = useMemo(() => roots(categories), [categories]);

  const postsByCategory = useMemo(() => {
    const map = new Map<number, { post: Post; sort_order: number }[]>();
    for (const cat of categories) {
      const assigned = links
        .filter((l) => l.category_id === cat.id)
        .map((l) => {
          const post = posts.find((p) => p.id === l.post_id);
          return post ? { post, sort_order: l.sort_order } : null;
        })
        .filter(Boolean) as { post: Post; sort_order: number }[];
      assigned.sort((a, b) => a.sort_order - b.sort_order || a.post.id - b.post.id);
      map.set(cat.id, assigned);
    }
    return map;
  }, [categories, posts, links]);

  const active = categories.find((c) => c.id === activeId) ?? top[0] ?? null;
  const assigned = active ? (postsByCategory.get(active.id) ?? []) : [];
  const siblings = active ? childrenOf(categories, active.parent_id) : [];
  const activeIndex = active ? siblings.findIndex((c) => c.id === active.id) : -1;
  const children = active ? childrenOf(categories, active.id) : [];
  const activeDepth = active ? depthOf(active.id, categories) : 0;
  const canAddChild = active ? canNestUnder(active.id, categories) : false;

  const parentOptions = categories.filter((c) => {
    if (editingId && c.id === editingId) return false;
    if (editingId && descendantIds(editingId, categories).has(c.id)) return false;
    if (editingId && !canNestUnder(c.id, categories, editingId)) return false;
    return depthOf(c.id, categories) < MAX_CATEGORY_DEPTH;
  });

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setParentId(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveCategory({
        data: {
          id: editingId ?? undefined,
          name,
          description,
          parent_id: parentId,
        },
      });
      resetForm();
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d’enregistrer.");
    } finally {
      setSaving(false);
    }
  }

  async function moveSibling(dir: -1 | 1) {
    if (!active || activeIndex < 0) return;
    const next = [...siblings];
    const target = activeIndex + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[activeIndex]!;
    next[activeIndex] = next[target]!;
    next[target] = tmp;
    await reorderCategories({
      data: { parentId: active.parent_id, ids: next.map((c) => c.id) },
    });
    await onChanged();
  }

  async function movePost(categoryId: number, index: number, dir: -1 | 1) {
    const list = [...(postsByCategory.get(categoryId) ?? [])];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index]!;
    list[index] = list[target]!;
    list[target] = tmp;
    await reorderPostsInCategory({
      data: { categoryId, postIds: list.map((x) => x.post.id) },
    });
    await onChanged();
  }

  async function handleDelete(id: number) {
    if (
      !confirm(
        "Supprimer cette catégorie et ses sous-catégories ? Les articles ne seront pas effacés.",
      )
    ) {
      return;
    }
    await deleteCategory({ data: id });
    if (activeId === id) setActiveId(categories.find((c) => c.id !== id)?.id ?? null);
    await onChanged();
  }

  function startChild(parent: Category) {
    setEditingId(null);
    setName("");
    setDescription("");
    setParentId(parent.id);
    setError(null);
  }

  return (
    <div className="space-y-8">
      <section className="glass-card space-y-5 rounded-2xl p-6 md:p-8">
        <h2 className="font-serif text-xl text-white">
          {editingId ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </h2>
        <Field label="Nom">
          <TextInput value={name} onChange={setName} required />
        </Field>
        <Field label="Description (affichée sur l’accueil)">
          <TextArea value={description} onChange={setDescription} rows={2} />
        </Field>
        <Field
          label="Catégorie parente"
          hint="Jusqu’à trois niveaux : Comptabilité → Ventes → Détail."
        >
          <select
            value={parentId ?? ""}
            onChange={(e) =>
              setParentId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-white outline-none transition focus:border-gold-500/40"
          >
            <option value="">Catégorie principale (accueil)</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {pathLabel(c.id, categories)}
              </option>
            ))}
          </select>
        </Field>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <GoldButton onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter"}
          </GoldButton>
          {editingId || parentId ? (
            <GhostButton onClick={resetForm}>Annuler</GhostButton>
          ) : null}
        </div>
      </section>

      {categories.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune catégorie pour le moment.</p>
      ) : (
        <section className="glass-card rounded-2xl p-5 md:p-6">
          <p className="mb-4 text-xs uppercase tracking-wider text-slate-500">
            Catégories d’accueil — clic pour ouvrir le niveau
          </p>
          <div className="flex flex-wrap gap-2">
            {top.map((cat) => {
              const on = active ? pathOf(active.id, categories)[0]?.id === cat.id : false;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveId(cat.id)}
                  aria-pressed={on}
                  className={cn(
                    "min-h-11 rounded-full border px-4 py-2 text-sm transition",
                    on
                      ? "border-gold-500/40 bg-gold-500/10 text-white"
                      : "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {active ? (
            <div className="mt-6 border-t border-white/5 pt-5">
              <div className="mb-4 text-xs text-slate-500">
                {pathLabel(active.id, categories)}
                {activeDepth > 1 ? ` · niveau ${activeDepth}` : ""}
              </div>

              {flat.some((x) => {
                const rootId = pathLabel(x.node.id, categories).split(" · ")[0];
                const activeRoot = pathLabel(active.id, categories).split(" · ")[0];
                return rootId === activeRoot;
              }) ? (
                <div className="mb-5 space-y-1">
                  {flat
                    .filter((x) => {
                      const rootName = pathLabel(x.node.id, categories).split(" · ")[0];
                      return rootName === pathLabel(active.id, categories).split(" · ")[0];
                    })
                    .map(({ node, depth }) => {
                      const selected = node.id === active.id;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setActiveId(node.id)}
                          className={cn(
                            "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm transition",
                            selected
                              ? "bg-gold-500/10 text-white"
                              : "text-slate-300 hover:bg-white/5 hover:text-white",
                          )}
                          style={{ paddingLeft: 8 + (depth - 1) * 18 }}
                        >
                          {node.name}
                          {node.children.length > 0 ? (
                            <span className="ml-2 text-[11px] text-slate-500">
                              {node.children.length}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                </div>
              ) : null}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg text-white">{active.name}</div>
                  {active.description ? (
                    <p className="mt-1 text-sm text-slate-400">{active.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {active.parent_id == null ? (
                    <>
                      <IconBtn
                        label="Déplacer à gauche"
                        disabled={activeIndex <= 0}
                        onClick={() => void moveSibling(-1)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Déplacer à droite"
                        disabled={activeIndex < 0 || activeIndex >= siblings.length - 1}
                        onClick={() => void moveSibling(1)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </IconBtn>
                    </>
                  ) : (
                    <>
                      <IconBtn
                        label="Monter"
                        disabled={activeIndex <= 0}
                        onClick={() => void moveSibling(-1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Descendre"
                        disabled={activeIndex < 0 || activeIndex >= siblings.length - 1}
                        onClick={() => void moveSibling(1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                    </>
                  )}
                  {canAddChild ? (
                    <IconBtn
                      label="Ajouter une sous-catégorie"
                      onClick={() => startChild(active)}
                    >
                      <Plus className="h-4 w-4" />
                    </IconBtn>
                  ) : null}
                  <IconBtn
                    label="Modifier"
                    onClick={() => {
                      setEditingId(active.id);
                      setName(active.name);
                      setDescription(active.description);
                      setParentId(active.parent_id);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Supprimer"
                    danger
                    onClick={() => void handleDelete(active.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>

              {children.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                    Sous-catégories ({children.length})
                  </div>
                  <ul className="space-y-2">
                    {children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => setActiveId(child.id)}
                          className="flex min-h-11 w-full items-center justify-between rounded-xl bg-navy-900/70 px-3 py-2.5 text-left text-sm text-white hover:bg-navy-800"
                        >
                          <span>{child.name}</span>
                          <span className="text-xs text-slate-500">Ouvrir</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : canAddChild ? (
                <p className="mt-5 text-sm text-slate-500">
                  Aucune sous-catégorie. Utilisez + pour en ajouter une sous « {active.name} ».
                </p>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  Niveau maximum atteint (3). Vous pouvez encore y rattacher des articles.
                </p>
              )}

              <div className="mt-5">
                <div className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                  Ordre des articles à ce niveau ({assigned.length})
                </div>
                {assigned.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun article rattaché à ce niveau. Assignez-en un depuis l’éditeur.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {assigned.map((item, i) => (
                      <li
                        key={item.post.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-navy-900/70 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white">
                            {item.post.title}
                          </div>
                          <div className="text-xs text-slate-500">Position {i + 1}</div>
                        </div>
                        <div className="flex gap-1">
                          <IconBtn
                            label="Monter"
                            disabled={i === 0}
                            onClick={() => void movePost(active.id, i, -1)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn
                            label="Descendre"
                            disabled={i === assigned.length - 1}
                            onClick={() => void movePost(active.id, i, 1)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? "inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 disabled:opacity-30"
          : "inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-30"
      }
    >
      {children}
    </button>
  );
}
