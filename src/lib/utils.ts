import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/\son[a-z]+='[^']*'/gi, "")
    .replace(/\son[a-z]+=\S+/gi, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeStoredImage(raw: string, maxChars = 2_200_000) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (v.length > maxChars) return "";
  if (
    /^data:image\/(png|jpe?g|webp|gif)(;charset=[^;]+)?;base64,[a-z0-9+/=\s]+$/i.test(
      v,
    )
  ) {
    return v.replace(/\s+/g, "");
  }
  if (/^https:\/\/[^\s]+$/i.test(v) && v.length < 2000) {
    return v;
  }
  return "";
}
