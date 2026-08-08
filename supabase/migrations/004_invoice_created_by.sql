-- ============================================================
-- Add created_by to invoices for "Created By" tracking
-- Records which user created/generated each invoice
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by);
