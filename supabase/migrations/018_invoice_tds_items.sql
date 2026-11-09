-- 018_invoice_tds_items.sql
-- Invoice tax breakdown + printable line items.
-- The live invoices table already carries subtotal / discount_amount /
-- delivery_charge / tax_percent / vat_amount (from the pre-repo live build);
-- declare them here IF NOT EXISTS so the repo migration history is complete.
-- New: TDS (income tax deducted at source) + net payable + stored line items
-- so an invoice can be printed (10 rows, half A4) from the invoice itself.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 15;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_percent NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tds_amount NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_payable NUMERIC;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Backfill net_payable for existing invoices (they had no TDS, so the buyer
-- owes the full grand total).
UPDATE invoices SET net_payable = total_amount WHERE net_payable IS NULL;
