import type { Post } from "../cms/types";

export const SITE_ORIGIN = "https://ervis.seferi.pro";

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[char]!;
  });
}

function lastModified(post: Post, now: number): string | undefined {
  const times = [post.updated_at, post.published_at, post.scheduled_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((time) => Number.isFinite(time) && time <= now);
  return times.length ? new Date(Math.max(...times)).toISOString() : undefined;
}

/** Receives only posts selected by the CMS's public visibility rules. */
export function renderSitemap(posts: Post[], now = Date.now()): string {
  const entries = new Map<string, string | undefined>([
    [`${SITE_ORIGIN}/`, undefined],
    [`${SITE_ORIGIN}/blog`, undefined],
    [`${SITE_ORIGIN}/contact`, undefined],
  ]);
  for (const post of posts) {
    // Empty and dot-segment slugs cannot resolve to an article route.
    if (!post.slug || post.slug === "." || post.slug === "..") continue;
    const url = `${SITE_ORIGIN}/blog/${encodeURIComponent(post.slug)}`;
    const modified = lastModified(post, now);
    const previous = entries.get(url);
    entries.set(url, previous && (!modified || previous > modified) ? previous : modified);
  }
  if (entries.size > 50_000) throw new Error("Sitemap requires splitting into multiple files");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
    ...entries,
  ]
    .map(
      ([url, modified]) =>
        `  <url><loc>${escapeXml(url)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}</url>`,
    )
    .join("\n")}\n</urlset>\n`;
  if (new TextEncoder().encode(xml).length > 50 * 1024 * 1024) {
    throw new Error("Sitemap exceeds the XML size limit");
  }
  return xml;
}
