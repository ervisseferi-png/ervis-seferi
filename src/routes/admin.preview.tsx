import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleView } from "@/components/article-view";
import { PREVIEW_KEY, type PreviewPayload } from "@/components/admin/article-editor";
import { getPublicSite } from "@/lib/cms/queries";
import { DEFAULT_SITE, type PublicPost, type SiteSettings } from "@/lib/cms/types";

export const Route = createFileRoute("/admin/preview")({
  component: PreviewPage,
});

function PreviewPage() {
  const [site, setSite] = useState<SiteSettings>(DEFAULT_SITE);
  const [post, setPost] = useState<PublicPost | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getPublicSite()
      .then((d) => setSite(d.site))
      .catch(() => undefined);
    try {
      const raw = sessionStorage.getItem(PREVIEW_KEY);
      if (raw) {
        const data = JSON.parse(raw) as PreviewPayload;
        setPost({
          id: 0,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          cover_image: data.cover_image,
          seo_title: "",
          seo_description: "",
          status: data.status,
          published_at: data.published_at,
          scheduled_at: null,
          show_published_date: data.show_published_date,
          show_updated_date: data.show_updated_date,
          created_at: data.updated_at,
          updated_at: data.updated_at,
          categories: data.categories,
        });
      }
    } catch {
      setPost(null);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        Chargement de l’aperçu…
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-slate-400">Aucun aperçu en cours.</p>
        <Link to="/admin" className="mt-4 inline-block text-gold-400">
          Retour à l’administration
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gold-500/20 bg-navy-950/90 px-5 py-3 text-center">
        <Link to="/admin" className="text-sm text-gold-400 hover:text-gold-500">
          ← Retour à l’éditeur
        </Link>
      </div>
      <ArticleView post={post} site={site} preview />
    </div>
  );
}
