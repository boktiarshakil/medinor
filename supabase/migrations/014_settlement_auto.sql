-- ============================================================
-- Auto-settlement — link settlements to real payments
-- ------------------------------------------------------------
-- Settlement is generated automatically the moment an invoice is
-- fully paid. The split comes from the order's snapshotted trade
-- price (company share); the rest of the collected amount is the
-- dealer margin.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Snapshot trade_price on order_items
-- ------------------------------------------------------------
-- The company's share of an order = trade_price × qty. Product
-- prices can be edited later; snapshotting trade_price onto each
-- order line keeps historical settlements, reports and profit
-- figures stable no matter what the catalog prices do.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS trade_price NUMERIC(12,2);

-- Backfill existing rows from the current catalog price.
UPDATE order_items oi
SET trade_price = p.trade_price
FROM products p
WHERE oi.product_id = p.id
  AND oi.trade_price IS NULL;

-- Auto-snapshot on every insert going forward (covers all order
-- creation paths: dealer, SR, catalog, imports).
CREATE OR REPLACE FUNCTION snapshot_order_item_trade_price()
RETURNS TRIGGER AS $$
BEGIN
  SELECT trade_price INTO NEW.trade_price FROM products WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_snapshot_order_item_trade_price ON order_items;
CREATE TRIGGER trg_snapshot_order_item_trade_price
  BEFORE INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION snapshot_order_item_trade_price();

-- ------------------------------------------------------------
-- 2. Link settlements to their invoice
-- ------------------------------------------------------------
-- The invoice is the source of truth for money collected. Linking
-- it directly makes each settlement auditable against the payment
-- reality and lets us guarantee (at the DB level) that an invoice
-- is settled exactly once.

ALTER TABLE settlements
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);

-- Backfill: match each legacy settlement to its order's invoice.
UPDATE settlements s
SET invoice_id = (
  SELECT inv.id FROM invoices inv WHERE inv.order_id = s.order_id LIMIT 1
)
WHERE s.invoice_id IS NULL;

-- One settlement per invoice. Partial index so legacy rows without
-- an invoice (and multiple of them) are still allowed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_settlements_invoice
  ON settlements(invoice_id) WHERE invoice_id IS NOT NULL;