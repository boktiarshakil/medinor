-- ============================================================
-- Real-time notifications
-- Moves the notifications table into the supabase_realtime
-- publication so the TopBar bell updates instantly (instead of
-- relying on polling) when a notification row is inserted or
-- updated for the current user.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;