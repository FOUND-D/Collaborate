-- =============================================================================
-- alterations1.sql
-- Organisation Member Management · Custom Role Hierarchy · Compliance Rules
-- Additive only — does NOT drop or alter any existing column/table
-- Run as a single transaction
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Add profile fields to users (needed for org compliance enforcement)
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mobile_number  text,
  ADD COLUMN IF NOT EXISTS bio            text,
  ADD COLUMN IF NOT EXISTS designation    text,
  -- stores org-defined custom required field values keyed by field slug
  ADD COLUMN IF NOT EXISTS custom_fields  jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 2. CUSTOM ORG ROLES
--    System roles (owner / admin / member) are seeded per-org on creation.
--    Owners/admins with can_manage_roles=true may create additional custom rows.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_roles (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                 text        NOT NULL,           -- display: "Moderator"
  slug                 text        NOT NULL,           -- machine: "moderator"
  is_system_role       boolean     NOT NULL DEFAULT false,  -- true = cannot be deleted
  -- granular permission flags
  can_manage_members   boolean     NOT NULL DEFAULT false,
  can_manage_roles     boolean     NOT NULL DEFAULT false,
  can_manage_settings  boolean     NOT NULL DEFAULT false,
  can_manage_teams     boolean     NOT NULL DEFAULT false,
  can_invite_members   boolean     NOT NULL DEFAULT false,
  can_view_reports     boolean     NOT NULL DEFAULT false,
  created_by           uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

-- ---------------------------------------------------------------------------
-- 3. Upgrade organisation_members to reference org_roles + track provisioning
-- ---------------------------------------------------------------------------
ALTER TABLE public.organisation_members
  ADD COLUMN IF NOT EXISTS org_role_id         uuid        REFERENCES public.org_roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_provisioned      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temp_password_plain text,         -- cleared after first login
  ADD COLUMN IF NOT EXISTS temp_password_used  boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_by          uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status              text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'pending_onboarding'));

-- ---------------------------------------------------------------------------
-- 4. ORG COMPLIANCE RULES
--    One row per org. Flags drive server-side enforcement on every profile save.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_compliance_rules (
  org_id                      uuid     PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  require_profile_photo       boolean  NOT NULL DEFAULT false,
  require_mobile_number       boolean  NOT NULL DEFAULT false,
  require_full_name           boolean  NOT NULL DEFAULT false,
  require_bio_designation     boolean  NOT NULL DEFAULT false,
  required_custom_field_slugs text[]   NOT NULL DEFAULT '{}',
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5. CUSTOM FIELD DEFINITIONS
--    Org admins declare extra profile fields (text, url, date, select, number)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_custom_fields (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  slug        text        NOT NULL,
  label       text        NOT NULL,
  field_type  text        NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text', 'url', 'date', 'select', 'number')),
  options     text[]      NOT NULL DEFAULT '{}',   -- for field_type = 'select'
  is_required boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

-- ---------------------------------------------------------------------------
-- 6. ORG AUDIT LOG
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  actor_id    uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  action      text        NOT NULL,  -- 'member.created' | 'role.assigned' | 'rules.updated' …
  target_user uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 7. Seed system roles for every existing org (owner / admin / member)
-- ---------------------------------------------------------------------------
INSERT INTO public.org_roles
  (org_id, name, slug, is_system_role,
   can_manage_members, can_manage_roles, can_manage_settings,
   can_manage_teams,   can_invite_members, can_view_reports)
SELECT
  o.id,
  r.name, r.slug, true,
  r.cmm, r.cmr, r.cms, r.cmt, r.cim, r.cvr
FROM public.organisations o
CROSS JOIN (VALUES
  ('Owner',  'owner',  true,  true,  true,  true,  true,  true),
  ('Admin',  'admin',  true,  false, true,  true,  true,  true),
  ('Member', 'member', false, false, false, false, false, false)
) AS r(name, slug, cmm, cmr, cms, cmt, cim, cvr)
ON CONFLICT (org_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Backfill org_role_id on existing organisation_members rows
-- ---------------------------------------------------------------------------
UPDATE public.organisation_members om
SET org_role_id = (
  SELECT id FROM public.org_roles
  WHERE org_id = om.organisation_id
    AND slug   = om.role
  LIMIT 1
)
WHERE om.org_role_id IS NULL;

-- ---------------------------------------------------------------------------
-- 9. Seed compliance rules row for every existing org (all false by default)
-- ---------------------------------------------------------------------------
INSERT INTO public.org_compliance_rules (org_id)
SELECT id FROM public.organisations
ON CONFLICT (org_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_roles_org_id      ON public.org_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_org_id      ON public.org_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_actor        ON public.org_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_org_custom_fields_org  ON public.org_custom_fields(org_id);

-- ---------------------------------------------------------------------------
-- 11. updated_at triggers for new tables
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_org_roles_updated_at ON public.org_roles;
CREATE TRIGGER trg_org_roles_updated_at
  BEFORE UPDATE ON public.org_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_org_compliance_updated_at ON public.org_compliance_rules;
CREATE TRIGGER trg_org_compliance_updated_at
  BEFORE UPDATE ON public.org_compliance_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;