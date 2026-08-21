create table if not exists public.meu_caminho_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  consent_version text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint meu_caminho_snapshot_object check (jsonb_typeof(snapshot) = 'object'),
  constraint meu_caminho_snapshot_size check (pg_column_size(snapshot) <= 1000000)
);

alter table public.meu_caminho_journeys enable row level security;
alter table public.meu_caminho_journeys force row level security;

revoke all on public.meu_caminho_journeys from anon;
grant select, insert, update, delete on public.meu_caminho_journeys to authenticated;

drop policy if exists "Usuários leem a própria jornada" on public.meu_caminho_journeys;
create policy "Usuários leem a própria jornada"
on public.meu_caminho_journeys
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Usuários criam a própria jornada" on public.meu_caminho_journeys;
create policy "Usuários criam a própria jornada"
on public.meu_caminho_journeys
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam a própria jornada" on public.meu_caminho_journeys;
create policy "Usuários atualizam a própria jornada"
on public.meu_caminho_journeys
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários excluem a própria jornada" on public.meu_caminho_journeys;
create policy "Usuários excluem a própria jornada"
on public.meu_caminho_journeys
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists meu_caminho_journeys_updated_at_idx
on public.meu_caminho_journeys(updated_at desc);
