-- Per-device "stay logged in" window for the admin session (15 days).
-- Keyed by Better Auth session token so a later login without the option
-- does not inherit a previous remember-me window.

create table if not exists session_remember (
  session_token text primary key,
  user_id text not null,
  remember_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists session_remember_user_idx
  on session_remember (user_id);
