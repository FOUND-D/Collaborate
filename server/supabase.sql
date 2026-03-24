-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL,
  participant_b uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_participant_a_fkey FOREIGN KEY (participant_a) REFERENCES public.users(id),
  CONSTRAINT conversations_participant_b_fkey FOREIGN KEY (participant_b) REFERENCES public.users(id)
);
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  room_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'inactive'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  started_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meetings_pkey PRIMARY KEY (id),
  CONSTRAINT meetings_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT meetings_started_by_fkey FOREIGN KEY (started_by) REFERENCES public.users(id)
);
CREATE TABLE public.message_reads (
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_reads_pkey PRIMARY KEY (message_id, user_id),
  CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id),
  CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  content text NOT NULL,
  team_id uuid,
  conversation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id),
  CONSTRAINT messages_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.org_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  target_user uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT org_audit_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organisations(id),
  CONSTRAINT org_audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id),
  CONSTRAINT org_audit_log_target_user_fkey FOREIGN KEY (target_user) REFERENCES public.users(id)
);
CREATE TABLE public.org_compliance_rules (
  org_id uuid NOT NULL,
  require_profile_photo boolean NOT NULL DEFAULT false,
  require_mobile_number boolean NOT NULL DEFAULT false,
  require_full_name boolean NOT NULL DEFAULT false,
  require_bio_designation boolean NOT NULL DEFAULT false,
  required_custom_field_slugs ARRAY NOT NULL DEFAULT '{}'::text[],
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_compliance_rules_pkey PRIMARY KEY (org_id),
  CONSTRAINT org_compliance_rules_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organisations(id)
);
CREATE TABLE public.org_custom_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text'::text CHECK (field_type = ANY (ARRAY['text'::text, 'url'::text, 'date'::text, 'select'::text, 'number'::text])),
  options ARRAY NOT NULL DEFAULT '{}'::text[],
  is_required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_custom_fields_pkey PRIMARY KEY (id),
  CONSTRAINT org_custom_fields_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organisations(id)
);
CREATE TABLE public.org_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_system_role boolean NOT NULL DEFAULT false,
  can_manage_members boolean NOT NULL DEFAULT false,
  can_manage_roles boolean NOT NULL DEFAULT false,
  can_manage_settings boolean NOT NULL DEFAULT false,
  can_manage_teams boolean NOT NULL DEFAULT false,
  can_invite_members boolean NOT NULL DEFAULT false,
  can_view_reports boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT org_roles_pkey PRIMARY KEY (id),
  CONSTRAINT org_roles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organisations(id),
  CONSTRAINT org_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.organisation_members (
  organisation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text])),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  org_role_id uuid,
  is_provisioned boolean NOT NULL DEFAULT false,
  temp_password_plain text,
  temp_password_used boolean NOT NULL DEFAULT false,
  invited_by uuid,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'pending_onboarding'::text])),
  CONSTRAINT organisation_members_pkey PRIMARY KEY (organisation_id, user_id),
  CONSTRAINT organisation_members_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
  CONSTRAINT organisation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT organisation_members_org_role_id_fkey FOREIGN KEY (org_role_id) REFERENCES public.org_roles(id),
  CONSTRAINT organisation_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
CREATE TABLE public.organisation_pending_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member'::text CHECK (role = ANY (ARRAY['admin'::text, 'member'::text])),
  expires_at timestamp with time zone NOT NULL,
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organisation_pending_invites_pkey PRIMARY KEY (id),
  CONSTRAINT organisation_pending_invites_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
  CONSTRAINT organisation_pending_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);
CREATE TABLE public.organisations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT ''::text,
  logo text NOT NULL DEFAULT ''::text,
  owner_id uuid NOT NULL,
  settings jsonb NOT NULL DEFAULT '{"allowMemberInvites": false, "requireApprovalToJoin": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organisations_pkey PRIMARY KEY (id),
  CONSTRAINT organisations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  goal text NOT NULL,
  owner_id uuid NOT NULL,
  team_id uuid,
  organisation_id uuid,
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT projects_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id),
  CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.task_dependencies (
  task_id uuid NOT NULL,
  depends_on_task_id uuid NOT NULL,
  CONSTRAINT task_dependencies_pkey PRIMARY KEY (task_id, depends_on_task_id),
  CONSTRAINT task_dependencies_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_dependencies_depends_on_task_id_fkey FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  duration integer NOT NULL,
  assignee_id uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'at_risk'::text])),
  priority text NOT NULL DEFAULT 'Medium'::text CHECK (priority = ANY (ARRAY['High'::text, 'Medium'::text, 'Low'::text])),
  assumptions ARRAY NOT NULL DEFAULT '{}'::text[],
  commitment_timestamp timestamp with time zone,
  team_id uuid,
  project_id uuid NOT NULL,
  parent_id uuid,
  owner_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id),
  CONSTRAINT tasks_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.tasks(id),
  CONSTRAINT tasks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.team_join_requests (
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_join_requests_pkey PRIMARY KEY (team_id, user_id),
  CONSTRAINT team_join_requests_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.team_members (
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT team_members_pkey PRIMARY KEY (team_id, user_id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id),
  CONSTRAINT team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  organisation_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
  CONSTRAINT teams_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'Developer'::text,
  profile_image text NOT NULL DEFAULT ''::text,
  tech_stack ARRAY NOT NULL DEFAULT '{}'::text[],
  reputation_score integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  mobile_number text,
  bio text,
  designation text,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);