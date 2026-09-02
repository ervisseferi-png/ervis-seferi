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
