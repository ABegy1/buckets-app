# Buckets schema v2 manual checklist

1. Run `supabase/schema_v2.sql` in the Supabase SQL editor to create the tables, views, and trigger.
2. In Database > Replication > Replication, ensure the `shot_events` table is enabled for Realtime (Postgres Changes) so subscriptions work.
3. Configure Row Level Security policies. During early development you can add permissive `select/insert/update` policies on the new tables and views, then tighten as needed.
4. Seed initial data if desired: create tier definitions, a planned season, season tier rules, teams, roster entries, and players. Points for shots will be computed automatically by the trigger.
