import { Link } from "@tanstack/react-router";
import { SocialLinks } from "./social-links";
import type { SiteSettings } from "@/lib/cms/types";

export function Footer({ site }: { site: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-serif text-xl text-white">{site.brand_name}</div>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              {site.footer_tagline}
            </p>
            <SocialLinks
              linkedin={site.linkedin_url}
              x={site.x_url}
              className="mt-5"
            />
          </div>

          <div className="flex gap-10 text-sm">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-slate-500">
                Navigation
              </div>
              <Link to="/" className="block text-slate-400 hover:text-gold-400">
                {site.nav_home_label}
              </Link>
              <Link to="/blog" className="block text-slate-400 hover:text-gold-400">
                {site.nav_blog_label}
              </Link>
              <Link
                to="/contact"
                className="block text-slate-400 hover:text-gold-400"
              >
                {site.nav_contact_label}
              </Link>
              <Link to="/admin" className="block text-slate-500 hover:text-gold-400">
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t border-white/5 pt-6 text-xs text-slate-500">
          <p>
            © {year} Ervis Seferi. Tous droits réservés.
          </p>
          <p className="max-w-2xl text-slate-600">{site.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
