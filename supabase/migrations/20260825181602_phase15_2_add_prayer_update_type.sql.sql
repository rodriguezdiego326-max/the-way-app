-- Phase 15.2: Add update_type column to prayer_updates
-- Supports distinguishing between "update" and "reflection" entries
-- Defaults to 'update' for backward compatibility with existing rows

ALTER TABLE public.prayer_updates
  ADD COLUMN IF NOT EXISTS update_type text NOT NULL DEFAULT 'update';

COMMENT ON COLUMN public.prayer_updates.update_type IS 'Either "update" or "reflection". Defaults to "update" for backward compatibility.';
