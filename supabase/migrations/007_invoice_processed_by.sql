-- ============================================================
-- Invoice processed_by
-- Tracks the user whose payment action made the invoice fully paid.
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_invoices_processed_by ON invoices(processed_by);
