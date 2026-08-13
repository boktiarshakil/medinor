# SDMS — Complete Business & Operations Guide

> **Sales & Distribution Management System** for a multi-brand medical / FMCG
> distribution company in Bangladesh.
>
> This guide explains the business model end-to-end: who does what, how money
> flows, how every page works, and how all the parts connect.

---

## Table of Contents

1. [What SDMS Is](#1-what-sdms-is)
2. [The Business Chain](#2-the-business-chain)
3. [Roles & Responsibilities](#3-roles--responsibilities)
4. [Pricing Model & Price Isolation](#4-pricing-model--price-isolation)
5. [Master Data](#5-master-data)
6. [Order Lifecycle (Full Walkthrough)](#6-order-lifecycle-full-walkthrough)
7. [Invoicing](#7-invoicing)
8. [Payments & Collections](#8-payments--collections)
9. [Settlements](#9-settlements)
10. [Dealer Ledger & Credit](#10-dealer-ledger--credit)
11. [Inventory & Warehouse](#11-inventory--warehouse)
12. [Returns](#12-returns)
13. [CRM](#13-crm)
14. [Warranty](#14-warranty)
15. [Campaigns](#15-campaigns)
16. [Announcements & Messages](#16-announcements--messages)
17. [Attendance & GPS Tracking](#17-attendance--gps-tracking)
18. [Support Tickets](#18-support-tickets)
19. [Reports & Analytics](#19-reports--analytics)
20. [Personal IDs](#20-personal-ids)
21. [Settings & Notifications](#21-settings--notifications)
22. [Money Flow — End to End](#22-money-flow--end-to-end)
23. [Data Model (Tables)](#23-data-model-tables)
24. [Common Operations by Role](#24-common-operations-by-role)
25. [Glossary](#25-glossary)

---

## 1. What SDMS Is

SDMS is the **operating system of the sales force**. It connects the company,
its field sales team, its warehouse, and its dealers in one place so that:

- Sales Executives (SRs) can **place orders** for their dealers from the field.
- Managers can **approve** orders and track the team.
- The warehouse can **pack and dispatch** orders.
- Invoices are **auto-generated** on delivery.
- Payments are **collected and tracked** per dealer.
- Every sale is **auto-settled** between the company and the dealer.
- The whole company sees **one set of live numbers** via dashboards and reports.

The business sells **many manufacturers' products** (medical devices today;
germicidal wash, sanitizer, and more categories later). The system is designed
to stay category-agnostic so new product lines drop in without change.

**Currency:** Bangladeshi Taka (BDT, ৳).
**Market:** Bangladesh (mobile payments: bKash, Nagad, Rocket).

---

## 2. The Business Chain

```
 Manufacturer / Supplier (purchase_price)
        │
        ▼
  [KGSM / Your Company] (trade_price)   ← the distributor
        │
        ▼
      Dealer (dealer_price)
        │
        ▼
  Doctor / Hospital / Pharmacy / Retailer (mrp)
        │
        ▼
      End Customer / Patient
```

Each price tier is what the **next party down the chain pays**:

| Tier | Paid by | Meaning |
|---|---|---|
| `purchase_price` | Your company | What you pay the manufacturer |
| `trade_price` | Dealer | What the dealer pays your company |
| `dealer_price` | Retailer/pharmacy | What the retailer pays the dealer |
| `mrp` | End customer | Maximum Retail Price on the label |

### Margins

- **Company gross profit** per unit = `trade_price - purchase_price`
- **Dealer margin** per unit = `dealer_price - trade_price`

### Example

| Field | Value |
|---|---|
| purchase_price | 1000 BDT |
| trade_price | 2000 BDT |
| dealer_price | 2500 BDT |
| mrp | 2900 BDT |

- Company earns **1000/unit** (2000 − 1000).
- Dealer earns **500/unit** (2500 − 2000).

> **Critical rule:** `dealer_price` must always be **higher** than
> `trade_price`, otherwise the dealer loses money and the settlement shows a
> negative dealer margin.

---

## 3. Roles & Responsibilities

| Role | Short | What they do | Sees |
|---|---|---|---|
| `super_admin` | Owner | Full control over everything | All prices, all data |
| `admin` | Head of Ops | Day-to-day management | All prices, all data |
| `sales_manager` | RSM | Manages SRs / regions | Trade + dealer price |
| `area_manager` | ASM | Area-level SR management | Trade + dealer price |
| `sales_executive` | SR / TSO | Field rep: orders + collections | Trade price + MRP only |
| `warehouse` | Store keeper | Packs & dispatches orders | MRP only |
| `dealer` | Distributor/Stockist | Buys from company, sells to retail | Own dealer price + MRP |

### Role shortcuts (used in code)

- `isAdmin` = super_admin OR admin
- `isManager` = super_admin OR admin OR sales_manager
- `isAreaManager` = super_admin OR admin OR sales_manager OR area_manager
- `isSalesExec` = sales_executive only
- `isDealer` = dealer only

---

### How Roles Map to the Org Chart

The Org Chart page shows the **full intended company structure**, while the app
implements **7 login roles**. Each login role maps to a position in the chart:

```
Chairman
 └─ Managing Director
     └─ CEO
         ├─ Board of Directors
         │   ├─ National Sales Manager (NSM)      ─┐
         │   ├─ Marketing Director                 │
         │   ├─ Finance Director                   │  (not separate logins —
         │   └─ Supply Chain Director              │   folded into admin)
         └─ Regional Sales Manager (RSM)           ─┘→ sales_manager
             └─ District Manager (DM)                 ─┐
                 └─ Area Sales Manager (ASM)            │→ area_manager
                     └─ Territory Sales Officer (TSO)   │→ sales_executive
                         └─ Master Dealer               ─┘
                             └─ Sub Dealer               → dealer
                                 └─ Sub Agent             │
                                     └─ Retailer          │→ customers
                                         └─ Customer      ┘
```

| App role (login) | Org chart position | What it really means |
|---|---|---|
| `super_admin` | Chairman / MD / CEO | Owner — everything |
| `admin` | Director / NSM level | Head of operations — all data + approvals |
| `sales_manager` | RSM | Manages multiple areas/regions |
| `area_manager` | ASM (also covers DM) | Manages one area, supervises SRs |
| `sales_executive` | **TSO** (the field rep) | The person on the ground |
| `warehouse` | Supply Chain arm | Packs/dispatches, no pricing |
| `dealer` | **Dealer** (sub-dealer level) | Your customer/distributor |

The chart's **NSM / DM / RSM** titles are more granular than the app's roles —
the app collapses them: `sales_manager` covers NSM+RSM, `area_manager` covers
DM+ASM.

### SR vs Dealer — The Key Distinction

The single most important relationship in the system. **SR and Dealer sit on
opposite sides of your company.**

```
        YOUR COMPANY (distributor)
                │
    ┌───────────┴────────────┐
    │                        │
  EMPLOYEE                 CUSTOMER
  (sales_executive)        (dealer)
```

| | SR / TSO (`sales_executive`) | Dealer |
|---|---|---|
| Relationship | **Employee — inside the company** | **Independent business — outside the company** |
| Paid by | Salary + commission from your company | Their own profit (margin) |
| What they do | Places orders **for** dealers, collects payments **from** dealers, logs visits/attendance | Buys from you at trade price, resells to retail at dealer price |
| Money they earn | `commission` from the company | `dealer_price − trade_price` per unit |
| Prices they see | Trade price + MRP (**not** dealer price) | Own dealer price + MRP only |
| Debt tracking | Not tracked as credit | Credit/ledger per dealer |
| In the org chart | Above the dealer (sales chain) | Below the SR |

**One-line summary:** SR is your **sales force** (works for you, gets paid by
you); dealer is your **buyer** (buys from you, pays you). The SR's job is to
make the dealer order and pay; the dealer's job is to buy and sell on.

> **Note:** In the org chart the SR appears *above* the dealer, but that is the
> **sales chain, not authority**. The dealer is not the SR's subordinate — the
> SR simply *serves* that dealer's territory.

---

## 4. Pricing Model & Price Isolation

### What each role can see

| Role | purchase | trade | dealer | mrp |
|---|---|---|---|---|
| super_admin | ✔ | ✔ | ✔ | ✔ |
| admin | ✔ | ✔ | ✔ | ✔ |
| sales_manager | | ✔ | ✔ | ✔ |
| area_manager | | ✔ | ✔ | ✔ |
| sales_executive | | ✔ | | ✔ |
| warehouse | | | | ✔ |
| dealer | | | ✔ | ✔ |

### Why isolation matters

- An **SR knows trade price but not dealer price** — so the SR cannot demand a
  cut of the dealer's margin.
- A **dealer never sees purchase price** — so they can't know the company's
  true cost and margin.
- **Warehouse** needs no pricing at all.

The price a role sees is also the price their orders are priced at.

---

## 5. Master Data

### Products
- Fields: name, sku, barcode, category, brand, prices (purchase/trade/dealer/mrp),
  VAT %, warranty months, expiry flag, status (active/inactive/discontinued).
- Opening stock can be set at creation; the system creates an inventory record
  and a stock movement.
- Multi-brand supported: the `brand` field identifies the manufacturer.

### Dealers
- Fields: name, owner_name, mobile, phone, email, address, district, area,
  trade_license, bin_number, nid, GPS coords, credit_limit, current_due,
  payment_terms, assigned_sr_id, visit_frequency, status.
- Default credit limit: **50,000 BDT**.
- Dealers are linked to a login account by **email match**.

### Areas
- Districts/territories: name, code, district, division, manager_id.
- Users and dealers can be assigned to an area.

### Users
- Roles, area mapping, active/inactive.
- Default password when created: `Mediron@2025` (change on first login).
- Deactivated users are automatically signed out.

---

## 6. Order Lifecycle (Full Walkthrough)

```
 submitted → approved → packed → dispatched → delivered → completed
```

| Step | Who acts | What happens |
|---|---|---|
| **submitted** | SR or Dealer | Order placed via the catalog/cart page |
| **approved** | Manager | Sales manager approves (`approved_by`, `approved_at`) |
| **packed** | Warehouse | Goods picked & packed |
| **dispatched** | Warehouse | Order shipped |
| **delivered** | Warehouse | **Invoice auto-created, stock deducted, dealer ledger debited** |
| **completed** | Admin | Order closed |

Orders can be **cancelled** (by admin) while in submitted/approved/packed/dispatched.

### Placing an order

- **Dealer:** browses products at their `dealer_price`, adds to cart, places.
- **SR:** must select which dealer the order is **for**, then orders at
  `trade_price`. The order records `sr_id`, `dealer_id`, and `area_id`.

### Stock-aware availability

| Stock level | Shown as | Ship time |
|---|---|---|
| 0 | Out of Stock | — |
| ≤ 10 | Only X left | wait time shown |
| ≤ 25 | Low Stock | 3–5 days |
| > 25 | In Stock | 1–2 days |
| null (no record) | Assumed available | 1–2 days |

---

## 7. Invoicing

When an order is **delivered**, an invoice is auto-generated:

| Field | Value |
|---|---|
| invoice_number | `MED-xxxx` (e.g. MED-MSJ8H33I-JT8) |
| amount | sum of order items |
| total_amount | same as amount (VAT currently 0) |
| paid_amount | 0 |
| due_amount | full amount |
| status | `unpaid` |

### Invoice statuses

```
unpaid → partial → paid
```

(also `overdue` and `cancelled` exist in the schema)

### Who can create invoices manually

Only `super_admin`, `admin`, `sales_manager`.

### Who sees which invoices

- **Dealer:** only their own invoices.
- **SR:** only invoices for dealers assigned to them (`assigned_sr_id`).
- **Management:** all.

### Hierarchy visibility

The invoice page shows the approval/visibility chain:
`SR → ASM → RSM → NSM → Directors`.

---

## 8. Payments & Collections

### Payment methods (Bangladesh)

`cash`, `bank`, `cheque`, `bkash`, `nagad`, `rocket`, `card`, `other`.

### Recording a payment

1. A `payments` row is created (amount, method, date, collected_by, dealer).
2. Invoice `paid_amount` increases; `due_amount` decreases.
3. Invoice status becomes `partial` (or `paid` when fully cleared).
4. **Dealer ledger** gets a credit entry (balance decreases).
5. **Dealers.current_due** is reduced.

Overpayment is blocked (amount cannot exceed the due).

---

## 9. Settlements

When an invoice is **fully paid**, the system **automatically records** the
settlement split (no manual entry):

```
Total collected (from dealer) = invoice total (dealer_price × qty for dealer orders)
        │
        ├── Company share  = trade_price × qty
        └── Dealer margin  = total collected − company share
```

### Example: 10 units, trade 2000, dealer 2500

- Total collected = 25,000 BDT
- Company share = 20,000 BDT
- Dealer margin = 5,000 BDT

### Enforcement & stability

- One settlement per invoice — guaranteed by a unique database index, so an
  invoice can never be settled twice.
- The split is based on the **snapshotted `trade_price`** written onto each
  order line when the order is placed, so later catalog price edits never
  rewrite historical settlements or profit figures.
- Settlements are **only created for money actually received**: an unpaid or
  partially paid invoice is not settled (it simply appears as outstanding due).
- The settlement page is a **read-only auto ledger** — company share, dealer
  margins, total collected and outstanding are derived from the
  invoice/payment books and reconciled automatically on page load (legacy
  paid invoices are backfilled on first open).

### Price isolation notes on this screen

- Dealers never see company cost.
- SRs never see dealer purchase price.
- The info box explains the split rules to management.

---

## 10. Dealer Ledger & Credit

Every financial event for a dealer creates a **ledger entry**:

| Date | Type | Debit | Credit | Balance | Description |
|---|---|---|---|---|---|
| Aug 9 | invoice | 3000 | 0 | 3000 | Invoice MED-001 |
| Aug 10 | payment | 0 | 2000 | 1000 | Payment via cash |
| Aug 12 | payment | 0 | 1000 | 0 | Payment via bkash |

- **Debit** = dealer owes money (invoice issued).
- **Credit** = dealer paid (payment received).
- **Balance** = running outstanding.
- `dealers.current_due` is kept in sync with the latest balance.

### Credit limit

- `available = credit_limit − current_due`
- The dealer dashboard shows Credit Limit / Current Due / Available.

---

## 11. Inventory & Warehouse

### Stock records

Inventory is tracked per product (with optional batch/lot, expiry,
low-stock threshold).

### Stock movements

Every movement is logged:

- `in` — stock received / opening stock
- `out` — stock sold (order delivery)
- `transfer`, `damage`, `expiry`, `adjustment` — other changes

### Warehouse workflow

1. Pack approved orders (`approved → packed`).
2. Dispatch (`packed → dispatched`).
3. Delivery auto-deducts stock (FIFO across inventory records) and logs the
   `out` movement.

### Dashboard

The warehouse dashboard shows Total SKUs, Stock Value, Low Stock items, and
Pending Dispatch, plus per-product **In / Out** totals derived from stock
movements.

---

## 12. Returns

Dealers can return products with a reason:

- `wrong_product`, `damaged`, `expired`, `quality_issue`, `other`

Flow: `pending → approved / rejected` (and `replaced` / `refunded`).

Items are copied from the linked order; returned quantities are capped at the
ordered quantity. The return total = qty × unit price.

---

## 13. CRM

Tracks medical professionals for the sales team:

| Type | Example |
|---|---|
| doctor | Dr. Rahim Uddin (specialty: Cardiology) |
| hospital | Local hospital |
| pharmacy | Medicine shop |
| diagnostic | Diagnostic center |
| clinic | Small clinic |

SRs log **visits** to contacts: purpose, outcome, next visit date, GPS.
Dashboards use visits to compute "Visits Done".

---

## 14. Warranty

- Default warranty period: **365 days** from registration.
- Registration channels: QR scan, SMS, missed call, phone call.
- Missed calls auto-create **leads** (auto-filled phone in registration form).
- Product catalog includes Mediron glucose meters, BP monitors, and test strips
  (expandable to new categories/brands).
- Data falls back to CRM contacts if the warranties table has no matching row.

---

## 15. Campaigns

Marketing promotions:

- `discount` — percentage off
- `free_product` — buy X get Y free
- `bundle` — combo deal
- `coupon` — redeemable code
- `gift` — free gift
- `bonus` — extra units

Statuses: `draft`, `active`, `paused`, `completed`, `cancelled`.

---

## 16. Announcements & Messages

### Announcements
Management broadcasts to role groups:

- All Employees, Management Only, RSM/DM, ASM, TSOs, All Dealers.

Broadcast is **role-based**: each recipient gets a `notifications` row.

### Messages
1-to-1 messaging between internal staff (admins, managers, SRs, warehouse).
Messages are stored in the `messages` table.

---

## 17. Attendance & GPS Tracking

### Attendance
SRs check in with **GPS location** (lat/lng captured on check-in).
Status: present / absent / late / half_day / leave / holiday.

### GPS Tracking
Managers can view an SR's location history from `gps_tracking` records
(user, latitude, longitude, accuracy, recorded_at).

---

## 18. Support Tickets

Dealers/contacts raise tickets:

- Types: `complaint`, `warranty`, `replacement`, `service`, `general`
- Priority: `low`, `medium`, `high`, `urgent`
- Status: `open`, `in_progress`, `resolved`, `closed`, `cancelled`
- Ticket number auto-generated (`TKT-xxxx`).
- Threaded replies stored in `ticket_messages`.

---

## 19. Reports & Analytics

Nine report types (view on screen + CSV export):

| Report | Key data |
|---|---|
| Sales Report | Orders: #, dealer, amount, status, date |
| Dealer Report | Dealers: name, mobile, district, area, credit, due, status |
| Executive Report | Per SR: orders + revenue |
| Collection Report | Paid invoices |
| Outstanding Report | Unpaid / non-cancelled invoices |
| Stock Report | Product, qty, threshold, expiry |
| Product Performance | Units + revenue per product |
| Visit Report | SR, contact, date, purpose, outcome |
| Profit Report | Revenue − cost (cost = purchase_price × units) |

### Summary stats

MTD Revenue, MTD Collection, Outstanding, Active Dealers, MTD Orders,
Avg Order Value.

---

## 20. Personal IDs

Unique codes for SRs and dealers:

- `SR-xxxx` for sales representatives
- `DLR-xxxx` for dealers

Purpose:

- Orders are attributed to the correct person via the code.
- The code determines the **price tier** applied.
- Dealers can be matched to their account by code.

IDs are stored in the `personal_ids` table and can be deactivated/activated.

---

## 21. Settings & Notifications

### Notification preferences (per user)

- New order alerts (on)
- Payment received (on)
- Low stock warnings (on)
- Target achievement (off)

### Quick actions (role-gated)

| Action | Roles |
|---|---|
| Manage Users & Roles | super_admin, admin |
| Area Assignments | super_admin, admin |
| Dealer–SR Mapping | super_admin, admin, sales_manager, area_manager |
| Change Password | all |
| Audit Logs | super_admin, admin |

### Audit log

Every meaningful action can be recorded in `audit_log`
(user, action, table, record id, old/new values, IP, timestamp).

---

## 22. Money Flow — End to End

Using the example product (purchase 1000 / trade 2000 / dealer 2500 / mrp 2900)
and a 10-unit order:

```
1. DEALER orders 10 units @ dealer price 2,500  →  order total 25,000
2. MANAGER approves → WAREHOUSE packs → dispatches
3. DELIVERY:
     - invoice created for 25,000 (unpaid)
     - stock deducted (10 units out)
     - dealer ledger debited 25,000 → current_due = 25,000
4. SR collects payment from dealer:
     - payment of 25,000 recorded → approved
     - invoice → paid
     - ledger credited 25,000 → current_due = 0
5. SETTLEMENT auto-recorded on full payment, split of the 25,000 collected:
     - Company share  = 2,000 × 10 = 20,000   (the company's actual revenue)
     - Dealer margin  = 25,000 − 20,000 = 5,000
     (the 5,000 is the dealer's retained margin — their profit when they
      sell the units on to retail at 2,500+)
6. COMPANY profit check:
     - Company revenue share from dealer = 20,000
     - Cost to company                   = 1,000 × 10 = 10,000
     - Company gross profit              = 10,000
```

---

## 23. Data Model (Tables)

| Table | Purpose |
|---|---|
| `user_profiles` | Users (extends Supabase auth) + roles + areas |
| `areas` | Districts/territories |
| `products` | Catalog + 4 price tiers |
| `dealers` | Dealers/distributors + credit + assigned SR |
| `orders` | Order lifecycle |
| `order_items` | Lines of each order |
| `invoices` | Auto-generated on delivery |
| `payments` | Payment collections |
| `inventory` | Stock records (batch/expiry) |
| `stock_movements` | Every in/out/adjustment |
| `returns` / `return_items` | Return requests + lines |
| `targets` | Sales/collection targets per user/area |
| `commissions` | SR commission periods |
| `expenses` | Field expense claims |
| `crm_contacts` / `crm_visits` | Doctors/hospitals/pharmacies + visits |
| `attendance` | Check-in/out with GPS |
| `gps_tracking` | Location history |
| `campaigns` | Marketing promotions |
| `notifications` | Per-user announcements |
| `support_tickets` / `ticket_messages` | Support workflow |
| `messages` | 1-to-1 internal messaging |
| `dealer_ledger` | Running debit/credit/balance per dealer |
| `settlements` | Auto-settlement splits |
| `personal_ids` | SR/dealer codes |
| `warranties` / `missed_calls` | Warranty + lead capture |
| `audit_log` | Action trail |
| `documents` | Uploaded files (licenses, contracts) |

---

## 24. Common Operations by Role

### Dealer
1. Sign in (email must match your dealer record).
2. Place Order → pick products at your price → confirm.
3. Track order in My Orders.
4. Pay Now when you receive an invoice.

### Sales Executive (SR)
1. Check in (GPS).
2. Place Order **for a dealer** (at trade price).
3. Visit dealers/doctors and log visits in CRM.
4. Collect payments from your assigned dealers.

### Sales Manager
1. Approve submitted orders.
2. Watch team targets and collections on the dashboard.
3. Create invoices / record payments as needed.
4. Send announcements to your team.

### Warehouse
1. Pack approved orders.
2. Dispatch packed orders.
3. Monitor stock levels; log incoming stock as `in` movements.

### Admin / Super Admin
1. Manage users, areas, products, dealers.
2. Oversee orders end-to-end.
3. Record settlements.
4. Read reports and export CSVs.

---

## 25. Glossary

| Term | Meaning |
|---|---|
| SDMS | Sales & Distribution Management System |
| SR / TSO | Sales Executive / Territory Sales Officer (field rep) |
| ASM | Area Sales Manager |
| RSM | Regional Sales Manager |
| purchase_price | What the company pays the manufacturer |
| trade_price | What the dealer pays the company |
| dealer_price | What the retailer/pharmacy pays the dealer |
| mrp | Maximum Retail Price (label price to the patient) |
| Dealer margin | dealer_price − trade_price |
| Company share | trade_price (company's portion of a settlement) |
| Settlement | Splitting collected money between company and dealer |
| Credit limit | Maximum a dealer may owe (default 50,000 BDT) |
| Current due | What the dealer currently owes |
| Available | credit_limit − current_due |
| Ledger | Running record of debits/credits per dealer |
| bKash / Nagad / Rocket | Bangladeshi mobile-money wallets |
| BDT (৳) | Bangladeshi Taka |
