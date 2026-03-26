BEGIN;

ALTER TABLE public.org_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org admins can create roles" ON public.org_roles;

CREATE POLICY "org admins can create roles"
ON public.org_roles
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.organisation_members om
    WHERE om.organisation_id = org_roles.org_id
      AND om.user_id = auth.uid()
      AND (
        om.role = 'owner'
        OR EXISTS (
          SELECT 1
          FROM public.org_roles r2
          WHERE r2.id = om.org_role_id
            AND r2.can_manage_roles = true
        )
      )
  )
);

COMMIT;
