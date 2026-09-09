# Ervis Seferi

Site personnel — comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance.

## Administration

L’espace `/login` est réservé au compte Supabase existant (email + mot de passe + TOTP).

- Pas d’inscription publique, pas de connexion Google/X.
- Cochez « Rester connecté 15 jours » pour ne pas ressaisir le mot de passe à chaque visite sur le même appareil.

## Données

Le CMS (accueil, contacts, navigation, disclaimer, catégories jusqu’à 3 niveaux, articles, photo de profil) est enregistré dans le projet Supabase existant :

- table `articles` (lignes `cms-state` / `cms-public`)
- bucket Storage `images` (`cms/state.json`, `cms/public.json`)

Les variables déjà présentes sur Vercel suffisent :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mzmfncofzwomtbbnkipt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon du projet |

## Stack

TanStack Start, React 19, Tailwind v4, Supabase Auth (email + TOTP).

## Sitemap et Google

`https://ervis.seferi.pro/sitemap.xml` est généré à chaque requête depuis le
document public du CMS. Il inclut `/`, `/blog`, `/contact` et les articles
visibles selon les mêmes règles que le blog. Les brouillons, publications
futures, pages d’administration et filtres de catégories sont exclus.
Les dates `lastmod` des articles proviennent des dates enregistrées, jamais
de la date de consultation du sitemap. Aucun nouveau secret n’est nécessaire.

Le sitemap suit les données publiques existantes : en mode Supabase, une
publication programmée doit d’abord apparaître dans le snapshot public du CMS.
Cette modification ne crée pas de tâche de publication automatique.

Après déploiement, vérifier que `/sitemap.xml` renvoie du XML avec un statut 200
et que `/robots.txt` contient son adresse. Dans Google Search Console, choisir
la propriété `ervis.seferi.pro`, puis **Sitemaps** et envoyer `sitemap.xml`.
Le sitemap facilite la découverte des pages sans garantir leur indexation.

Test ciblé : `node --test scripts/sitemap.test.mjs`.
