-- ============================================================
-- COD requests — public cash-on-delivery order requests
-- ------------------------------------------------------------
-- Public (unauthenticated) customers can add products to a cart
-- and place a cash-on-delivery request with their name + phone.
-- These are stored COMPLETELY SEPARATE from the dealer order /
-- invoice / payment pipeline so the main books are never polluted.
-- Management processes them on the "COD Requests" page.
-- ============================================================

CREATE TABLE IF NOT EXISTS cod_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','processing','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by UUID REFERENCES user_profiles(id),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cod_orders_created ON cod_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_cod_orders_status ON cod_orders(status);

-- Match the app's existing (permissive) RLS posture for transactional tables.
ALTER TABLE cod_orders DISABLE ROW LEVEL SECURITY;