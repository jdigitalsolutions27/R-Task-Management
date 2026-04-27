create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique default 'default',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rtask-site-media',
  'rtask-site-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.site_content enable row level security;

create policy "site_content_select_admin" on public.site_content
for select using (public.is_company_admin());

create policy "site_content_manage_admin" on public.site_content
for all using (public.is_company_admin())
with check (public.is_company_admin());
