# Ervis Seferi — Site personnel

Site de conseil en **Comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- Supabase (Auth + MFA TOTP + Database + Storage)
- Vercel (hébergement)

## Configuration Supabase (obligatoire)

### 1. Variables d'environnement

Créez un fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://mzmfncofzwomtbbnkipt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

### 2. Table `articles`

Dans Supabase → SQL Editor, exécutez :

```sql
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image text,
  seo_title text,
  seo_description text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_slug_idx on public.articles (slug);
create index if not exists articles_published_idx on public.articles (published);

alter table public.articles enable row level security;

create policy "Public can read published articles"
  on public.articles for select
  using (published = true);

create policy "Authenticated users full access"
  on public.articles for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

### 3. Storage bucket `images`

1. Supabase → Storage → New bucket
2. Nom : `images`
3. Public bucket : **Oui**
4. Policies SQL :

```sql
create policy "Public read images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Auth upload images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Auth update images"
  on storage.objects for update
  using (bucket_id = 'images' and auth.role() = 'authenticated');

create policy "Auth delete images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.role() = 'authenticated');
```

### 4. Authentification + MFA

1. Authentication → Providers → Email : activé
2. Authentication → Multi-Factor → TOTP : **Enable**
3. Créez un utilisateur (Authentication → Users → Add user) avec l'email que vous utiliserez pour l'admin
4. La première connexion à `/admin` vous demandera de scanner le QR code avec Google Authenticator / Authy

## Développement local

```bash
npm install
npm run dev
```

## Déploiement Vercel

1. Importez le repo GitHub `ervisseferi-png/ervis-seferi`
2. Ajoutez les variables :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mzmfncofzwomtbbnkipt.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (votre clé anon)
3. Deploy

## Fonctionnalités

- Design sombre élégant (navy + or)
- Blog / base de connaissances avec images de couverture
- Contenu HTML (liens, images dans le corps, titres…)
- SEO par article
- Admin sécurisé : mot de passe + TOTP (2FA)
- Note de transparence IA en bas de page et des articles
