import type { Category } from "./types";

export const MAX_CATEGORY_DEPTH = 3;

export function normalizeParentId(value: number | null | undefined) {
  return value == null || Number.isNaN(Number(value)) ? null : Number(value);
}

export function byIdMap<T extends Category>(cats: T[]) {
  return new Map(cats.map((c) => [c.id, c]));
}

export function depthOf(id: number | null | undefined, cats: Category[]): number {
  if (!id) return 0;
  const byId = byIdMap(cats);
  let depth = 0;
  let cur: number | null = id;
  const seen = new Set<number>();
  while (cur) {
    if (seen.has(cur)) break;
    seen.add(cur);
    depth += 1;
    cur = byId.get(cur)?.parent_id ?? null;
  }
  return depth;
}

export function descendantIds(id: number, cats: Category[]): Set<number> {
  const set = new Set<number>();
  const walk = (pid: number) => {
    for (const c of cats) {
      if (c.parent_id === pid && !set.has(c.id)) {
        set.add(c.id);
        walk(c.id);
      }
    }
  };
  walk(id);
  return set;
}

export function subtreeHeight(id: number, cats: Category[]): number {
  const kids = cats.filter((c) => c.parent_id === id);
  if (kids.length === 0) return 1;
  return 1 + Math.max(...kids.map((k) => subtreeHeight(k.id, cats)));
}

export function pathOf(id: number, cats: Category[]): Category[] {
  const byId = byIdMap(cats);
  const path: Category[] = [];
  let cur: number | null = id;
  const seen = new Set<number>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const cat = byId.get(cur);
    if (!cat) break;
    path.unshift(cat);
    cur = cat.parent_id;
  }
  return path;
}

export function pathLabel(id: number, cats: Category[], sep = " · ") {
  return pathOf(id, cats)
    .map((c) => c.name)
    .join(sep);
}

export function childrenOf<T extends Category>(cats: T[], parentId: number | null): T[] {
  return cats
    .filter((c) => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export function roots<T extends Category>(cats: T[]): T[] {
  return childrenOf(cats, null);
}

export type TreeNode<T extends Category> = T & { children: TreeNode<T>[] };

export function toTree<T extends Category>(cats: T[]): TreeNode<T>[] {
  const map = new Map<number, TreeNode<T>>();
  for (const c of cats) map.set(c.id, { ...c, children: [] });
  const rootNodes: TreeNode<T>[] = [];
  for (const c of cats) {
    const node = map.get(c.id)!;
    const pid = c.parent_id ?? null;
    if (pid && map.has(pid)) map.get(pid)!.children.push(node);
    else rootNodes.push(node);
  }
  const sortNodes = (nodes: TreeNode<T>[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(rootNodes);
  return rootNodes;
}

export function flattenTree<T extends Category>(
  nodes: TreeNode<T>[],
  depth = 1,
): { node: TreeNode<T>; depth: number }[] {
  const out: { node: TreeNode<T>; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    out.push(...flattenTree(n.children, depth + 1));
  }
  return out;
}

export function canNestUnder(parentId: number | null, cats: Category[], movingId?: number) {
  const parentDepth = depthOf(parentId, cats);
  const extra = movingId ? subtreeHeight(movingId, cats) : 1;
  return parentDepth + extra <= MAX_CATEGORY_DEPTH;
}
