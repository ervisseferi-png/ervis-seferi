-- CMS for the Ervis Seferi personal site: settings, categories, posts.

create table if not exists site_settings (
  id integer primary key,
  brand_name text not null default 'Ervis Seferi',
  brand_subtitle text not null default 'Finance · Business · Technologie',
  initials text not null default 'ES',
  nav_home_label text not null default 'Accueil',
  nav_blog_label text not null default 'Je partage mes connaissances',
  nav_contact_label text not null default 'Contacts',
  hero_badge text not null default 'ERVIS SEFERI',
  hero_title text not null default 'Ervis Seferi',
  hero_tagline text not null default 'Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance. Un regard pratique pour les dirigeants, indépendants et petites structures qui veulent mieux piloter leurs chiffres.',
  hero_cta_primary text not null default 'Lire les articles',
  hero_cta_secondary text not null default 'Me contacter',
  expertise_title text not null default 'Expertise',
  expertise_body text not null default 'Comptabilité, trésorerie, analyse financière et IA appliquée : chaque sujet est traité avec une logique de terrain, loin du jargon inutile.',
  why_title text not null default 'Pourquoi ce site',
  why_body text not null default 'Donner un point d''entrée clair à une expertise terrain en finance et en technologie, avec un blog lisible en public et une interface d''administration pour publier rapidement.',
  footer_tagline text not null default 'Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance.',
  disclaimer text not null default 'Certains contenus de ce site peuvent avoir été générés ou assistés par l''IA à partir de mes sources et instructions. L''IA a également pu être utilisée dans plusieurs étapes de la production.',
  contact_title text not null default 'Contact',
  contact_intro text not null default 'Pour une prise de contact simple et directe, écrivez-moi. Je réponds personnellement.',
  contact_email text not null default 'ervis.seferi@protonmail.com',
  contact_domains text not null default 'Comptabilité · Trésorerie · Analyse financière · IA & Automatisation appliquée à la Finance',
  linkedin_url text not null default '',
  x_url text not null default '',
  blog_title text not null default 'Je partage mes connaissances',
  blog_intro text not null default 'Une sélection d''articles concrets pour mieux piloter comptabilité, trésorerie, analyse financière et transformation numérique.',
  updated_at timestamptz not null default now()
);

insert into site_settings (id, hero_title) values (1, 'Ervis' || chr(10) || 'Seferi')
on conflict (id) do nothing;

create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into categories (name, slug, description, sort_order)
select * from (values
  ('Comptabilité', 'comptabilite', 'Lecture claire des chiffres', 0),
  ('Trésorerie', 'tresorerie', 'Pilotage du cash au quotidien', 1),
  ('Analyse financière', 'analyse-financiere', 'Décisions basées sur les données', 2),
  ('IA & Automatisation', 'ia-automatisation', 'Gains de temps concrets', 3)
) as v(name, slug, description, sort_order)
where not exists (select 1 from categories);

create table if not exists posts (
  id serial primary key,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  status text not null default 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  show_published_date boolean not null default false,
  show_updated_date boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_slug_idx on posts (slug);
create index if not exists posts_status_idx on posts (status);

create table if not exists post_categories (
  post_id integer not null references posts(id) on delete cascade,
  category_id integer not null references categories(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (post_id, category_id)
);

create index if not exists post_categories_category_idx on post_categories (category_id, sort_order);

create table if not exists site_owners (
  user_id text primary key,
  created_at timestamptz not null default now()
);
