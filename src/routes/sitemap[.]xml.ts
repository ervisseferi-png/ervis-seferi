import { createFileRoute } from "@tanstack/react-router";
import { renderSitemap } from "@/lib/seo/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const [{ loadPublicDocument }, { isLivePost }] = await Promise.all([
            import("@/lib/cms/persist"),
            import("@/lib/cms/document"),
          ]);
          const doc = await loadPublicDocument();
          const now = Date.now();
          // Do not promoteDue here: it changes updated_at to the request time.
          const posts = doc.posts.filter((post) => isLivePost(post, now));
          return new Response(renderSitemap(posts, now), {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return new Response("Sitemap temporarily unavailable", {
            status: 503,
            headers: { "Cache-Control": "no-store", "Retry-After": "300" },
          });
        }
      },
    },
  },
});
