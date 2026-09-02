import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title, excerpt, cover_image, seo_title, seo_description")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!data) return { title: "Article introuvable" };

  return {
    title: data.seo_title || data.title,
    description: data.seo_description || data.excerpt || undefined,
    openGraph: {
      title: data.seo_title || data.title,
      description: data.seo_description || data.excerpt || undefined,
      images: data.cover_image ? [data.cover_image] : [],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-slate-500 hover:text-gold-400 transition"
      >
        ← Retour au blog
      </Link>

      <header className="mt-8">
        <time className="text-sm text-slate-500">
          {formatDate(article.published_at || article.created_at)}
        </time>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-5 text-lg text-slate-400 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </header>

      {article.cover_image && (
        <div className="mt-10 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full object-cover"
          />
        </div>
      )}

      <div
        className="prose-custom mt-12"
        dangerouslySetInnerHTML={{ __html: article.content || "" }}
      />

      <div className="mt-16 border-t border-white/5 pt-8 text-xs text-slate-600">
        Certains contenus de cet article peuvent avoir été générés ou assistés
        par l&apos;IA à partir de sources et instructions fournies.
      </div>
    </article>
  );
}
