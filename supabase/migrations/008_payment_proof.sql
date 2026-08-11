-- ============================================================
-- Payment proof requirement
-- Every payment (cash, cheque, bank transfer, RTGS, bKash, Nogod)
-- must carry a slip photo / transaction screenshot uploaded as
-- proof by the SR or dealer.
-- ============================================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_by UUID REFERENCES user_profiles(id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payments_proof ON payments(payment_proof_url)
  WHERE payment_proof_url IS NOT NULL;

-- Normalize legacy payment method values to the canonical list
UPDATE payments SET payment_method = 'bank_transfer' WHERE payment_method = 'bank';
UPDATE payments SET payment_method = 'nogod' WHERE payment_method = 'nagad';

-- Keep the canonical methods plus legacy values that may already exist
-- so historical rows are never rejected by the constraint.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('cash','cheque','bank_transfer','rtgs','bkash','nogod','rocket','card','other'));
