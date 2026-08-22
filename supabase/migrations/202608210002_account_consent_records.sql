create table if not exists public.meu_caminho_consent_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('account_sync')),
  consent_version text not null,
  status text not null check (status in ('granted', 'revoked')),
  occurred_at timestamptz not null default timezone('utc', now())
);

alter table public.meu_caminho_consent_records enable row level security;
alter table public.meu_caminho_consent_records force row level security;

revoke all on public.meu_caminho_consent_records from anon, authenticated;
grant select on public.meu_caminho_consent_records to authenticated;
grant insert (user_id, purpose, consent_version, status)
on public.meu_caminho_consent_records to authenticated;
grant usage, select on sequence public.meu_caminho_consent_records_id_seq to authenticated;

drop policy if exists "Usuários leem os próprios consentimentos" on public.meu_caminho_consent_records;
create policy "Usuários leem os próprios consentimentos"
on public.meu_caminho_consent_records for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Usuários registram os próprios consentimentos" on public.meu_caminho_consent_records;
create policy "Usuários registram os próprios consentimentos"
on public.meu_caminho_consent_records for insert to authenticated
with check ((select auth.uid()) = user_id);

create index if not exists meu_caminho_consent_records_user_time_idx
on public.meu_caminho_consent_records(user_id, occurred_at desc);
