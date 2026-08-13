-- COD requests: track stock reservations across the processing lifecycle.
--   new        → nothing reserved (unconfirmed lead)
--   processing → items reserved (customer confirmed on phone)
--   completed  → reserved stock deducted + stock_movement('cod') recorded
--   cancelled  → reservation released
ALTER TABLE cod_orders
  ADD COLUMN IF NOT EXISTS stock_reservations JSONB NOT NULL DEFAULT '[]';