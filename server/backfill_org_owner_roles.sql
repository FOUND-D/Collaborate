-- Backfill owner role assignment for existing organisations
-- Uses the actual schema column names from alterations1.sql:
-- org_roles.org_id and org_compliance_rules.org_id

with owner_roles as (
  select
    o.id as organisation_id,
    r.id as owner_role_id
  from public.organisations o
  join public.org_roles r
    on r.org_id = o.id
   and r.slug = 'owner'
)
update public.organisation_members om
set
  org_role_id = orr.owner_role_id,
  role = 'owner',
  status = coalesce(om.status, 'active')
from owner_roles orr
where om.organisation_id = orr.organisation_id
  and om.user_id = (
    select o.owner_id
    from public.organisations o
    where o.id = om.organisation_id
  );

insert into public.org_roles (
  org_id,
  name,
  slug,
  is_system_role,
  can_manage_members,
  can_manage_roles,
  can_manage_settings,
  can_manage_teams,
  can_invite_members,
  can_view_reports
)
select
  o.id,
  'Owner',
  'owner',
  true,
  true,
  true,
  true,
  true,
  true,
  true
from public.organisations o
where not exists (
  select 1
  from public.org_roles r
  where r.org_id = o.id
    and r.slug = 'owner'
);

insert into public.org_roles (
  org_id,
  name,
  slug,
  is_system_role,
  can_manage_members,
  can_manage_roles,
  can_manage_settings,
  can_manage_teams,
  can_invite_members,
  can_view_reports
)
select
  o.id,
  'Admin',
  'admin',
  true,
  true,
  false,
  true,
  true,
  true,
  true
from public.organisations o
where not exists (
  select 1
  from public.org_roles r
  where r.org_id = o.id
    and r.slug = 'admin'
);

insert into public.org_roles (
  org_id,
  name,
  slug,
  is_system_role,
  can_manage_members,
  can_manage_roles,
  can_manage_settings,
  can_manage_teams,
  can_invite_members,
  can_view_reports
)
select
  o.id,
  'Member',
  'member',
  true,
  false,
  false,
  false,
  false,
  false,
  false
from public.organisations o
where not exists (
  select 1
  from public.org_roles r
  where r.org_id = o.id
    and r.slug = 'member'
);
