export type PostStatus = "draft" | "published" | "scheduled";

export type SiteSettings = {
  id: number;
  brand_name: string;
  brand_subtitle: string;
  initials: string;
  avatar_image: string;
  nav_home_label: string;
  nav_blog_label: string;
  nav_contact_label: string;
  hero_badge: string;
  hero_title: string;
  hero_tagline: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  expertise_title: string;
  expertise_body: string;
  why_title: string;
  why_body: string;
  footer_tagline: string;
  disclaimer: string;
  contact_title: string;
  contact_intro: string;
  contact_email: string;
  contact_domains: string;
  linkedin_url: string;
  x_url: string;
  blog_title: string;
  blog_intro: string;
  updated_at: string | null;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  parent_id: number | null;
};

export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  status: PostStatus;
  published_at: string | null;
  scheduled_at: string | null;
  show_published_date: boolean;
  show_updated_date: boolean;
  created_at: string;
  updated_at: string;
};

export type PostCategoryLink = {
  post_id: number;
  category_id: number;
  sort_order: number;
};

export type PublicPost = Post & {
  categories: Category[];
};

export type CategoryWithPosts = Category & {
  posts: PublicPost[];
};

export type HomeData = {
  site: SiteSettings;
  categories: CategoryWithPosts[];
  articleCount: number;
};

export type PostInput = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  seo_title: string;
  seo_description: string;
  status: PostStatus;
  scheduled_at: string | null;
  show_published_date: boolean;
  show_updated_date: boolean;
  categories: { category_id: number; sort_order: number }[];
};

export const DEFAULT_SITE: SiteSettings = {
  id: 1,
  brand_name: "Ervis Seferi",
  brand_subtitle: "Finance · Business · Technologie",
  initials: "ES",
  avatar_image: "",
  nav_home_label: "Accueil",
  nav_blog_label: "Je partage mes connaissances",
  nav_contact_label: "Contacts",
  hero_badge: "ERVIS SEFERI",
  hero_title: "Ervis\nSeferi",
  hero_tagline:
    "Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance. Un regard pratique pour les dirigeants, indépendants et petites structures qui veulent mieux piloter leurs chiffres.",
  hero_cta_primary: "Lire les articles",
  hero_cta_secondary: "Me contacter",
  expertise_title: "Expertise",
  expertise_body:
    "Comptabilité, trésorerie, analyse financière et IA appliquée : chaque sujet est traité avec une logique de terrain, loin du jargon inutile.",
  why_title: "Pourquoi ce site",
  why_body:
    "Donner un point d'entrée clair à une expertise terrain en finance et en technologie, avec un blog lisible en public et une interface d'administration pour publier rapidement.",
  footer_tagline:
    "Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance.",
  disclaimer:
    "Certains contenus de ce site peuvent avoir été générés ou assistés par l'IA à partir de mes sources et instructions. L'IA a également pu être utilisée dans plusieurs étapes de la production.",
  contact_title: "Contact",
  contact_intro:
    "Pour une prise de contact simple et directe, écrivez-moi. Je réponds personnellement.",
  contact_email: "ervis.seferi@protonmail.com",
  contact_domains:
    "Comptabilité · Trésorerie · Analyse financière · IA & Automatisation appliquée à la Finance",
  linkedin_url: "",
  x_url: "",
  blog_title: "Je partage mes connaissances",
  blog_intro:
    "Une sélection d'articles concrets pour mieux piloter comptabilité, trésorerie, analyse financière et transformation numérique.",
  updated_at: null,
};
