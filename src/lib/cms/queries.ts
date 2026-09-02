import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { slugify, sanitizeStoredImage } from "@/lib/utils";
import { canNestUnder, descendantIds, normalizeParentId, pathLabel } from "./tree";
import {
  DEFAULT_SITE,
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

type SiteRow = SiteSettings;
type CategoryRow = Category;
type PostRow = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  show_published_date: boolean;
  show_updated_date: boolean;
  created_at: string;
  updated_at: string;
};
type LinkRow = PostCategoryLink;

function asPost(row: PostRow): Post {
  const status: PostStatus =
    row.status === "published" || row.status === "scheduled"
      ? row.status
      : "draft";
  return {
    ...row,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    cover_image: row.cover_image ?? "",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    status,
    published_at: row.published_at,
    scheduled_at: row.scheduled_at,
    show_published_date: Boolean(row.show_published_date),
    show_updated_date: Boolean(row.show_updated_date),
  };
}

const POST_SELECT = `
  id, title, slug, excerpt, content, cover_image, seo_title, seo_description,
  status, published_at::text as published_at, scheduled_at::text as scheduled_at,
  show_published_date, show_updated_date,
  created_at::text as created_at, updated_at::text as updated_at
`;

async function promoteDueScheduled() {
  const sql = await getSql();
  await sql.query(
    `update posts
     set status = 'published',
         published_at = coalesce(published_at, scheduled_at, now()),
         updated_at = now()
     where status = 'scheduled' and scheduled_at is not null and scheduled_at <= now()`,
  );
}

async function loadSite(): Promise<SiteSettings> {
  const sql = await getSql();
  const rows = await sql.query<SiteRow>("select * from site_settings where id = 1");
  if (!rows[0]) return DEFAULT_SITE;
  return {
    ...DEFAULT_SITE,
    ...rows[0],
    avatar_image: rows[0].avatar_image ?? "",
  };
}

async function loadCategories(): Promise<Category[]> {
  const sql = await getSql();
  const rows = await sql.query<CategoryRow>(
    `select id, name, slug, description, sort_order, parent_id
     from categories
     order by sort_order asc, id asc`,
  );
  return rows.map((row) => ({
    ...row,
    parent_id: normalizeParentId(row.parent_id),
  }));
}

async function loadLinks(): Promise<LinkRow[]> {
  const sql = await getSql();
  return sql.query<LinkRow>(
    "select post_id, category_id, sort_order from post_categories",
  );
}

async function siblingMax(
  sql: Awaited<ReturnType<typeof getSql>>,
  parentId: number | null,
) {
  const max = await sql.query<{ m: number | null }>(
    parentId == null
      ? "select max(sort_order) as m from categories where parent_id is null"
      : "select max(sort_order) as m from categories where parent_id = $1",
    parentId == null ? [] : [parentId],
  );
  return max[0]?.m ?? -1;
}

function labeledCategories(
  postId: number,
  categories: Category[],
  links: LinkRow[],
): Category[] {
  return categories
    .filter((c) => links.some((l) => l.post_id === postId && l.category_id === c.id))
    .map((c) => ({ ...c, name: pathLabel(c.id, categories) }));
}

function liveSql() {
  return `(status = 'published' or (status = 'scheduled' and scheduled_at is not null and scheduled_at <= now()))`;
}

async function requireOwner(userId: string) {
  const sql = await getSql();
  const owners = await sql.query<{ user_id: string }>(
    "select user_id from site_owners",
  );
  if (owners.length === 0) {
    const err = new Error("SETUP_REQUIRED");
    throw err;
  }
  if (!owners.some((o) => o.user_id === userId)) {
    throw new Error("FORBIDDEN");
  }
}

export const getAuthBootstrap = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const sql = await getSql();
      const rows = await sql.query<{ n: number }>(
        'select count(*)::int as n from "user"',
      );
      return { allowSignup: (rows[0]?.n ?? 0) === 0 };
    } catch {
      return { allowSignup: false };
    }
  },
);

export const getPublicSite = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      await promoteDueScheduled();
      const [site, categories] = await Promise.all([loadSite(), loadCategories()]);
      return { site, categories };
    } catch {
      return { site: DEFAULT_SITE, categories: [] as Category[] };
    }
  },
);

export const getHomeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeData> => {
    try {
      await promoteDueScheduled();
      const sql = await getSql();
      const [site, categories, posts, links] = await Promise.all([
        loadSite(),
        loadCategories(),
        sql.query<PostRow>(
          `select ${POST_SELECT} from posts where ${liveSql()} order by coalesce(published_at, created_at) desc`,
        ),
        loadLinks(),
      ]);
      const live = posts.map(asPost);
      const byId = new Map(live.map((p) => [p.id, p]));
      const cats: CategoryWithPosts[] = categories.map((cat) => {
        const assigned = links
          .filter((l) => l.category_id === cat.id && byId.has(l.post_id))
          .sort((a, b) => a.sort_order - b.sort_order || a.post_id - b.post_id)
          .map((l) => {
            const post = byId.get(l.post_id)!;
            return {
              ...post,
              categories: labeledCategories(post.id, categories, links),
            };
          });
        return { ...cat, posts: assigned };
      });
      return { site, categories: cats, articleCount: live.length };
    } catch {
      return { site: DEFAULT_SITE, categories: [], articleCount: 0 };
    }
  },
);

export const listLivePosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPost[]> => {
    try {
      await promoteDueScheduled();
      const sql = await getSql();
      const [posts, categories, links] = await Promise.all([
        sql.query<PostRow>(
          `select ${POST_SELECT} from posts where ${liveSql()} order by coalesce(published_at, created_at) desc`,
        ),
        loadCategories(),
        loadLinks(),
      ]);
      return posts.map(asPost).map((post) => ({
        ...post,
        categories: labeledCategories(post.id, categories, links),
      }));
    } catch {
      return [];
    }
  },
);

export const getLivePost = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PublicPost | null> => {
    await promoteDueScheduled();
    const sql = await getSql();
    const rows = await sql.query<PostRow>(
      `select ${POST_SELECT} from posts where slug = $1 and ${liveSql()} limit 1`,
      [slug],
    );
    const row = rows[0];
    if (!row) return null;
    const [categories, links] = await Promise.all([loadCategories(), loadLinks()]);
    const post = asPost(row);
    return {
      ...post,
      categories: labeledCategories(post.id, categories, links),
    };
  });

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const owners = await sql.query<{ user_id: string }>(
      "select user_id from site_owners",
    );
    return {
      isOwner: owners.some((o) => o.user_id === context.userId),
      needsSetup: owners.length === 0,
    };
  });

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const owners = await sql.query<{ user_id: string }>(
      "select user_id from site_owners",
    );
    if (owners.length > 0) throw new Error("FORBIDDEN");
    await sql.query("insert into site_owners (user_id) values ($1)", [
      context.userId,
    ]);
    return { ok: true };
  });

const REMEMBER_SECONDS = 15 * 24 * 60 * 60;

type RememberStatus = { remembered: boolean; until: string | null };

async function sessionCookieParts(): Promise<{
  signed: string | null;
  token: string | null;
  setCookie: (value: string, maxAge: number) => void;
}> {
  const { getCookie, setCookie } = await import("@tanstack/react-start/server");
  const { SESSION_TOKEN_COOKIE } = await import("@/lib/auth/server");
  const signed = getCookie(SESSION_TOKEN_COOKIE) ?? null;
  let token: string | null = signed;
  if (signed) {
    const dot = signed.lastIndexOf(".");
    if (dot > 0) {
      const signature = signed.slice(dot + 1);
      if (signature.length === 44 && signature.endsWith("=")) {
        token = signed.slice(0, dot);
      }
    }
  }
  return {
    signed,
    token,
    setCookie: (value, maxAge) => {
      setCookie(SESSION_TOKEN_COOKIE, value, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge,
      });
    },
  };
}

async function loadRememberRow(
  sql: Awaited<ReturnType<typeof getSql>>,
  token: string | null,
): Promise<{ remember_until: string } | null> {
  if (!token) return null;
  const rows = await sql.query<{ remember_until: string }>(
    `select remember_until::text as remember_until
     from session_remember
     where session_token = $1 and remember_until > now()`,
    [token],
  );
  return rows[0] ?? null;
}

async function applyRememberWindow(
  userId: string,
  until: Date,
): Promise<RememberStatus & { ok: true }> {
  const sql = await getSql();
  const cookies = await sessionCookieParts();

  if (cookies.token) {
    await sql.query(
      `insert into session_remember (session_token, user_id, remember_until)
       values ($1, $2, $3)
       on conflict (session_token) do update
         set remember_until = excluded.remember_until,
             user_id = excluded.user_id`,
      [cookies.token, userId, until.toISOString()],
    );
    await sql.query(
      `update "session"
       set "expiresAt" = $2, "updatedAt" = now()
       where "token" = $1`,
      [cookies.token, until.toISOString()],
    );
  } else {
    await sql.query(
      `update "session"
       set "expiresAt" = $2, "updatedAt" = now()
       where "userId" = $1 and "expiresAt" > now()`,
      [userId, until.toISOString()],
    );
  }

  const remaining = Math.max(
    60,
    Math.floor((until.getTime() - Date.now()) / 1000),
  );
  if (cookies.signed) cookies.setCookie(cookies.signed, remaining);

  return { ok: true, remembered: true, until: until.toISOString() };
}

/** Keep the current admin session alive for 15 days on this device. */
export const persistRememberSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const until = new Date(Date.now() + REMEMBER_SECONDS * 1000);
    return applyRememberWindow(context.userId, until);
  });

export const refreshRememberSession = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const cookies = await sessionCookieParts();
    const row = await loadRememberRow(sql, cookies.token);
    if (!row) return { remembered: false, until: null };
    const until = new Date(row.remember_until);
    return applyRememberWindow(context.userId, until);
  });

export const getRememberStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const cookies = await sessionCookieParts();
    const row = await loadRememberRow(sql, cookies.token);
    return {
      remembered: Boolean(row),
      until: row?.remember_until ?? null,
    };
  });

export const getAdminBundle = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    await promoteDueScheduled();
    const sql = await getSql();
    const [site, categories, posts, links] = await Promise.all([
      loadSite(),
      loadCategories(),
      sql.query<PostRow>(
        `select ${POST_SELECT} from posts order by updated_at desc`,
      ),
      loadLinks(),
    ]);
    return {
      site,
      categories,
      posts: posts.map(asPost),
      links,
    };
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .validator((data: SiteSettings) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
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
        data.brand_name.trim() || "Ervis Seferi",
        data.brand_subtitle,
        data.initials.trim() || "ES",
        data.nav_home_label.trim() || "Accueil",
        data.nav_blog_label.trim() || "Je partage mes connaissances",
        data.nav_contact_label.trim() || "Contacts",
        data.hero_badge,
        data.hero_title,
        data.hero_tagline,
        data.hero_cta_primary,
        data.hero_cta_secondary,
        data.expertise_title,
        data.expertise_body,
        data.why_title,
        data.why_body,
        data.footer_tagline,
        data.disclaimer,
        data.contact_title,
        data.contact_intro,
        data.contact_email.trim(),
        data.contact_domains,
        data.linkedin_url.trim(),
        data.x_url.trim(),
        data.blog_title,
        data.blog_intro,
        sanitizeStoredImage(data.avatar_image),
      ],
    );
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id?: number;
      name: string;
      description: string;
      slug?: string;
      parent_id?: number | null;
    }) => data,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const name = data.name.trim();
    if (!name) throw new Error("Le nom de la catégorie est requis.");
    let slug = (data.slug?.trim() || slugify(name) || "categorie").slice(0, 80);
    const parentId = normalizeParentId(data.parent_id);
    const existing = await loadCategories();

    if (data.id && parentId === data.id) {
      throw new Error("Une catégorie ne peut pas être sa propre parente.");
    }
    if (data.id && parentId && descendantIds(data.id, existing).has(parentId)) {
      throw new Error("Impossible de déplacer une catégorie sous l’une de ses sous-catégories.");
    }
    if (!canNestUnder(parentId, existing, data.id)) {
      throw new Error("Trois niveaux maximum (catégorie → sous-catégorie → détail).");
    }

    const slugClash = await sql.query<{ id: number }>(
      "select id from categories where slug = $1",
      [slug],
    );
    if (slugClash[0] && slugClash[0].id !== data.id) {
      slug = `${slug}-${Date.now().toString(36)}`.slice(0, 80);
    }

    if (data.id) {
      const prev = existing.find((c) => c.id === data.id);
      if (prev && (prev.parent_id ?? null) !== parentId) {
        const max = await siblingMax(sql, parentId);
        await sql.query(
          "update categories set name = $1, slug = $2, description = $3, parent_id = $4, sort_order = $5 where id = $6",
          [name, slug, data.description.trim(), parentId, max + 1, data.id],
        );
      } else {
        await sql.query(
          "update categories set name = $1, slug = $2, description = $3, parent_id = $4 where id = $5",
          [name, slug, data.description.trim(), parentId, data.id],
        );
      }
      return { id: data.id };
    }
    const sort = (await siblingMax(sql, parentId)) + 1;
    const rows = await sql.query<{ id: number }>(
      "insert into categories (name, slug, description, sort_order, parent_id) values ($1, $2, $3, $4, $5) returning id",
      [name, slug, data.description.trim(), sort, parentId],
    );
    return { id: rows[0]!.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const existing = await loadCategories();
    const ids = [...descendantIds(id, existing), id];
    for (const cid of ids) {
      await sql.query("delete from post_categories where category_id = $1", [cid]);
    }
    for (const cid of ids) {
      await sql.query("delete from categories where id = $1", [cid]);
    }
    return { ok: true };
  });

export const reorderCategories = createServerFn({ method: "POST" })
  .validator((data: { parentId: number | null; ids: number[] }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const parentId = normalizeParentId(data.parentId);
    for (let i = 0; i < data.ids.length; i += 1) {
      await sql.query(
        "update categories set sort_order = $1, parent_id = $2 where id = $3",
        [i, parentId, data.ids[i]],
      );
    }
    return { ok: true };
  });

export const reorderPostsInCategory = createServerFn({ method: "POST" })
  .validator((data: { categoryId: number; postIds: number[] }) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    for (let i = 0; i < data.postIds.length; i += 1) {
      await sql.query(
        "update post_categories set sort_order = $1 where category_id = $2 and post_id = $3",
        [i, data.categoryId, data.postIds[i]],
      );
    }
    return { ok: true };
  });

export const savePost = createServerFn({ method: "POST" })
  .validator((data: PostInput) => data)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const title = data.title.trim();
    if (!title) throw new Error("Le titre est requis.");
    let slug = (data.slug.trim() || slugify(title) || "article").slice(0, 120);

    const existing = await sql.query<{ id: number }>(
      "select id from posts where slug = $1",
      [slug],
    );
    if (existing[0] && existing[0].id !== data.id) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const status: PostStatus =
      data.status === "published" || data.status === "scheduled"
        ? data.status
        : "draft";

    let publishedAt: string | null = null;
    if (status === "published") {
      publishedAt = new Date().toISOString();
    }

    const scheduledAt =
      status === "scheduled" && data.scheduled_at
        ? new Date(data.scheduled_at).toISOString()
        : null;

    let id = data.id;
    if (id) {
      const prev = await sql.query<{ published_at: string | null }>(
        "select published_at::text as published_at from posts where id = $1",
        [id],
      );
      if (status === "published") {
        publishedAt = prev[0]?.published_at || publishedAt;
      } else if (status === "scheduled") {
        publishedAt = prev[0]?.published_at ?? null;
      } else {
        publishedAt = prev[0]?.published_at ?? null;
      }
      await sql.query(
        `update posts set
          title = $1, slug = $2, excerpt = $3, content = $4, cover_image = $5,
          seo_title = $6, seo_description = $7, status = $8,
          published_at = $9, scheduled_at = $10,
          show_published_date = $11, show_updated_date = $12,
          updated_at = now()
        where id = $13`,
        [
          title,
          slug,
          data.excerpt,
          data.content,
          data.cover_image,
          data.seo_title,
          data.seo_description,
          status,
          publishedAt,
          scheduledAt,
          data.show_published_date,
          data.show_updated_date,
          id,
        ],
      );
      await sql.query("delete from post_categories where post_id = $1", [id]);
    } else {
      const rows = await sql.query<{ id: number }>(
        `insert into posts (
          title, slug, excerpt, content, cover_image, seo_title, seo_description,
          status, published_at, scheduled_at, show_published_date, show_updated_date
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
        [
          title,
          slug,
          data.excerpt,
          data.content,
          data.cover_image,
          data.seo_title,
          data.seo_description,
          status,
          publishedAt,
          scheduledAt,
          data.show_published_date,
          data.show_updated_date,
        ],
      );
      id = rows[0]!.id;
    }

    for (const link of data.categories) {
      await sql.query(
        "insert into post_categories (post_id, category_id, sort_order) values ($1, $2, $3) on conflict (post_id, category_id) do update set sort_order = excluded.sort_order",
        [id, link.category_id, link.sort_order],
      );
    }

    return { id, slug };
  });

export const deletePost = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    await requireOwner(context.userId);
    const sql = await getSql();
    await sql.query("delete from posts where id = $1", [id]);
    return { ok: true };
  });

export const getAdminPost = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .middleware([authMiddleware])
  .handler(async ({ context, data: slug }): Promise<PublicPost | null> => {
    await requireOwner(context.userId);
    const sql = await getSql();
    const rows = await sql.query<PostRow>(
      `select ${POST_SELECT} from posts where slug = $1 limit 1`,
      [slug],
    );
    const row = rows[0];
    if (!row) return null;
    const [categories, links] = await Promise.all([loadCategories(), loadLinks()]);
    const post = asPost(row);
    return {
      ...post,
      categories: labeledCategories(post.id, categories, links),
    };
  });
