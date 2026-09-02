import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArticleView } from "@/components/article-view";
import { getLivePost, getPublicSite } from "@/lib/cms/queries";
import { DEFAULT_SITE } from "@/lib/cms/types";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [post, { site }] = await Promise.all([
      getLivePost({ data: params.slug }),
      getPublicSite().catch(() => ({ site: DEFAULT_SITE, categories: [] })),
    ]);
    if (!post) throw notFound();
    return { post, site };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-serif text-3xl text-white">Article introuvable</h1>
      <p className="mt-3 text-slate-400">Ce contenu n’est pas disponible.</p>
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.post.seo_title || loaderData?.post.title || "Article"} | Ervis Seferi`,
      },
      {
        name: "description",
        content:
          loaderData?.post.seo_description || loaderData?.post.excerpt || "",
      },
    ],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  const { post, site } = Route.useLoaderData();
  return <ArticleView post={post} site={site} />;
}
