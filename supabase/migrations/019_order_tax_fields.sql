-- 019_order_tax_fields.sql
-- Order tax breakdown so the order carries the sale terms and the
-- auto-invoice inherits them exactly (no re-entry, no order/invoice conflict).
-- orders already has discount_amount / vat_amount / total_amount / net_amount.
-- NOTE: the trigger trg_order_items_total keeps total_amount = SUM(items) and
-- net_amount = SUM(items) - discount_amount + vat_amount; those two columns
-- keep their trigger semantics. The full amount the buyer pays lives in
-- net_payable, and the delivery charge / TDS live in their own columns.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 15;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tds_percent NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tds_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS net_payable NUMERIC;

-- Backfill net_payable for existing orders (they had no delivery/TDS, so the
-- buyer owed the trigger's net_amount).
UPDATE orders SET net_payable = net_amount WHERE net_payable IS NULL;
