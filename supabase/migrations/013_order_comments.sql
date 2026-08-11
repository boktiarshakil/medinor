-- ============================================================
-- Order ticket comments
-- Persists comments made on the Order Tracker page so they
-- survive reloads, and lets the app fire notifications when a
-- new comment lands. RLS is disabled to match the permissive
-- client-side flow of the other core tables.
-- ============================================================

CREATE TABLE order_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  step TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_comments DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_order_comments_order ON order_comments(order_id, created_at);