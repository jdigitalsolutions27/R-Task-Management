do $$
begin
  if not exists (select 1 from pg_type where typname = 'company_status') then
    create type public.company_status as enum ('pending_verification', 'verified', 'active');
  end if;
end $$;

alter table public.companies
  add column if not exists status public.company_status,
  add column if not exists support_email_verified_at timestamptz,
  add column if not exists support_email_verification_sent_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists first_admin_user_id uuid references public.users(id) on delete set null;

update public.companies
   set status = 'active'
 where status is null;

update public.companies
   set support_email_verified_at = coalesce(support_email_verified_at, created_at),
       activated_at = coalesce(activated_at, created_at)
 where status = 'active';

with first_admins as (
  select distinct on (company_id)
         company_id,
         id as user_id
    from public.users
   where role = 'super_admin'
     and company_id is not null
   order by company_id, created_at asc
)
update public.companies as companies
   set first_admin_user_id = first_admins.user_id
  from first_admins
 where companies.id = first_admins.company_id
   and companies.first_admin_user_id is null;

alter table public.companies
  alter column status set not null,
  alter column status set default 'pending_verification';

create table if not exists public.company_access_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  email text not null,
  purpose text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint company_access_tokens_purpose_check
    check (purpose in ('company_verification', 'admin_setup'))
);

create index if not exists company_access_tokens_company_idx
  on public.company_access_tokens(company_id, purpose, created_at desc);

create index if not exists company_access_tokens_email_idx
  on public.company_access_tokens(email, purpose, created_at desc);

alter table public.company_access_tokens enable row level security;

create policy "platform_admin_manage_company_access_tokens" on public.company_access_tokens
  for all
  using (public.auth_role() = 'platform_admin')
  with check (public.auth_role() = 'platform_admin');

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
  submitted_admin_setup_token text := nullif(new.raw_user_meta_data ->> 'admin_setup_token', '');
  invite_row public.company_invite_codes%rowtype;
  company_row public.companies%rowtype;
  onboarding_row public.company_access_tokens%rowtype;
  next_status public.user_status := 'pending';
  next_role public.app_role := case
    when requested_role in ('super_admin', 'platform_admin') then 'employee'
    else requested_role
  end;
  next_approved_at timestamptz := null;
begin
  if submitted_admin_setup_token is not null then
    select *
      into onboarding_row
      from public.company_access_tokens
     where purpose = 'admin_setup'
       and email = new.email
       and token_hash = encode(digest(submitted_admin_setup_token, 'sha256'), 'hex')
       and (expires_at is null or expires_at > timezone('utc', now()))
     order by created_at desc
     limit 1;

    if onboarding_row.id is null then
      raise exception 'The admin setup link is invalid or expired.';
    end if;

    select *
      into company_row
      from public.companies
     where id = onboarding_row.company_id
     limit 1;

    if company_row.id is null then
      raise exception 'Company not found.';
    end if;

    if company_row.status not in ('verified', 'active') then
      raise exception 'This company is not ready for admin setup yet.';
    end if;

    if company_row.first_admin_user_id is not null then
      raise exception 'A company administrator already exists for this company.';
    end if;

    next_role := 'super_admin';
    next_status := 'approved';
    next_approved_at := timezone('utc', now());

    update public.company_access_tokens
       set used_at = coalesce(used_at, timezone('utc', now()))
     where id = onboarding_row.id;
  elsif submitted_invite is not null then
    select *
      into invite_row
      from public.company_invite_codes
     where code = submitted_invite
       and active = true
       and (expires_at is null or expires_at > timezone('utc', now()))
       and (max_uses is null or used_count < max_uses)
     limit 1;

    if found then
      select *
        into company_row
        from public.companies
       where id = invite_row.company_id
       limit 1;

      if company_row.id is null then
        raise exception 'Company not found.';
      end if;

      if company_row.status <> 'active' then
        raise exception 'This company is not active yet.';
      end if;

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

    if company_row.status <> 'active' then
      raise exception 'This company is not active yet.';
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

  if submitted_admin_setup_token is not null then
    update public.companies
       set status = 'active',
           activated_at = coalesce(activated_at, timezone('utc', now())),
           first_admin_user_id = new.id,
           support_email_verified_at = coalesce(support_email_verified_at, timezone('utc', now()))
     where id = company_row.id;
  end if;

  return new;
end;
$$;
