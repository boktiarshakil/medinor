-- ============================================================
-- Payment approval workflow
-- Adds a status to payments so dealer-recorded payments must be
-- confirmed by an admin/sales_manager before the invoice is
-- updated as paid. Existing payments default to approved.
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES user_profiles(id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
