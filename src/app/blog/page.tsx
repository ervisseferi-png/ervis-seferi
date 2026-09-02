import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description:
    "Articles concrets sur la comptabilité, la trésorerie, l'analyse financière et l'IA appliquée à la Finance.",
};

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
};

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, cover_image, published_at, created_at"
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  const list = (articles as Article[] | null) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <h1 className="font-serif text-4xl text-white md:text-5xl">
          Articles & connaissances
        </h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          Une sélection d&apos;articles concrets pour mieux piloter
          comptabilité, trésorerie, analyse financière et transformation
          numérique.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-white/10 bg-navy-800/30 p-12 text-center">
          <p className="text-slate-400">
            Aucun article publié pour le moment.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Les premiers contenus arriveront bientôt.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group glass-card overflow-hidden rounded-2xl transition hover:border-gold-500/25"
            >
              {article.cover_image ? (
                <div className="aspect-[16/10] overflow-hidden bg-navy-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-navy-700 to-navy-900" />
              )}
              <div className="p-6">
                <time className="text-xs text-slate-500">
                  {formatDate(article.published_at || article.created_at)}
                </time>
                <h2 className="mt-2 font-serif text-xl text-white group-hover:text-gold-400 transition">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="mt-3 line-clamp-3 text-sm text-slate-400 leading-relaxed">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
