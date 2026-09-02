import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { PostCard } from "@/components/post-card";
import type { CategoryWithPosts } from "@/lib/cms/types";
import { childrenOf, roots, toTree, type TreeNode } from "@/lib/cms/tree";
import { cn } from "@/lib/utils";

export function CategoryShowcase({
  categories,
}: {
  categories: CategoryWithPosts[];
}) {
  const top = useMemo(() => roots(categories), [categories]);
  const tree = useMemo(() => toTree(categories), [categories]);
  const [activeId, setActiveId] = useState<number | null>(top[0]?.id ?? null);
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set(top[0] ? [top[0].id] : []));

  useEffect(() => {
    if (activeId == null && top[0]) setActiveId(top[0].id);
  }, [activeId, top]);

  useEffect(() => {
    if (activeId == null) return;
    setOpenIds((prev) => {
      if (prev.has(activeId)) return prev;
      const next = new Set(prev);
      next.add(activeId);
      return next;
    });
  }, [activeId]);

  const activeNode = tree.find((n) => n.id === activeId) ?? tree[0];

  if (top.length === 0) return null;

  function toggle(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mt-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {top.map((cat) => {
          const selected = cat.id === activeNode?.id;
          const subCount = childrenOf(categories, cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveId(cat.id)}
              aria-pressed={selected}
              className={cn(
                "min-h-11 rounded-2xl border px-5 py-5 text-left transition",
                selected
                  ? "border-gold-500/40 bg-gold-500/10"
                  : "border-white/5 bg-navy-800/40 hover:border-gold-500/20",
              )}
            >
              <div className="text-sm font-medium text-white">{cat.name}</div>
              {cat.description ? (
                <div className="mt-1 text-xs text-slate-400">{cat.description}</div>
              ) : null}
              {subCount > 0 ? (
                <div className="mt-2 text-[11px] tracking-wide text-gold-400/80">
                  {subCount} sous-rubrique{subCount > 1 ? "s" : ""}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeNode ? (
        <div className="mt-10">
          <CategoryBranch
            node={activeNode}
            depth={1}
            openIds={openIds}
            onToggle={toggle}
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryBranch({
  node,
  depth,
  openIds,
  onToggle,
}: {
  node: TreeNode<CategoryWithPosts>;
  depth: number;
  openIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const open = openIds.has(node.id);
  const nestedCount = node.children.length;
  const postCount = node.posts.length;

  return (
    <div className={depth > 1 ? "border-l border-white/10 pl-4 sm:pl-5" : ""}>
      <button
        type="button"
        onClick={() => onToggle(node.id)}
        aria-expanded={open}
        className={cn(
          "flex w-full min-h-11 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition sm:px-5",
          open
            ? "border-gold-500/25 bg-gold-500/5"
            : "border-white/5 bg-navy-800/40 hover:border-gold-500/20",
        )}
      >
        <div className="min-w-0">
          <div
            className={cn(
              "text-white",
              depth === 1 ? "font-serif text-2xl sm:text-3xl" : "text-base font-medium",
            )}
          >
            {node.name}
          </div>
          {node.description ? (
            <p className="mt-1 max-w-xl truncate text-xs text-slate-400 sm:text-sm">
              {node.description}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] tracking-wide text-slate-500">
            {postCount} article{postCount !== 1 ? "s" : ""}
            {nestedCount > 0
              ? ` · ${nestedCount} sous-rubrique${nestedCount > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-gold-400 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          {postCount === 0 && nestedCount === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-navy-800/40 px-5 py-5 text-sm text-slate-500">
              Les articles de cette rubrique apparaîtront ici, dans l’ordre que vous
              définissez.
            </div>
          ) : null}

          {postCount > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {node.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : null}

          {node.children.map((child) => (
            <CategoryBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              openIds={openIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
