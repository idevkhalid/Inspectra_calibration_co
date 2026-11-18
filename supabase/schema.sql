-- ===========================================================================
-- Inspectra Calibration Company — certificate verification backend
-- Run this once in the Supabase SQL editor (or with `supabase db push`).
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Who may administer certificates
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Certificates
-- ---------------------------------------------------------------------------
create sequence if not exists public.certificate_serial_seq start with 1001;

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  serial text not null,
  full_name text not null,
  full_name_ar text,
  iqama text not null,
  nationality text,
  profession text not null,
  employer text,
  employer_ar text,
  examiner_name text,
  equipment_type text,
  equipment_serial text,
  certificate_type text not null default 'Safety Competency Certificate',
  training_hours integer check (training_hours is null or (training_hours >= 0 and training_hours <= 500)),
  result text not null default 'PASS',
  issue_date date not null default current_date,
  expiry_date date,
  photo_path text,
  status text not null default 'valid' check (status in ('valid', 'suspended', 'revoked')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificates_serial_unique unique (serial),
  constraint certificates_serial_format check (serial ~ '^[A-Z0-9-]{4,40}$')
);

-- Upgrade an existing table created by an earlier version of this file.
alter table public.certificates
  add column if not exists employer_ar text,
  add column if not exists examiner_name text,
  add column if not exists equipment_type text,
  add column if not exists equipment_serial text;

create index if not exists certificates_iqama_idx on public.certificates (iqama);
create index if not exists certificates_name_idx on public.certificates (lower(full_name));
create index if not exists certificates_created_idx on public.certificates (created_at desc);

-- Serial numbers look like INS-2026-01001 and are assigned on insert.
create or replace function public.assign_certificate_serial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.serial is null or btrim(new.serial) = '' then
    new.serial := 'INS-' || to_char(now(), 'YYYY') || '-' ||
                  lpad(nextval('public.certificate_serial_seq')::text, 5, '0');
  else
    new.serial := upper(btrim(new.serial));
  end if;
  new.created_at := coalesce(new.created_at, now());
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists certificates_assign_serial on public.certificates;
create trigger certificates_assign_serial
  before insert on public.certificates
  for each row execute function public.assign_certificate_serial();

create or replace function public.touch_certificate()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists certificates_touch on public.certificates;
create trigger certificates_touch
  before update on public.certificates
  for each row execute function public.touch_certificate();

-- ---------------------------------------------------------------------------
-- Row level security: only administrators touch the table directly
-- ---------------------------------------------------------------------------
alter table public.certificates enable row level security;

drop policy if exists "admins manage certificates" on public.certificates;
create policy "admins manage certificates" on public.certificates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.certificates from public, anon;
grant select, insert, update, delete on public.certificates to authenticated;
revoke all on sequence public.certificate_serial_seq from public, anon;

-- ---------------------------------------------------------------------------
-- Public verification (security definer, no table access for anon)
-- ---------------------------------------------------------------------------
drop function if exists public.verify_certificate(text);

create or replace function public.verify_certificate(p_query text)
returns table (
  serial text,
  full_name text,
  full_name_ar text,
  iqama text,
  nationality text,
  profession text,
  employer text,
  employer_ar text,
  examiner_name text,
  equipment_type text,
  equipment_serial text,
  certificate_type text,
  training_hours integer,
  result text,
  issue_date date,
  expiry_date date,
  photo_path text,
  status text,
  is_valid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.serial,
    c.full_name,
    c.full_name_ar,
    c.iqama,
    c.nationality,
    c.profession,
    c.employer,
    c.employer_ar,
    c.examiner_name,
    c.equipment_type,
    c.equipment_serial,
    c.certificate_type,
    c.training_hours,
    c.result,
    c.issue_date,
    c.expiry_date,
    c.photo_path,
    case
      when c.status = 'revoked' then 'revoked'
      when c.status = 'suspended' then 'suspended'
      when c.expiry_date is not null and c.expiry_date < current_date then 'expired'
      else 'valid'
    end as status,
    (
      c.status = 'valid'
      and (c.expiry_date is null or c.expiry_date >= current_date)
    ) as is_valid
  from public.certificates c
  where upper(c.serial) = upper(btrim(p_query))
     or c.iqama = btrim(p_query)
     or (
       char_length(btrim(p_query)) >= 3
       and lower(c.full_name) like '%' || lower(btrim(p_query)) || '%'
     )
  order by
    (upper(c.serial) = upper(btrim(p_query))) desc,
    (c.iqama = btrim(p_query)) desc,
    c.created_at desc
  limit 25;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Holder photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificate-photos', 'certificate-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "certificate photos public read" on storage.objects;
create policy "certificate photos public read" on storage.objects
  for select
  using (bucket_id = 'certificate-photos');

drop policy if exists "certificate photos admin insert" on storage.objects;
create policy "certificate photos admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificate-photos' and public.is_admin());

drop policy if exists "certificate photos admin update" on storage.objects;
create policy "certificate photos admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'certificate-photos' and public.is_admin())
  with check (bucket_id = 'certificate-photos' and public.is_admin());

drop policy if exists "certificate photos admin delete" on storage.objects;
create policy "certificate photos admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificate-photos' and public.is_admin());
