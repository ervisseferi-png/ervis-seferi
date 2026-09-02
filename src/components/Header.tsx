"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Accueil" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contacts" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/30 bg-navy-800 text-gold-400 font-serif text-lg font-medium transition group-hover:border-gold-500/60">
            ES
          </div>
          <div className="leading-tight">
            <div className="text-sm font-medium tracking-wide text-white">
              ERVIS SEFERI
            </div>
            <div className="text-xs text-slate-400">
              Finance · Business · Technologie
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                  item.href === "/admin" &&
                    "ml-2 border border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
