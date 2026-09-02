import { Link } from "@tanstack/react-router";
import { formatDate, sanitizeHtml } from "@/lib/utils";
import type { PublicPost, SiteSettings } from "@/lib/cms/types";

export function ArticleView({
  post,
  site,
  backHref = "/blog",
  backLabel,
  preview = false,
}: {
  post: PublicPost;
  site: SiteSettings;
  backHref?: string;
  backLabel?: string;
  preview?: boolean;
}) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-14 sm:px-6 sm:py-16">
      {preview ? (
        <div className="mb-6 rounded-full border border-gold-500/25 bg-gold-500/10 px-4 py-1.5 text-center text-xs tracking-wide text-gold-400">
          Aperçu — cet article n’est pas forcément visible sur le site public
        </div>
      ) : null}

      <Link
        to={backHref}
        className="text-sm text-slate-500 transition hover:text-gold-400"
      >
        ← {backLabel || `Retour · ${site.nav_blog_label}`}
      </Link>

      <header className="mt-8">
        {post.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {post.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-gold-500/20 bg-gold-500/10 px-3 py-1 text-[11px] uppercase tracking-wider text-gold-400"
              >
                {c.name}
              </span>
            ))}
          </div>
        ) : null}

        {(post.show_published_date && post.published_at) ||
        (post.show_updated_date && post.updated_at) ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            {post.show_published_date && post.published_at ? (
              <time>Publié le {formatDate(post.published_at)}</time>
            ) : null}
            {post.show_updated_date && post.updated_at ? (
              <time>Modifié le {formatDate(post.updated_at)}</time>
            ) : null}
          </div>
        ) : null}

        <h1 className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-5 text-lg leading-relaxed text-slate-400">
            {post.excerpt}
          </p>
        ) : null}
      </header>

      {post.cover_image ? (
        <div className="mt-10 overflow-hidden rounded-2xl">
          <img src={post.cover_image} alt="" className="w-full object-cover" />
        </div>
      ) : null}

      <div
        className="prose-custom mt-12"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || "") }}
      />

      <div className="mt-16 border-t border-white/5 pt-8 text-xs text-slate-600">
        {site.disclaimer}
      </div>
    </article>
  );
}
