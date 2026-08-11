-- ============================================================
-- Live GPS sharing
-- 1) gps_tracking is written and read by the SPA with the anon
--    key (same permissive setup as the other client-side flow
--    tables), so disable RLS to match the existing schema state.
-- 2) Move gps_tracking into the supabase_realtime publication so
--    the Live GPS map updates instantly when a field user's
--    location is inserted/updated (instead of only polling).
-- ============================================================

ALTER TABLE gps_tracking DISABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE gps_tracking;