import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { canUseSql, getSql } from "@/lib/db";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import {
  cloneDocument,
  emptyDocument,
  parseDocument,
  publicSnapshot,
  type CmsDocument,
} from "./document";
import type { Category, Post, PostCategoryLink, SiteSettings } from "./types";

export const CMS_STATE_SLUG = "cms-state";
export const CMS_PUBLIC_SLUG = "cms-public";
const BUCKET = "images";
const STATE_PATH = "cms/state.json";
const PUBLIC_PATH = "cms/public.json";

export function usesRemoteCms(): boolean {
  return !canUseSql();
}

function anonClient(): SupabaseClient {
  const key = getSupabaseAnonKey();
  if (!key) {
    throw new Error(
      "Clé Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.",
    );
  }
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function authedClient(token: string): SupabaseClient {
  const key = getSupabaseAnonKey();
  if (!key) {
    throw new Error(
      "Clé Supabase manquante. Vérifiez NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.",
    );
  }
  return createClient(getSupabaseUrl(), key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    accessToken: async () => token,
  });
}

type SiteRow = SiteSettings;
type CategoryRow = Category;
type PostRow = Post;
type LinkRow = PostCategoryLink;

function nextId(ids: number[]): number {
  return ids.reduce((max, id) => Math.max(max, id), 0) + 1;
}

async function loadFromSql(): Promise<CmsDocument> {
  const sql = await getSql();
  const [sites, categories, posts, links, owners] = await Promise.all([
    sql.query<SiteRow>("select * from site_settings where id = 1"),
    sql.query<CategoryRow>(
      `select id, name, slug, description, sort_order, parent_id
       from categories order by sort_order asc, id asc`,
    ),
    sql.query<PostRow>(
      `select id, title, slug, excerpt, content, cover_image, seo_title, seo_description,
              status, published_at::text as published_at, scheduled_at::text as scheduled_at,
              show_published_date, show_updated_date,
              created_at::text as created_at, updated_at::text as updated_at
       from posts order by id asc`,
    ),
    sql.query<LinkRow>(
      "select post_id, category_id, sort_order from post_categories",
    ),
    sql.query<{ user_id: string }>("select user_id from site_owners"),
  ]);
  const base = emptyDocument();
  const doc: CmsDocument = {
    version: 1,
    site: sites[0]
      ? { ...base.site, ...sites[0], avatar_image: sites[0].avatar_image ?? "" }
      : base.site,
    categories: (categories.length ? categories : base.categories).map((c) => ({
      ...c,
      parent_id: c.parent_id ?? null,
    })),
    posts: posts.map((p) => ({
      ...p,
      excerpt: p.excerpt ?? "",
      content: p.content ?? "",
      cover_image: p.cover_image ?? "",
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      status:
        p.status === "published" || p.status === "scheduled" ? p.status : "draft",
      show_published_date: Boolean(p.show_published_date),
      show_updated_date: Boolean(p.show_updated_date),
    })),
    links,
    owners: owners.map((o) => o.user_id),
    nextCategoryId: nextId(
      (categories.length ? categories : base.categories).map((c) => c.id),
    ),
    nextPostId: nextId(posts.map((p) => p.id)),
  };
  return doc;
}

function depthOf(id: number, cats: Category[]): number {
  const byId = new Map(cats.map((c) => [c.id, c]));
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

async function saveToSql(doc: CmsDocument): Promise<void> {
  const sql = await getSql();
  const site = doc.site;
  await sql.query(
    `update site_settings set
      brand_name = $1, brand_subtitle = $2, initials = $3,
      nav_home_label = $4, nav_blog_label = $5, nav_contact_label = $6,
      hero_badge = $7, hero_title = $8, hero_tagline = $9,
      hero_cta_primary = $10, hero_cta_secondary = $11,
      expertise_title = $12, expertise_body = $13,
      why_title = $14, why_body = $15,
      footer_tagline = $16, disclaimer = $17,
      contact_title = $18, contact_intro = $19, contact_email = $20,
      contact_domains = $21, linkedin_url = $22, x_url = $23,
      blog_title = $24, blog_intro = $25, avatar_image = $26, updated_at = now()
    where id = 1`,
    [
      site.brand_name,
      site.brand_subtitle,
      site.initials,
      site.nav_home_label,
      site.nav_blog_label,
      site.nav_contact_label,
      site.hero_badge,
      site.hero_title,
      site.hero_tagline,
      site.hero_cta_primary,
      site.hero_cta_secondary,
      site.expertise_title,
      site.expertise_body,
      site.why_title,
      site.why_body,
      site.footer_tagline,
      site.disclaimer,
      site.contact_title,
      site.contact_intro,
      site.contact_email,
      site.contact_domains,
      site.linkedin_url,
      site.x_url,
      site.blog_title,
      site.blog_intro,
      site.avatar_image,
    ],
  );

  await sql.query("delete from post_categories");
  await sql.query("delete from posts");
  await sql.query("update categories set parent_id = null");
  await sql.query("delete from categories");
  await sql.query("delete from site_owners");

  const cats = [...doc.categories].sort(
    (a, b) => depthOf(a.id, doc.categories) - depthOf(b.id, doc.categories) || a.id - b.id,
  );
  for (const c of cats) {
    await sql.query(
      `insert into categories (id, name, slug, description, sort_order, parent_id)
       values ($1, $2, $3, $4, $5, $6)`,
      [c.id, c.name, c.slug, c.description, c.sort_order, c.parent_id],
    );
  }
  for (const p of doc.posts) {
    await sql.query(
      `insert into posts (
        id, title, slug, excerpt, content, cover_image, seo_title, seo_description,
        status, published_at, scheduled_at, show_published_date, show_updated_date,
        created_at, updated_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.cover_image,
        p.seo_title,
        p.seo_description,
        p.status,
        p.published_at,
        p.scheduled_at,
        p.show_published_date,
        p.show_updated_date,
        p.created_at,
        p.updated_at,
      ],
    );
  }
  for (const l of doc.links) {
    await sql.query(
      `insert into post_categories (post_id, category_id, sort_order)
       values ($1, $2, $3)`,
      [l.post_id, l.category_id, l.sort_order],
    );
  }
  for (const userId of doc.owners) {
    await sql.query("insert into site_owners (user_id) values ($1)", [userId]);
  }
  if (doc.categories.length) {
    await sql.query(
      `select setval(pg_get_serial_sequence('categories','id'),
        (select max(id) from categories), true)`,
    );
  }
  if (doc.posts.length) {
    await sql.query(
      `select setval(pg_get_serial_sequence('posts','id'),
        (select max(id) from posts), true)`,
    );
  }
}

type LegacyArticle = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  published: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromLegacyArticles(rows: LegacyArticle[]): CmsDocument {
  const doc = emptyDocument();
  let id = 1;
  for (const row of rows) {
    if (!row.slug || row.slug === CMS_STATE_SLUG || row.slug === CMS_PUBLIC_SLUG) continue;
    if (typeof row.content === "string" && row.content.trim().startsWith('{"version"')) continue;
    doc.posts.push({
      id,
      title: row.title || "Sans titre",
      slug: row.slug,
      excerpt: row.excerpt ?? "",
      content: row.content ?? "",
      cover_image: row.cover_image ?? "",
      seo_title: row.seo_title ?? "",
      seo_description: row.seo_description ?? "",
      status: row.published ? "published" : "draft",
      published_at: row.published_at,
      scheduled_at: null,
      show_published_date: false,
      show_updated_date: false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
    id += 1;
  }
  doc.nextPostId = id;
  return doc;
}

async function readArticleContent(
  client: SupabaseClient,
  slug: string,
): Promise<CmsDocument | null> {
  const { data, error } = await client
    .from("articles")
    .select("content")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data?.content) return null;
  return parseDocument(data.content);
}

async function readStorageDocument(
  client: SupabaseClient,
  path: string,
): Promise<CmsDocument | null> {
  const { data, error } = await client.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  try {
    const text = await data.text();
    return parseDocument(text);
  } catch {
    return null;
  }
}

async function upsertArticle(
  client: SupabaseClient,
  slug: string,
  title: string,
  content: string,
  published: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const { data: existing, error: readError } = await client
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (readError && /schema cache|does not exist|relation/i.test(readError.message)) {
    throw readError;
  }
  if (existing?.id) {
    const { error } = await client
      .from("articles")
      .update({
        title,
        content,
        published,
        published_at: published ? now : null,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await client.from("articles").insert({
    title,
    slug,
    excerpt: "",
    content,
    cover_image: null,
    seo_title: "",
    seo_description: "",
    published,
    published_at: published ? now : null,
  });
  if (error) throw error;
}

async function uploadJson(
  client: SupabaseClient,
  path: string,
  content: string,
): Promise<void> {
  const bytes = new TextEncoder().encode(content);
  const { error } = await client.storage.from(BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw error;
}

async function importLegacy(client: SupabaseClient): Promise<CmsDocument | null> {
  const { data, error } = await client
    .from("articles")
    .select(
      "title, slug, excerpt, content, cover_image, seo_title, seo_description, published, published_at, created_at, updated_at",
    );
  if (error || !data?.length) return null;
  const imported = fromLegacyArticles(data as LegacyArticle[]);
  return imported.posts.length ? imported : null;
}

export async function loadPublicDocument(): Promise<CmsDocument> {
  if (!usesRemoteCms()) {
    return loadFromSql();
  }
  const client = anonClient();
  const fromPublicArticle = await readArticleContent(client, CMS_PUBLIC_SLUG);
  if (fromPublicArticle) return fromPublicArticle;
  const fromStorage = await readStorageDocument(client, PUBLIC_PATH);
  if (fromStorage) return fromStorage;
  return emptyDocument();
}

export async function loadAdminDocument(
  token: string,
): Promise<{ doc: CmsDocument; bootstrapped: boolean }> {
  if (!usesRemoteCms()) {
    return { doc: await loadFromSql(), bootstrapped: false };
  }
  const client = authedClient(token);
  const fromState = await readArticleContent(client, CMS_STATE_SLUG);
  if (fromState) return { doc: fromState, bootstrapped: false };
  const fromStorage = await readStorageDocument(client, STATE_PATH);
  if (fromStorage) return { doc: fromStorage, bootstrapped: false };
  const legacy = await importLegacy(client);
  if (legacy) return { doc: legacy, bootstrapped: true };
  const published = await loadPublicDocument();
  const empty = emptyDocument();
  const hasCustom =
    published.posts.length > 0 ||
    published.categories.length !== empty.categories.length;
  return { doc: hasCustom ? published : empty, bootstrapped: true };
}

export async function saveDocument(doc: CmsDocument, token?: string): Promise<void> {
  if (!usesRemoteCms()) {
    await saveToSql(doc);
    return;
  }
  if (!token) {
    throw new Error("Session expirée. Reconnectez-vous pour enregistrer.");
  }
  const client = authedClient(token);
  const full = JSON.stringify(doc);
  const pub = JSON.stringify(publicSnapshot(cloneDocument(doc)));
  const errors: string[] = [];

  try {
    await upsertArticle(client, CMS_STATE_SLUG, "CMS State", full, false);
    await upsertArticle(client, CMS_PUBLIC_SLUG, "CMS Public", pub, true);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  try {
    await uploadJson(client, STATE_PATH, full);
    await uploadJson(client, PUBLIC_PATH, pub);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  if (errors.length >= 2) {
    throw new Error(
      "Impossible d’enregistrer le contenu sur Supabase. Vérifiez que le bucket « images » et la table « articles » autorisent l’utilisateur authentifié. " +
        errors[0],
    );
  }
}

export async function loadDocumentForRead(): Promise<CmsDocument> {
  try {
    return await loadPublicDocument();
  } catch {
    return emptyDocument();
  }
}
