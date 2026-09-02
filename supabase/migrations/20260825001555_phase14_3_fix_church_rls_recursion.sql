
-- Break infinite RLS recursion between church_profiles and church_memberships.
-- church_profiles SELECT references church_memberships (membership check)
-- church_memberships SELECT references church_profiles (owner check)
-- This creates infinite recursion: church_profiles -> church_memberships -> church_profiles -> ...
--
-- Fix: Drop the recursive select_church_memberships policy.
-- Keep select_own_church_memberships (auth.uid() = profile_id) which covers the primary case.
-- The church_profiles SELECT policy already checks membership via church_memberships,
-- so church_memberships only needs to check profile_id ownership, not church ownership.
--
-- Also drop the recursive delete_church_memberships policy.
-- Keep delete_own_church_memberships (auth.uid() = profile_id).

DROP POLICY IF EXISTS select_church_memberships ON church_memberships;
DROP POLICY IF EXISTS delete_church_memberships ON church_memberships;
