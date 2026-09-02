import { createFileRoute } from "@tanstack/react-router";
import { getPublicSite, listLivePosts } from "@/lib/cms/queries";
import { PostCard } from "@/components/post-card";
import { DEFAULT_SITE } from "@/lib/cms/types";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const [{ site }, posts] = await Promise.all([
      getPublicSite().catch(() => ({ site: DEFAULT_SITE, categories: [] })),
      listLivePosts().catch(() => []),
    ]);
    return { site, posts };
  },
  component: BlogPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.site.blog_title || "Je partage mes connaissances"} | Ervis Seferi`,
      },
    ],
  }),
});

function BlogPage() {
  const { site, posts } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl text-white md:text-5xl">{site.blog_title}</h1>
        <p className="mt-4 leading-relaxed text-slate-400">{site.blog_intro}</p>
      </div>

      {posts.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-white/10 bg-navy-800/30 p-12 text-center">
          <p className="text-slate-400">Aucun article publié pour le moment.</p>
          <p className="mt-2 text-sm text-slate-500">
            Les premiers contenus arriveront bientôt.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
