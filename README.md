# Ervis Seferi

Site personnel — comptabilité, trésorerie, analyse financière, IA et automatisation appliquée à la Finance.

## Administration

L’espace `/login` est réservé à un seul administrateur (email + mot de passe).

- Sur une base vide, le premier visiteur de `/login` crée **le** compte administrateur. L’inscription se ferme ensuite.
- Les comptes Supabase Auth de l’ancien site ne sont **pas** importés : utilisez le même email et mot de passe pour créer le compte Better Auth, puis cliquez sur « Devenir administrateur ».
- Cochez « Rester connecté 15 jours » pour ne pas ressaisir le mot de passe à chaque visite sur le même appareil.

## Données

Le CMS (pages, catégories, articles, photo de profil) est stocké en Postgres.

Sur Vercel, définissez au minimum :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Postgres (Neon ou connexion Postgres de Supabase) |
| `BETTER_AUTH_SECRET` | Secret de session (chaîne aléatoire, 32+ caractères) |
| `BETTER_AUTH_URL` | URL publique du site, ex. `https://votre-domaine.vercel.app` |

Sans `DATABASE_URL`, le site démarre mais les contenus et sessions ne persistent pas.

## Stack

TanStack Start, React 19, Tailwind v4, Better Auth, Postgres.
