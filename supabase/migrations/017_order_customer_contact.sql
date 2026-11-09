-- ============================================================
-- Orders: link walk-in / CRM buyers + snapshot delivery details
-- ------------------------------------------------------------
-- The order flow now picks the buyer from the CRM (crm_contacts)
-- instead of a free-typed custom name. The order stores:
--   crm_contact_id — link to the CRM contact (already present on
--                     live; IF NOT EXISTS keeps this idempotent)
--   address        — delivery address snapshotted from the CRM
--                     contact at order time (editable in the form)
--   phone          — contact phone snapshotted the same way
-- The snapshot matters because a CRM contact's address/phone can
-- change later; the order keeps what was true when it was placed.
-- The Book Parcel flow prefills recipient name/phone/address from
-- these columns.
-- RUN LIVE BEFORE DEPLOYING the code that writes them: the order
-- insert fails if the columns do not exist yet.
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS crm_contact_id UUID REFERENCES crm_contacts(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;
