import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.24 8.5h4.52V24H.24V8.5zM8.24 8.5h4.33v2.12h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.02 5.42 6.94V24h-4.52v-7.7c0-1.84-.03-4.2-2.56-4.2-2.56 0-2.95 2-2.95 4.06V24H8.24V8.5z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.24 2H21.5l-7.27 8.31L22.75 22h-6.56l-5.14-6.72L5.2 22H1.92l7.78-8.89L1.25 2h6.73l4.64 6.16L18.24 2zm-1.15 18h1.81L7 3.89H5.06L17.09 20z" />
    </svg>
  );
}

export function SocialLinks({
  linkedin,
  x,
  className,
  size = "md",
}: {
  linkedin?: string;
  x?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const items = [
    linkedin
      ? { href: linkedin, label: "LinkedIn", icon: <LinkedInIcon className={icon} /> }
      : null,
    x ? { href: x, label: "X (Twitter)", icon: <XIcon className={icon} /> } : null,
  ].filter(Boolean) as { href: string; label: string; icon: ReactNode }[];

  if (items.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className={cn(
            dim,
            "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold-400 transition hover:border-gold-500/40 hover:bg-white/10 hover:text-gold-400",
          )}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
