import { createFileRoute, Link } from "@tanstack/react-router";
import { getHomeData, listLivePosts } from "@/lib/cms/queries";
import { PostPreviewCarousel } from "@/components/post-preview-carousel";
import { CategoryShowcase } from "@/components/category-showcase";
import { DEFAULT_SITE, defaultCategoryShowcase } from "@/lib/cms/types";
import { roots } from "@/lib/cms/tree";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const [home, posts] = await Promise.all([getHomeData(), listLivePosts()]);
      // Shuffle a copy once per load; keep the published content and its order intact.
      const previews = [...posts];
      for (let i = previews.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [previews[i], previews[j]] = [previews[j], previews[i]];
      }
      return { ...home, previews: previews.slice(0, 8) };
    } catch {
      return {
        site: DEFAULT_SITE,
        categories: defaultCategoryShowcase(),
        articleCount: 0,
        previews: [],
      };
    }
  },
  component: Home,
});

function Home() {
  const { site, categories, articleCount, previews } = Route.useLoaderData();
  const domainCount = roots(categories).length;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="glass-card rounded-3xl p-7 shadow-2xl md:p-10">
            <div className="inline-flex items-center rounded-full border border-gold-500/25 bg-gold-500/10 px-4 py-1.5 text-xs font-medium tracking-wider text-gold-400">
              {site.hero_badge}
            </div>

            <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-tight whitespace-pre-line text-white md:text-5xl lg:text-6xl">
              {site.hero_title}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
              {site.hero_tagline}
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                to="/blog"
                className="inline-flex min-h-11 items-center rounded-full bg-gold-500 px-7 py-3 text-sm font-medium text-navy-950 transition hover:bg-gold-400"
              >
                {site.hero_cta_primary}
              </Link>
              <Link
                to="/contact"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                {site.hero_cta_secondary}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="glass-card rounded-2xl p-7">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                {site.expertise_title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{site.expertise_body}</p>
              <div className="mt-6 flex gap-3">
                <div className="rounded-xl bg-navy-800/80 px-4 py-3 text-center">
                  <div className="text-lg font-medium text-white">{articleCount || "—"}</div>
                  <div className="text-[11px] text-slate-400">articles</div>
                </div>
                <div className="rounded-xl bg-navy-800/80 px-4 py-3 text-center">
                  <div className="text-lg font-medium text-gold-400">{domainCount}</div>
                  <div className="text-[11px] text-slate-400">domaines clés</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-7">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gold-400">
                {site.why_title}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{site.why_body}</p>
            </div>
          </div>
        </div>

        <PostPreviewCarousel posts={previews} />

        <CategoryShowcase categories={categories} />
      </section>
    </div>
  );
}
