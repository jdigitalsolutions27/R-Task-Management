alter type public.app_role add value if not exists 'platform_admin';

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
  next_role public.app_role := case
    when requested_role in ('super_admin', 'platform_admin') then 'employee'
    else requested_role
  end;
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
