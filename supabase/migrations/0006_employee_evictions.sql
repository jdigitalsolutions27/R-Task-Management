drop policy if exists "evictions_manage" on public.evictions;

create policy "evictions_select" on public.evictions
for select using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or created_by = auth.uid())
  )
);

create policy "evictions_insert" on public.evictions
for insert with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and created_by = auth.uid()
    and public.is_approved_user()
    and (public.is_company_admin() or public.auth_role() = 'employee')
  )
);

create policy "evictions_update" on public.evictions
for update using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or created_by = auth.uid())
  )
)
with check (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_approved_user()
    and (public.is_company_admin() or created_by = auth.uid())
  )
);

create policy "evictions_delete" on public.evictions
for delete using (
  public.is_super_admin()
  or (
    company_id = public.auth_company_id()
    and public.is_company_admin()
  )
);
