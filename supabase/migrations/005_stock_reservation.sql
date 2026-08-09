-- ============================================================
-- Migration 005: Stock reservation & invoice timing
-- ============================================================
-- Adds quantity_reserved to inventory so stock can be reserved
-- at order approval (preventing overselling) and deducted at
-- delivery. Adds stock_reservations JSONB to orders to track
-- which inventory rows are reserved per order.

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS quantity_reserved INT DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reservations JSONB DEFAULT '[]'::jsonb;
