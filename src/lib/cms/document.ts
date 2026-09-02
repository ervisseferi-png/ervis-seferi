import { sanitizeStoredImage, slugify } from "@/lib/utils";
import {
  canNestUnder,
  descendantIds,
  normalizeParentId,
  pathLabel,
} from "./tree";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SITE,
  categoriesOrDefault,
  type Category,
  type CategoryWithPosts,
  type HomeData,
  type Post,
  type PostCategoryLink,
  type PostInput,
  type PostStatus,
  type PublicPost,
  type SiteSettings,
} from "./types";

export const CMS_VERSION = 1 as const;

export type CmsDocument = {
  version: typeof CMS_VERSION;
  site: SiteSettings;
  categories: Category[];
  posts: Post[];
  links: PostCategoryLink[];
  owners: string[];
  nextCategoryId: number;
  nextPostId: number;
};

export function emptyDocument(): CmsDocument {
  const categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  return {
    version: CMS_VERSION,
    site: { ...DEFAULT_SITE },
    categories,
    posts: [],
    links: [],
    owners: [],
    nextCategoryId: Math.max(0, ...categories.map((c) => c.id)) + 1,
    nextPostId: 1,
  };
}

function asStatus(value: unknown): PostStatus {
  return value === "published" || value === "scheduled" ? value : "draft";
}

function asPost(row: Partial<Post> & { id: number; title: string; slug: string }): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    cover_image: row.cover_image ?? "",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    status: asStatus(row.status),
    published_at: row.published_at ?? null,
    scheduled_at: row.scheduled_at ?? null,
    show_published_date: Boolean(row.show_published_date),
    show_updated_date: Boolean(row.show_updated_date),
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export function parseDocument(raw: unknown): CmsDocument | null {
  if (!raw) return null;
  let data: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed.startsWith("{")) return null;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Partial<CmsDocument>;
  if (obj.version !== CMS_VERSION && obj.version !== undefined) {
    if (typeof obj.version !== "number") return null;
  }
  const base = emptyDocument();
  const categories = Array.isArray(obj.categories)
    ? obj.categories
        .filter((c): c is Category => !!c && typeof c === "object" && typeof c.id === "number")
        .map((c) => ({
          id: c.id,
          name: String(c.name ?? ""),
          slug: String(c.slug ?? ""),
          description: String(c.description ?? ""),
          sort_order: Number(c.sort_order ?? 0),
          parent_id: normalizeParentId(c.parent_id),
        }))
    : [];
  const posts = Array.isArray(obj.posts)
    ? obj.posts
        .filter((p): p is Post => !!p && typeof p === "object" && typeof p.id === "number")
        .map((p) => asPost(p))
    : [];
  const links = Array.isArray(obj.links)
    ? obj.links
        .filter(
          (l): l is PostCategoryLink =>
            !!l &&
            typeof l === "object" &&
            typeof l.post_id === "number" &&
            typeof l.category_id === "number",
        )
        .map((l) => ({
          post_id: l.post_id,
          category_id: l.category_id,
          sort_order: Number(l.sort_order ?? 0),
        }))
    : [];
  const owners = Array.isArray(obj.owners)
    ? obj.owners.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  const site = {
    ...DEFAULT_SITE,
    ...(obj.site && typeof obj.site === "object" ? obj.site : {}),
    avatar_image:
      obj.site && typeof obj.site === "object"
        ? String(obj.site.avatar_image ?? "")
        : "",
  };
  const nextCategoryId = Math.max(
    Number(obj.nextCategoryId) || 1,
    Math.max(0, ...categories.map((c) => c.id)) + 1,
  );
  const nextPostId = Math.max(
    Number(obj.nextPostId) || 1,
    Math.max(0, ...posts.map((p) => p.id)) + 1,
  );
  return {
    version: CMS_VERSION,
    site,
    categories: categories.length ? categories : base.categories,
    posts,
    links,
    owners,
    nextCategoryId,
    nextPostId,
  };
}

export function cloneDocument(doc: CmsDocument): CmsDocument {
  return structuredClone(doc);
}

export function isLivePost(post: Post, now = Date.now()): boolean {
  if (post.status === "published") return true;
  if (post.status === "scheduled" && post.scheduled_at) {
    const t = new Date(post.scheduled_at).getTime();
    return Number.isFinite(t) && t <= now;
  }
  return false;
}

export function promoteDue(doc: CmsDocument, now = new Date()): boolean {
  const t = now.getTime();
  const iso = now.toISOString();
  let changed = false;
  for (const post of doc.posts) {
    if (
      post.status === "scheduled" &&
      post.scheduled_at &&
      new Date(post.scheduled_at).getTime() <= t
    ) {
      post.status = "published";
      post.published_at = post.published_at || post.scheduled_at;
      post.updated_at = iso;
      changed = true;
    }
  }
  return changed;
}

export function publicSnapshot(doc: CmsDocument): CmsDocument {
  const copy = cloneDocument(doc);
  promoteDue(copy);
  const liveIds = new Set(copy.posts.filter((p) => isLivePost(p)).map((p) => p.id));
  copy.posts = copy.posts.filter((p) => liveIds.has(p.id));
  copy.links = copy.links.filter((l) => liveIds.has(l.post_id));
  return copy;
}

export function claimOwner(doc: CmsDocument, userId: string): void {
  if (doc.owners.length === 0) {
    doc.owners.push(userId);
    return;
  }
  if (!doc.owners.includes(userId)) {
    throw new Error("FORBIDDEN");
  }
}

export function labeledCategories(
  postId: number,
  categories: Category[],
  links: PostCategoryLink[],
): Category[] {
  return categories
    .filter((c) => links.some((l) => l.post_id === postId && l.category_id === c.id))
    .map((c) => ({ ...c, name: pathLabel(c.id, categories) }));
}

export function toPublicPost(
  post: Post,
  categories: Category[],
  links: PostCategoryLink[],
): PublicPost {
  return {
    ...post,
    categories: labeledCategories(post.id, categories, links),
  };
}

export function homeFrom(doc: CmsDocument): HomeData {
  const live = doc.posts.filter((p) => isLivePost(p));
  const byId = new Map(live.map((p) => [p.id, p]));
  const source = categoriesOrDefault(doc.categories);
  const cats: CategoryWithPosts[] = source.map((cat) => {
    const assigned = doc.links
      .filter((l) => l.category_id === cat.id && byId.has(l.post_id))
      .sort((a, b) => a.sort_order - b.sort_order || a.post_id - b.post_id)
      .map((l) => {
        const post = toPublicPost(byId.get(l.post_id)!, source, doc.links);
        return { ...post, content: "" };
      });
    return { ...cat, posts: assigned };
  });
  return { site: doc.site, categories: cats, articleCount: live.length };
}

export function applySite(doc: CmsDocument, data: SiteSettings): void {
  doc.site = {
    ...DEFAULT_SITE,
    ...data,
    brand_name: data.brand_name.trim() || "Ervis Seferi",
    initials: data.initials.trim() || "ES",
    nav_home_label: data.nav_home_label.trim() || "Accueil",
    nav_blog_label: data.nav_blog_label.trim() || "Je partage mes connaissances",
    nav_contact_label: data.nav_contact_label.trim() || "Contacts",
    contact_email: data.contact_email.trim(),
    linkedin_url: data.linkedin_url.trim(),
    x_url: data.x_url.trim(),
    avatar_image: sanitizeStoredImage(data.avatar_image),
    updated_at: new Date().toISOString(),
  };
}

export function applyCategory(
  doc: CmsDocument,
  data: {
    id?: number;
    name: string;
    description: string;
    slug?: string;
    parent_id?: number | null;
  },
): { id: number } {
  const name = data.name.trim();
  if (!name) throw new Error("Le nom de la catégorie est requis.");
  let slug = (data.slug?.trim() || slugify(name) || "categorie").slice(0, 80);
  const parentId = normalizeParentId(data.parent_id);

  if (data.id && parentId === data.id) {
    throw new Error("Une catégorie ne peut pas être sa propre parente.");
  }
  if (data.id && parentId && descendantIds(data.id, doc.categories).has(parentId)) {
    throw new Error(
      "Impossible de déplacer une catégorie sous l’une de ses sous-catégories.",
    );
  }
  if (!canNestUnder(parentId, doc.categories, data.id)) {
    throw new Error("Trois niveaux maximum (catégorie → sous-catégorie → détail).");
  }

  const clash = doc.categories.find((c) => c.slug === slug && c.id !== data.id);
  if (clash) slug = `${slug}-${Date.now().toString(36)}`.slice(0, 80);

  const siblingMax = (pid: number | null) =>
    Math.max(
      -1,
      ...doc.categories
        .filter((c) => (c.parent_id ?? null) === pid)
        .map((c) => c.sort_order),
    );

  if (data.id) {
    const prev = doc.categories.find((c) => c.id === data.id);
    if (!prev) throw new Error("Catégorie introuvable.");
    const moved = (prev.parent_id ?? null) !== parentId;
    prev.name = name;
    prev.slug = slug;
    prev.description = data.description.trim();
    prev.parent_id = parentId;
    if (moved) prev.sort_order = siblingMax(parentId) + 1;
    return { id: data.id };
  }

  const id = doc.nextCategoryId++;
  doc.categories.push({
    id,
    name,
    slug,
    description: data.description.trim(),
    sort_order: siblingMax(parentId) + 1,
    parent_id: parentId,
  });
  return { id };
}

export function removeCategory(doc: CmsDocument, id: number): void {
  const ids = new Set([...descendantIds(id, doc.categories), id]);
  doc.links = doc.links.filter((l) => !ids.has(l.category_id));
  doc.categories = doc.categories.filter((c) => !ids.has(c.id));
}

export function applyCategoryOrder(
  doc: CmsDocument,
  parentId: number | null,
  ids: number[],
): void {
  const pid = normalizeParentId(parentId);
  ids.forEach((id, index) => {
    const cat = doc.categories.find((c) => c.id === id);
    if (!cat) return;
    cat.sort_order = index;
    cat.parent_id = pid;
  });
}

export function applyPostOrder(
  doc: CmsDocument,
  categoryId: number,
  postIds: number[],
): void {
  postIds.forEach((postId, index) => {
    const link = doc.links.find(
      (l) => l.category_id === categoryId && l.post_id === postId,
    );
    if (link) link.sort_order = index;
  });
}

export function applyPost(doc: CmsDocument, data: PostInput): { id: number; slug: string } {
  const title = data.title.trim();
  if (!title) throw new Error("Le titre est requis.");
  let slug = (data.slug.trim() || slugify(title) || "article").slice(0, 120);
  const clash = doc.posts.find((p) => p.slug === slug && p.id !== data.id);
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const status: PostStatus =
    data.status === "published" || data.status === "scheduled"
      ? data.status
      : "draft";

  const now = new Date().toISOString();
  let publishedAt: string | null = null;
  if (status === "published") publishedAt = now;
  const scheduledAt =
    status === "scheduled" && data.scheduled_at
      ? new Date(data.scheduled_at).toISOString()
      : null;

  let id = data.id;
  if (id) {
    const prev = doc.posts.find((p) => p.id === id);
    if (!prev) throw new Error("Article introuvable.");
    if (status === "published") {
      publishedAt = prev.published_at || publishedAt;
    } else {
      publishedAt = prev.published_at ?? null;
    }
    prev.title = title;
    prev.slug = slug;
    prev.excerpt = data.excerpt;
    prev.content = data.content;
    prev.cover_image = data.cover_image;
    prev.seo_title = data.seo_title;
    prev.seo_description = data.seo_description;
    prev.status = status;
    prev.published_at = publishedAt;
    prev.scheduled_at = scheduledAt;
    prev.show_published_date = data.show_published_date;
    prev.show_updated_date = data.show_updated_date;
    prev.updated_at = now;
    doc.links = doc.links.filter((l) => l.post_id !== id);
  } else {
    id = doc.nextPostId++;
    doc.posts.push({
      id,
      title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      cover_image: data.cover_image,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      status,
      published_at: publishedAt,
      scheduled_at: scheduledAt,
      show_published_date: data.show_published_date,
      show_updated_date: data.show_updated_date,
      created_at: now,
      updated_at: now,
    });
  }

  for (const link of data.categories) {
    const existing = doc.links.find(
      (l) => l.post_id === id && l.category_id === link.category_id,
    );
    if (existing) existing.sort_order = link.sort_order;
    else {
      doc.links.push({
        post_id: id!,
        category_id: link.category_id,
        sort_order: link.sort_order,
      });
    }
  }

  return { id: id!, slug };
}

export function removePost(doc: CmsDocument, id: number): void {
  doc.posts = doc.posts.filter((p) => p.id !== id);
  doc.links = doc.links.filter((l) => l.post_id !== id);
}

export function livePosts(doc: CmsDocument): PublicPost[] {
  return doc.posts
    .filter((p) => isLivePost(p))
    .sort((a, b) => {
      const da = new Date(a.published_at || a.created_at).getTime();
      const db = new Date(b.published_at || b.created_at).getTime();
      return db - da;
    })
    .map((p) => toPublicPost(p, doc.categories, doc.links));
}
