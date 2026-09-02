import { createFileRoute } from "@tanstack/react-router";
import { getHomeData } from "@/lib/cms/queries";
import { CategoryShowcase } from "@/components/category-showcase";
import { DEFAULT_SITE, defaultCategoryShowcase } from "@/lib/cms/types";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    try {
      return await getHomeData();
    } catch {
      return {
        site: DEFAULT_SITE,
        categories: defaultCategoryShowcase(),
        articleCount: 0,
      };
    }
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
  const { site, categories } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl text-white md:text-5xl">{site.blog_title}</h1>
        <p className="mt-4 leading-relaxed text-slate-400">{site.blog_intro}</p>
      </div>

      <CategoryShowcase categories={categories} />
    </div>
  );
}
