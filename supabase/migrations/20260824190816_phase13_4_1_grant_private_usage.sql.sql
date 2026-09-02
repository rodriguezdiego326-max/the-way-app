/*
# Phase 13.4.1: Grant USAGE on private schema to authenticated

The private schema needs USAGE grant so authenticated can resolve function
names within it. This does NOT expose the schema via PostgREST — only
the `public` schema is exposed by default. USAGE on schema only allows
resolving objects within the schema, not listing or accessing tables.
*/

GRANT USAGE ON SCHEMA private TO authenticated;
