-- Email waitlist / signup capture
create table if not exists public.email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint email_signups_email_unique unique (email),
  constraint email_signups_email_not_blank check (length(trim(email)) > 0)
);

create index if not exists email_signups_created_at_idx
  on public.email_signups (created_at desc);

alter table public.email_signups enable row level security;

-- No public read/write policies: inserts go through the server with the service role key.
