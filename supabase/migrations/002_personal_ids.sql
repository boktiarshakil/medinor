-- ============================================================
-- Personal IDs table
-- Stores unique attribution codes for SRs and dealers
-- ============================================================

CREATE TABLE personal_ids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('sr', 'dealer')),
  entity_name TEXT NOT NULL,
  area TEXT,
  user_id UUID REFERENCES user_profiles(id),
  dealer_id UUID REFERENCES dealers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personal_ids_code ON personal_ids(code);
CREATE INDEX idx_personal_ids_user ON personal_ids(user_id);
CREATE INDEX idx_personal_ids_dealer ON personal_ids(dealer_id);
