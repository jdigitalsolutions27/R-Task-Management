alter table public.support_tickets
  add column if not exists target_level text not null default 'company_admin'
    check (target_level in ('company_admin', 'platform_admin')),
  add column if not exists archived_at timestamptz,
  add column if not exists escalated_at timestamptz,
  add column if not exists escalated_by uuid references public.users(id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references public.users(id) on delete set null;

create index if not exists support_tickets_company_target_idx
  on public.support_tickets (company_id, target_level, status);

create index if not exists support_tickets_platform_queue_idx
  on public.support_tickets (target_level, archived_at, status, created_at desc);
