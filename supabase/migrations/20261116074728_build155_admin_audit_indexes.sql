/*
# Build 155 — App admin audit indexes

Adds covering indexes for the private audit table foreign keys identified by the
Supabase performance advisor after the Build 155 authorization migration.
*/

CREATE INDEX IF NOT EXISTS idx_church_admin_audit_actor
  ON private.church_admin_audit_log (actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_admin_audit_claim
  ON private.church_admin_audit_log (claim_id);
CREATE INDEX IF NOT EXISTS idx_church_admin_audit_membership
  ON private.church_admin_audit_log (membership_id);
CREATE INDEX IF NOT EXISTS idx_church_admin_audit_target
  ON private.church_admin_audit_log (target_profile_id);
CREATE INDEX IF NOT EXISTS idx_church_admin_audit_church
  ON private.church_admin_audit_log (church_id);
