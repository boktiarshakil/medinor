-- ============================================================
-- Scrolling news marquee
-- The marquee shows each user's own last 5 active announcements.
-- is_active lets management deactivate stale announcements so
-- they stop appearing in the ticker.
-- ============================================================

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_notifications_marquee
  ON notifications(user_id, is_active, created_at DESC)
  WHERE reference_type = 'announcement';
