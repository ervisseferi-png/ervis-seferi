import { Link } from "@tanstack/react-router";
import { formatDate } from "@/lib/utils";
import type { PublicPost } from "@/lib/cms/types";

export function PostCard({ post }: { post: PublicPost }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group glass-card overflow-hidden rounded-2xl transition hover:border-gold-500/25"
    >
      {post.cover_image ? (
        <div className="aspect-[16/10] overflow-hidden bg-navy-800">
          <img
            src={post.cover_image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gradient-to-br from-navy-700 to-navy-900" />
      )}
      <div className="p-6">
        {post.categories[0] ? (
          <div className="text-[11px] uppercase tracking-wider text-gold-400">
            {post.categories.map((c) => c.name).join(" · ")}
          </div>
        ) : null}
        {post.show_published_date && post.published_at ? (
          <time className="mt-1 block text-xs text-slate-500">
            {formatDate(post.published_at)}
          </time>
        ) : null}
        <h2 className="mt-2 font-serif text-xl text-white transition group-hover:text-gold-400">
          {post.title}
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
