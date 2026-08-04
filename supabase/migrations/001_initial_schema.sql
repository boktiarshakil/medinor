-- ============================================================
-- Mediron SDMS - KGSM Group
-- Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'sales_executive'
    CHECK (role IN ('super_admin','admin','sales_manager','area_manager','sales_executive','warehouse','dealer')),
  area_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AREAS (Districts / Territories)
-- ============================================================
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  district TEXT,
  division TEXT,
  manager_id UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from user_profiles to areas
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_area FOREIGN KEY (area_id) REFERENCES areas(id);

-- ============================================================
-- PRODUCTS (Mediron Catalog)
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT NOT NULL,
  brand TEXT DEFAULT 'Mediron',
  description TEXT,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  trade_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  dealer_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_percent NUMERIC(5,2) DEFAULT 0,
  warranty_months INT DEFAULT 0,
  has_expiry BOOLEAN DEFAULT false,
  expiry_date DATE,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','discontinued')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEALERS / DISTRIBUTORS
-- ============================================================
CREATE TABLE dealers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_name TEXT,
  mobile TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  district TEXT,
  area TEXT,
  area_id UUID REFERENCES areas(id),
  trade_license TEXT,
  bin_number TEXT,
  nid TEXT,
  gps_lat NUMERIC(10,6),
  gps_lng NUMERIC(10,6),
  credit_limit NUMERIC(12,2) DEFAULT 0,
  current_due NUMERIC(12,2) DEFAULT 0,
  payment_terms INT DEFAULT 30, -- days
  assigned_sr_id UUID REFERENCES user_profiles(id),
  visit_frequency TEXT DEFAULT 'weekly' CHECK (visit_frequency IN ('daily','weekly','biweekly','monthly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  sr_id UUID REFERENCES user_profiles(id),
  area_id UUID REFERENCES areas(id),
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','packed','dispatched','delivered','completed','cancelled')),
  total_amount NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  amount NUMERIC(14,2) NOT NULL,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) DEFAULT 0,
  due_amount NUMERIC(14,2) NOT NULL,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid','overdue','cancelled')),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  qr_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  collected_by UUID REFERENCES user_profiles(id),
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','bank','cheque','bkash','nagad','rocket','card','other')),
  reference_number TEXT,
  bank_name TEXT,
  cheque_date DATE,
  notes TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY / WAREHOUSE
-- ============================================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  warehouse_id UUID,
  batch_number TEXT,
  lot_number TEXT,
  quantity INT NOT NULL DEFAULT 0,
  damaged_quantity INT DEFAULT 0,
  expiry_date DATE,
  low_stock_threshold INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in','out','transfer','damage','expiry','adjustment')),
  quantity INT NOT NULL,
  reference_type TEXT, -- 'order', 'return', 'adjustment'
  reference_id UUID,
  notes TEXT,
  performed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RETURNS
-- ============================================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  reason TEXT NOT NULL CHECK (reason IN ('wrong_product','damaged','expired','quality_issue','other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','replaced','refunded')),
  total_amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  reason TEXT,
  unit_price NUMERIC(12,2),
  total_price NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TARGETS
-- ============================================================
CREATE TABLE targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('sales','collection','visits','dealers')),
  user_id UUID REFERENCES user_profiles(id),
  area_id UUID REFERENCES areas(id),
  product_id UUID REFERENCES products(id),
  period TEXT NOT NULL CHECK (period IN ('monthly','quarterly','yearly')),
  year INT NOT NULL,
  month INT,
  quarter INT,
  target_value NUMERIC(14,2) NOT NULL,
  achieved_value NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMISSIONS
-- ============================================================
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount NUMERIC(14,2) DEFAULT 0,
  commission_percent NUMERIC(5,2) DEFAULT 0,
  commission_amount NUMERIC(14,2) DEFAULT 0,
  bonus_amount NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  category TEXT NOT NULL CHECK (category IN ('fuel','food','hotel','promotion','doctor_meeting','campaign','office','other')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRM - CUSTOMERS (Hospitals, Doctors, Clinics, Pharmacies)
-- ============================================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital','doctor','clinic','diagnostic','pharmacy','other')),
  specialty TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  district TEXT,
  area_id UUID REFERENCES areas(id),
  assigned_sr_id UUID REFERENCES user_profiles(id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crm_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id),
  sr_id UUID NOT NULL REFERENCES user_profiles(id),
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  purpose TEXT,
  notes TEXT,
  outcome TEXT,
  next_visit_date DATE,
  gps_lat NUMERIC(10,6),
  gps_lng NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  check_in_lat NUMERIC(10,6),
  check_in_lng NUMERIC(10,6),
  check_out_lat NUMERIC(10,6),
  check_out_lng NUMERIC(10,6),
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','leave','holiday')),
  work_type TEXT DEFAULT 'field' CHECK (work_type IN ('office','field')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GPS TRACKING
-- ============================================================
CREATE TABLE gps_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  accuracy NUMERIC(8,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MARKETING CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('discount','free_product','bundle','coupon','gift','bonus')),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent NUMERIC(5,2),
  min_order_amount NUMERIC(12,2),
  free_product_id UUID REFERENCES products(id),
  free_product_qty INT DEFAULT 0,
  applicable_products UUID[],
  applicable_dealers UUID[],
  budget NUMERIC(14,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMER SUPPORT / TICKETS
-- ============================================================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL,
  dealer_id UUID REFERENCES dealers(id),
  contact_id UUID REFERENCES crm_contacts(id),
  type TEXT NOT NULL CHECK (type IN ('complaint','warranty','replacement','service','general')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to UUID REFERENCES user_profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id),
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'dealer', 'user', 'product'
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'trade_license', 'tin', 'bin', 'nid', 'agreement', 'contract', 'warranty'
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEALER LEDGER (materialized view-friendly table)
-- ============================================================
CREATE TABLE dealer_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('invoice','payment','return','discount','adjustment')),
  reference_id UUID,
  debit NUMERIC(14,2) DEFAULT 0,
  credit NUMERIC(14,2) DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_orders_dealer ON orders(dealer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_invoices_dealer ON invoices(dealer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_dealer ON payments(dealer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_gps_tracking_user ON gps_tracking(user_id, recorded_at);
CREATE INDEX idx_dealer_ledger_dealer ON dealer_ledger(dealer_id, transaction_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_crm_visits_sr ON crm_visits(sr_id, visit_date);
CREATE INDEX idx_targets_user_period ON targets(user_id, period, year, month);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_dealers_updated
  BEFORE UPDATE ON dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_inventory_updated
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate order totals trigger
CREATE OR REPLACE FUNCTION calculate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET
    total_amount = (
      SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = NEW.order_id
    ),
    net_amount = (
      SELECT COALESCE(SUM(total_price), 0) FROM order_items WHERE order_id = NEW.order_id
    ) - discount_amount + vat_amount
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_total
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION calculate_order_totals();
