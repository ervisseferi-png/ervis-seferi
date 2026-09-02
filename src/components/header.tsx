import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SocialLinks } from "./social-links";
import type { SiteSettings } from "@/lib/cms/types";

export function Header({ site }: { site: SiteSettings }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const nav: { href: "/" | "/blog" | "/contact"; label: string }[] = [
    { href: "/", label: site.nav_home_label },
    { href: "/blog", label: site.nav_blog_label },
    { href: "/contact", label: site.nav_contact_label },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3 group">
          <BrandMark site={site} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium tracking-wide text-white">
              {site.brand_name.toUpperCase()}
            </div>
            <div className="truncate text-xs text-slate-400">{site.brand_subtitle}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <SocialLinks
            linkedin={site.linkedin_url}
            x={site.x_url}
            size="sm"
            className="ml-2"
          />
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/5 bg-navy-950/95 px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-base text-slate-200 hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <SocialLinks
            linkedin={site.linkedin_url}
            x={site.x_url}
            className="mt-4"
          />
        </div>
      ) : null}
    </header>
  );
}

function BrandMark({ site }: { site: SiteSettings }) {
  if (site.avatar_image) {
    return (
      <img
        src={site.avatar_image}
        alt={site.brand_name}
        className="h-10 w-10 shrink-0 rounded-full border border-gold-500/40 object-cover transition group-hover:border-gold-500/70"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold-500/30 bg-navy-800 font-serif text-lg font-medium text-gold-400 transition group-hover:border-gold-500/60">
      {site.initials.slice(0, 3)}
    </div>
  );
}
