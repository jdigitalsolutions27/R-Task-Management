create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('super_admin', 'corporate_user', 'employee', 'inspector');
  end if;

  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type public.approval_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type public.user_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'file_category') then
    create type public.file_category as enum ('general', 'inspection', 'shopping_report', 'eviction', 'photo', 'video');
  end if;

  if not exists (select 1 from pg_type where typname = 'module_kind') then
    create type public.module_kind as enum ('files', 'inspections', 'shopping_reports', 'evictions');
  end if;

  if not exists (select 1 from pg_type where typname = 'inspection_status') then
    create type public.inspection_status as enum ('scheduled', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'eviction_status') then
    create type public.eviction_status as enum ('draft', 'filed', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'property_status') then
    create type public.property_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'support_status') then
    create type public.support_status as enum ('open', 'in_progress', 'resolved');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  name text not null,
  slug text not null unique,
  support_email text,
  primary_color text default '#6B7D6D',
  secondary_color text default '#C7B7A3',
  background_color text default '#F7F5F2',
  invite_approval_required boolean not null default true,
  constraint companies_slug_check check (slug ~ '^[a-z0-9-]+$')
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  email text not null,
  full_name text not null,
  avatar_url text,
  role public.app_role not null default 'employee',
  status public.user_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null,
  last_sign_in_at timestamptz
);

create table if not exists public.company_invite_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  code text not null unique,
  role public.app_role not null,
  active boolean not null default true,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  constraint invite_code_uses_check check (max_uses is null or max_uses > 0)
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  name text not null,
  reference_code text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'United States',
  status public.property_status not null default 'active'
);

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  inspector_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  title text not null,
  summary text,
  scheduled_for timestamptz,
  completed_at timestamptz,
  status public.inspection_status not null default 'scheduled',
  report_file_id uuid
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  title text not null,
  description text,
  report_date date not null default current_date,
  report_file_id uuid not null,
  video_file_id uuid,
  status public.report_status not null default 'draft'
);

create table if not exists public.evictions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  title text not null,
  summary text,
  status public.eviction_status not null default 'draft',
  filed_at timestamptz,
  completed_at timestamptz,
  document_file_id uuid
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  inspection_id uuid,
  report_id uuid,
  eviction_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  original_name text not null,
  file_name text not null,
  mime_type text not null,
  extension text,
  size_bytes bigint not null,
  category public.file_category not null,
  module public.module_kind not null,
  storage_bucket text not null default 'rtask-private',
  storage_path text not null unique,
  description text,
  checksum text,
  version integer not null default 1,
  status public.approval_status not null default 'pending',
  rejection_comment text,
  approved_at timestamptz,
  approved_by uuid references public.users(id) on delete set null
);

create table if not exists public.file_status_logs (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  previous_status public.approval_status,
  next_status public.approval_status not null,
  comment text
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  recipient_user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  title text not null,
  message text not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  subject text not null,
  message text not null,
  status public.support_status not null default 'open'
);

create or replace function public.auth_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.users where id = auth.uid();
$$;

create or replace function public.auth_user_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.users where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() = 'super_admin', false);
$$;

create or replace function public.is_company_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() in ('super_admin', 'corporate_user'), false);
$$;

create or replace function public.is_approved_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_user_status() = 'approved' or public.auth_role() = 'super_admin', false);
$$;

alter table public.inspections
  add constraint inspections_report_file_id_fkey
  foreign key (report_file_id) references public.files(id) on delete set null;

alter table public.reports
  add constraint reports_report_file_id_fkey
  foreign key (report_file_id) references public.files(id) on delete restrict;

alter table public.reports
  add constraint reports_video_file_id_fkey
  foreign key (video_file_id) references public.files(id) on delete set null;

alter table public.evictions
  add constraint evictions_document_file_id_fkey
  foreign key (document_file_id) references public.files(id) on delete set null;

alter table public.files
  add constraint files_inspection_id_fkey
  foreign key (inspection_id) references public.inspections(id) on delete set null;

alter table public.files
  add constraint files_report_id_fkey
  foreign key (report_id) references public.reports(id) on delete set null;

alter table public.files
  add constraint files_eviction_id_fkey
  foreign key (eviction_id) references public.evictions(id) on delete set null;

create index if not exists idx_users_company_id on public.users(company_id);
create index if not exists idx_users_status on public.users(status);
create index if not exists idx_properties_company_id on public.properties(company_id);
create index if not exists idx_files_company_status on public.files(company_id, status);
create index if not exists idx_files_uploader_id on public.files(uploader_id);
create index if not exists idx_file_status_logs_file_id on public.file_status_logs(file_id);
create index if not exists idx_inspections_company_id on public.inspections(company_id);
create index if not exists idx_reports_company_id on public.reports(company_id);
create index if not exists idx_evictions_company_id on public.evictions(company_id);
create index if not exists idx_notifications_recipient on public.notifications(recipient_user_id);
create index if not exists idx_audit_logs_company_id on public.audit_logs(company_id);
create index if not exists idx_support_tickets_company_id on public.support_tickets(company_id);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties
for each row execute function public.set_updated_at();

drop trigger if exists files_set_updated_at on public.files;
create trigger files_set_updated_at before update on public.files
for each row execute function public.set_updated_at();

drop trigger if exists inspections_set_updated_at on public.inspections;
create trigger inspections_set_updated_at before update on public.inspections
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports
for each row execute function public.set_updated_at();

drop trigger if exists evictions_set_updated_at on public.evictions;
create trigger evictions_set_updated_at before update on public.evictions
for each row execute function public.set_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.app_role := coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'employee');
  submitted_invite text := nullif(upper(new.raw_user_meta_data ->> 'invite_code'), '');
  requested_slug text := nullif(lower(new.raw_user_meta_data ->> 'company_slug'), '');
  invite_row public.company_invite_codes%rowtype;
  company_row public.companies%rowtype;
  next_status public.user_status := 'pending';
  next_role public.app_role := case when requested_role = 'super_admin' then 'employee' else requested_role end;
  next_approved_at timestamptz := null;
begin
  if submitted_invite is not null then
    select *
      into invite_row
      from public.company_invite_codes
     where code = submitted_invite
       and active = true
       and (expires_at is null or expires_at > timezone('utc', now()))
       and (max_uses is null or used_count < max_uses)
     limit 1;

    if found then
      select * into company_row from public.companies where id = invite_row.company_id;
      next_role := invite_row.role;
      next_status := 'approved';
      next_approved_at := timezone('utc', now());

      update public.company_invite_codes
         set used_count = used_count + 1
       where id = invite_row.id;
    end if;
  end if;

  if company_row.id is null then
    if requested_slug is null then
      raise exception 'A company slug or invite code is required.';
    end if;

    select *
      into company_row
      from public.companies
     where lower(slug) = requested_slug
     limit 1;

    if company_row.id is null then
      raise exception 'Company not found.';
    end if;

    if company_row.invite_approval_required = false then
      next_status := 'approved';
      next_approved_at := timezone('utc', now());
    end if;
  end if;

  insert into public.users (
    id,
    company_id,
    email,
    full_name,
    role,
    status,
    approved_at,
    last_sign_in_at
  )
  values (
    new.id,
    company_row.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    next_role,
    next_status,
    next_approved_at,
    new.last_sign_in_at
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.company_invite_codes enable row level security;
alter table public.properties enable row level security;
alter table public.files enable row level security;
alter table public.file_status_logs enable row level security;
alter table public.inspections enable row level security;
alter table public.reports enable row level security;
alter table public.evictions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.support_tickets enable row level security;

create policy "companies_select" on public.companies
for select using (public.is_super_admin() or id = public.auth_company_id());

create policy "companies_update" on public.companies
for update using (public.is_super_admin() or (id = public.auth_company_id() and public.is_company_admin()))
with check (public.is_super_admin() or (id = public.auth_company_id() and public.is_company_admin()));

create policy "users_select" on public.users
for select using (
  public.is_super_admin()
  or id = auth.uid()
  or (company_id = public.auth_company_id() and public.is_approved_user())
);

create policy "users_update" on public.users
for update using (
  public.is_super_admin()
  or id = auth.uid()
  or (company_id = public.auth_company_id() and public.is_company_admin())
)
with check (
  public.is_super_admin()
  or id = auth.uid()
  or (company_id = public.auth_company_id() and public.is_company_admin())
);

create policy "invite_codes_manage" on public.company_invite_codes
for all using (
  public.is_super_admin()
  or (company_id = public.auth_company_id() and public.is_company_admin())
)
with check (
  public.is_super_admin()
  or (company_id = public.auth_company_id() and public.is_company_admin())
);

create policy "properties_select" on public.properties
for select using (
  public.is_super_admin()
  or (company_id = public.auth_company_id() and public.is_approved_user())
);

create policy "properties_manage" on public.properties
for all using (
  public.is_super_admin()
  or (company_id = public.auth_company_id() and public.is_company_admin())
)
with check (
  public.is_super_admin()
  or (company_id = public.auth_company_id() and public.is_company_admin())
);

create policy "files_select" on public.files
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or uploader_id = auth.uid())
  )
);

create policy "files_insert" on public.files
for insert with check (
  company_id = public.auth_company_id()
  and uploader_id = auth.uid()
  and public.is_approved_user()
  and (
    public.is_company_admin()
    or (public.auth_role() = 'employee' and module = 'files')
    or (public.auth_role() = 'inspector' and module = 'inspections')
  )
);

create policy "files_update" on public.files
for update using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or uploader_id = auth.uid())
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or uploader_id = auth.uid())
  )
);

create policy "files_delete" on public.files
for delete using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);

create policy "file_status_logs_select" on public.file_status_logs
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (
      public.is_company_admin()
      or exists (
        select 1
          from public.files f
         where f.id = file_id
           and f.uploader_id = auth.uid()
      )
    )
  )
);

create policy "file_status_logs_insert" on public.file_status_logs
for insert with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and actor_id = auth.uid()
    and public.is_approved_user()
  )
);

create policy "inspections_select" on public.inspections
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or inspector_id = auth.uid())
  )
);

create policy "inspections_insert" on public.inspections
for insert with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and inspector_id = auth.uid()
    and public.is_approved_user()
    and (public.is_company_admin() or public.auth_role() = 'inspector')
  )
);

create policy "inspections_update" on public.inspections
for update using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or inspector_id = auth.uid())
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or inspector_id = auth.uid())
  )
);

create policy "inspections_delete" on public.inspections
for delete using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);

create policy "reports_manage" on public.reports
for all using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);

create policy "evictions_manage" on public.evictions
for all using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);

create policy "notifications_select" on public.notifications
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (
      public.is_company_admin()
      or recipient_user_id is null
      or recipient_user_id = auth.uid()
    )
  )
);

create policy "notifications_update" on public.notifications
for update using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and (recipient_user_id = auth.uid() or public.is_company_admin())
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and (recipient_user_id = auth.uid() or public.is_company_admin())
  )
);

create policy "audit_logs_select" on public.audit_logs
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
  )
);

create policy "audit_logs_insert" on public.audit_logs
for insert with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and actor_id = auth.uid()
    and public.is_approved_user()
  )
);

create policy "support_select" on public.support_tickets
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or created_by = auth.uid())
  )
);

create policy "support_insert" on public.support_tickets
for insert with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and created_by = auth.uid()
    and public.is_approved_user()
  )
);

create policy "support_update" on public.support_tickets
for update using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);

insert into storage.buckets (id, name, public, file_size_limit)
values ('rtask-private', 'rtask-private', false, 1073741824)
on conflict (id) do nothing;

create policy "storage_insert_company_prefix" on storage.objects
for insert to authenticated with check (
  bucket_id = 'rtask-private'
  and public.is_approved_user()
  and coalesce((storage.foldername(name))[1], '') = public.auth_company_id()::text
);

create policy "storage_delete_company_prefix" on storage.objects
for delete to authenticated using (
  bucket_id = 'rtask-private'
  and public.is_company_admin()
  and coalesce((storage.foldername(name))[1], '') = public.auth_company_id()::text
);
