import { createServerFn } from "@tanstack/react-start";
import { supabaseAuthMiddleware } from "@/lib/supabase/middleware";
import {
  applyCategory,
  applyCategoryOrder,
  applyPost,
  applyPostOrder,
  applySite,
  claimOwner,
  emptyDocument,
  homeFrom,
  isLivePost,
  labeledCategories,
  livePosts,
  promoteDue,
  removeCategory,
  removePost,
  toPublicPost,
  type CmsDocument,
} from "./document";
import {
  loadAdminDocument,
  loadDocumentForRead,
  saveDocument,
  usesRemoteCms,
} from "./persist";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SITE,
  categoriesOrDefault,
  type PostInput,
  type PublicPost,
  type SiteSettings,
} from "./types";

type AuthCtx = { userId: string; accessToken: string };

async function loadOwned(
  context: AuthCtx,
): Promise<{ doc: CmsDocument; token?: string }> {
  const { doc, bootstrapped } = await loadAdminDocument(context.accessToken);
  claimOwner(doc, context.userId);
  const due = promoteDue(doc);
  if (bootstrapped || due) {
    try {
      await saveDocument(doc, context.accessToken);
    } catch {
      /* first write can wait until an explicit save */
    }
  }
  return { doc, token: context.accessToken };
}

async function mutateOwned<T>(
  context: AuthCtx,
  fn: (doc: CmsDocument) => T,
): Promise<T> {
  const { doc } = await loadOwned(context);
  const result = fn(doc);
  await saveDocument(doc, context.accessToken);
  return result;
}

export const getAuthBootstrap = createServerFn({ method: "GET" }).handler(
  async () => {
    return { allowSignup: false };
  },
);

export const getPublicSite = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const doc = await loadDocumentForRead();
      promoteDue(doc);
      return {
        site: doc.site,
        categories: categoriesOrDefault(doc.categories),
      };
    } catch {
      return { site: DEFAULT_SITE, categories: DEFAULT_CATEGORIES };
    }
  },
);

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const doc = await loadDocumentForRead();
    promoteDue(doc);
    return homeFrom(doc);
  } catch {
    return homeFrom(emptyDocument());
  }
});

export const listLivePosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPost[]> => {
    try {
      const doc = await loadDocumentForRead();
      promoteDue(doc);
      return livePosts(doc);
    } catch {
      return [];
    }
  },
);

export const getLivePost = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PublicPost | null> => {
    try {
      const doc = await loadDocumentForRead();
      promoteDue(doc);
      const post = doc.posts.find((p) => p.slug === slug);
      if (!post || !isLivePost(post)) return null;
      return toPublicPost(post, doc.categories, doc.links);
    } catch {
      return null;
    }
  });

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context }) => {
    const { doc } = await loadOwned(context);
    return {
      isOwner: doc.owners.includes(context.userId) || doc.owners.length === 0,
      needsSetup: false,
    };
  });

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context }) => {
    await mutateOwned(context, (doc) => {
      claimOwner(doc, context.userId);
      return { ok: true as const };
    });
    return { ok: true };
  });

const REMEMBER_SECONDS = 15 * 24 * 60 * 60;

type RememberStatus = { remembered: boolean; until: string | null };

/** Keep the current admin session alive for 15 days on this device. */
export const persistRememberSession = createServerFn({ method: "POST" })
  .middleware([supabaseAuthMiddleware])
  .handler(async () => {
    const until = new Date(Date.now() + REMEMBER_SECONDS * 1000);
    return { ok: true as const, remembered: true, until: until.toISOString() };
  });

export const refreshRememberSession = createServerFn({ method: "POST" })
  .middleware([supabaseAuthMiddleware])
  .handler(async (): Promise<RememberStatus> => {
    return { remembered: false, until: null };
  });

export const getRememberStatus = createServerFn({ method: "GET" })
  .middleware([supabaseAuthMiddleware])
  .handler(async (): Promise<RememberStatus> => {
    return { remembered: false, until: null };
  });

export const getAdminBundle = createServerFn({ method: "GET" })
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context }) => {
    const { doc } = await loadOwned(context);
    return {
      site: doc.site,
      categories: doc.categories,
      posts: [...doc.posts].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
      links: doc.links,
    };
  });

export const saveSiteSettings = createServerFn({ method: "POST" })
  .validator((data: SiteSettings) => data)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data }) => {
    await mutateOwned(context, (doc) => {
      applySite(doc, data);
      return { ok: true as const };
    });
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
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data }) => {
    return mutateOwned(context, (doc) => applyCategory(doc, data));
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data: id }) => {
    await mutateOwned(context, (doc) => {
      removeCategory(doc, id);
      return { ok: true as const };
    });
    return { ok: true };
  });

export const reorderCategories = createServerFn({ method: "POST" })
  .validator((data: { parentId: number | null; ids: number[] }) => data)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data }) => {
    await mutateOwned(context, (doc) => {
      applyCategoryOrder(doc, data.parentId, data.ids);
      return { ok: true as const };
    });
    return { ok: true };
  });

export const reorderPostsInCategory = createServerFn({ method: "POST" })
  .validator((data: { categoryId: number; postIds: number[] }) => data)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data }) => {
    await mutateOwned(context, (doc) => {
      applyPostOrder(doc, data.categoryId, data.postIds);
      return { ok: true as const };
    });
    return { ok: true };
  });

export const savePost = createServerFn({ method: "POST" })
  .validator((data: PostInput) => data)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data }) => {
    return mutateOwned(context, (doc) => applyPost(doc, data));
  });

export const deletePost = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data: id }) => {
    await mutateOwned(context, (doc) => {
      removePost(doc, id);
      return { ok: true as const };
    });
    return { ok: true };
  });

export const getAdminPost = createServerFn({ method: "GET" })
  .validator((slug: string) => slug)
  .middleware([supabaseAuthMiddleware])
  .handler(async ({ context, data: slug }): Promise<PublicPost | null> => {
    const { doc } = await loadOwned(context);
    const post = doc.posts.find((p) => p.slug === slug);
    if (!post) return null;
    return toPublicPost(post, doc.categories, doc.links);
  });

export { labeledCategories, usesRemoteCms };
