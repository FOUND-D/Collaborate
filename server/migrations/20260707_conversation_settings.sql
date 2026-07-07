-- Migration to support star, archive, mute, and block in chat conversations
CREATE TABLE IF NOT EXISTS public.user_conversation_settings (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  is_starred boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_muted boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_user_conversation_settings_user_id ON public.user_conversation_settings(user_id);
