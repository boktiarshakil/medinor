// Demo mode — local mock data, no Supabase needed.
// Activated by clicking "Demo" on login. Bypasses auth entirely.

export const DEMO_FLAG = 'medinor_demo'

export const demoUser = {
  id: 'demo-001',
  email: 'demo@kgsmgroup.com',
  full_name: 'Demo Admin',
  role: 'super_admin',
  phone: '+8801700000000',
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
}

export const demoUsers = [
  demoUser,
  { id: 'demo-002', email: 'sr@kgsmgroup.com', full_name: 'Rahim Uddin', role: 'sales_executive', phone: '+8801711111111', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-003', email: 'manager@kgsmgroup.com', full_name: 'Karim Ahmed', role: 'sales_manager', phone: '+8801722222222', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-004', email: 'dealer@kgsmgroup.com', full_name: 'Medicine Point', role: 'dealer', phone: '+8801733333333', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'demo-005', email: 'warehouse@kgsmgroup.com', full_name: 'Hasan Ali', role: 'warehouse', phone: '+8801744444444', is_active: true, created_at: '2025-01-01T00:00:00Z' },
]

export const demoProducts = [
  { id: '1', name: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', category: 'Glucose Monitoring', purchase: 550, trade: 650, dealer: 700, mrp: 750, stock: 70, status: 'active', image: '🩸' },
  { id: '2', name: 'Mediron Blood Glucose Test Strip (25 pcs)', sku: 'MED-TST-025', category: 'Consumable', purchase: 220, trade: 280, dealer: 300, mrp: 350, stock: 150, status: 'active', image: '🧪' },
  { id: '3', name: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', category: 'Consumable', purchase: 400, trade: 500, dealer: 550, mrp: 600, stock: 20, status: 'active', image: '🧪' },
  { id: '4', name: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', category: 'Consumable', purchase: 120, trade: 160, dealer: 180, mrp: 200, stock: 80, status: 'active', image: '💉' },
  { id: '5', name: 'Mediron Examination Gloves (Large)', sku: 'MED-GLV-L', category: 'Disposable', purchase: 240, trade: 300, dealer: 320, mrp: 350, stock: 100, status: 'active', image: '🧤' },
  { id: '6', name: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', category: 'BP Monitor', purchase: 950, trade: 1200, dealer: 1300, mrp: 1500, stock: 45, status: 'active', image: '🩺' },
  { id: '7', name: 'Mediron Advance BP Monitor (MEDI 447)', sku: 'MED-BP-447', category: 'BP Monitor', purchase: 1100, trade: 1400, dealer: 1500, mrp: 1800, stock: 35, status: 'active', image: '🩺' },
  { id: '8', name: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', category: 'BP Monitor', purchase: 1200, trade: 1500, dealer: 1650, mrp: 2000, stock: 30, status: 'active', image: '🩺' },
]

export const demoDealers = [
  { id: '1', name: 'Medicine Point', owner: 'Dr. Aminul Islam', phone: '+8801711110001', email: 'mp@example.com', area: 'Dhaka North', address: '78 Elephant Road, Dhaka', creditLimit: 50000, outstanding: 15400, status: 'active', since: '2023-03-15' },
  { id: '2', name: 'Lazz Pharma', owner: 'Mr. Rafiq', phone: '+8801711110002', email: 'lazz@example.com', area: 'Dhaka South', address: '23 Nawabpur Road, Dhaka', creditLimit: 80000, outstanding: 8750, status: 'active', since: '2022-08-20' },
  { id: '3', name: 'HealthCare Ltd', owner: 'Ms. Nusrat', phone: '+8801711110003', email: 'hc@example.com', area: 'Chattogram', address: '45 Agrabad C/A, Chattogram', creditLimit: 100000, outstanding: 22300, status: 'active', since: '2021-01-10' },
  { id: '4', name: 'Central Pharmacy', owner: 'Mr. Sajid', phone: '+8801711110004', email: 'cp@example.com', area: 'Rajshahi', address: '12 Shaheb Bazar, Rajshahi', creditLimit: 40000, outstanding: 5600, status: 'active', since: '2024-02-01' },
  { id: '5', name: 'Square Hospital', owner: 'Mr. Habib', phone: '+8801711110005', email: 'square@example.com', area: 'Dhaka North', address: '188 Panthapath, Dhaka', creditLimit: 200000, outstanding: 31200, status: 'active', since: '2020-06-01' },
  { id: '6', name: 'Labaid Diagnostic', owner: 'Dr. Fatima', phone: '+8801711110006', email: 'labaid@example.com', area: 'Dhaka South', address: '1 Dhanmondi, Dhaka', creditLimit: 120000, outstanding: 0, status: 'active', since: '2022-11-15' },
  { id: '7', name: 'Khulna Medical', owner: 'Mr. Sohel', phone: '+8801711110007', email: 'km@example.com', area: 'Khulna', address: '50 KDA Avenue, Khulna', creditLimit: 60000, outstanding: 45000, status: 'inactive', since: '2023-07-20' },
]

export const demoOrders = [
  { id: '1', number: 'ORD-20250115-001', dealer: 'Medicine Point', sr: 'Rahim Uddin', amount: 15400, items: 3, status: 'delivered', date: '2025-01-15T10:30:00Z', area: 'Dhaka North' },
  { id: '2', number: 'ORD-20250114-002', dealer: 'Lazz Pharma', sr: 'Rahim Uddin', amount: 8750, items: 2, status: 'pending', date: '2025-01-14T14:20:00Z', area: 'Dhaka South' },
  { id: '3', number: 'ORD-20250114-003', dealer: 'HealthCare Ltd', sr: 'Karim Ahmed', amount: 22300, items: 5, status: 'dispatched', date: '2025-01-14T09:15:00Z', area: 'Chattogram' },
  { id: '4', number: 'ORD-20250113-004', dealer: 'Central Pharmacy', sr: 'Rahim Uddin', amount: 5600, items: 1, status: 'approved', date: '2025-01-13T16:45:00Z', area: 'Rajshahi' },
  { id: '5', number: 'ORD-20250112-005', dealer: 'Square Hospital', sr: 'Karim Ahmed', amount: 31200, items: 7, status: 'completed', date: '2025-01-12T11:00:00Z', area: 'Dhaka North' },
  { id: '6', number: 'ORD-20250112-006', dealer: 'Labaid Diagnostic', sr: 'Rahim Uddin', amount: 18900, items: 4, status: 'packed', date: '2025-01-12T13:30:00Z', area: 'Dhaka South' },
  { id: '7', number: 'ORD-20250111-007', dealer: 'Medicine Point', sr: 'Karim Ahmed', amount: 42100, items: 8, status: 'submitted', date: '2025-01-11T10:00:00Z', area: 'Dhaka North' },
  { id: '8', number: 'ORD-20250110-008', dealer: 'Khulna Medical', sr: 'Rahim Uddin', amount: 9800, items: 2, status: 'draft', date: '2025-01-10T15:20:00Z', area: 'Khulna' },
  { id: '9', number: 'ORD-20250109-009', dealer: 'HealthCare Ltd', sr: 'Karim Ahmed', amount: 67500, items: 12, status: 'delivered', date: '2025-01-09T08:45:00Z', area: 'Chattogram' },
  { id: '10', number: 'ORD-20250108-010', dealer: 'Square Hospital', sr: 'Rahim Uddin', amount: 28400, items: 6, status: 'cancelled', date: '2025-01-08T12:10:00Z', area: 'Dhaka North' },
]

export const demoInvoices = [
  { id: '1', number: 'MED-A1B2C3', dealer: 'Medicine Point', amount: 15400, paid: 15400, due: 0, status: 'paid', date: '2025-01-15', dueDate: '2025-02-14' },
  { id: '2', number: 'MED-D4E5F6', dealer: 'Lazz Pharma', amount: 8750, paid: 5000, due: 3750, status: 'partial', date: '2025-01-14', dueDate: '2025-02-13' },
  { id: '3', number: 'MED-G7H8I9', dealer: 'HealthCare Ltd', amount: 22300, paid: 0, due: 22300, status: 'unpaid', date: '2025-01-14', dueDate: '2025-02-13' },
  { id: '4', number: 'MED-J1K2L3', dealer: 'Central Pharmacy', amount: 5600, paid: 0, due: 5600, status: 'overdue', date: '2025-01-01', dueDate: '2025-01-31' },
  { id: '5', number: 'MED-M4N5O6', dealer: 'Square Hospital', amount: 31200, paid: 31200, due: 0, status: 'paid', date: '2025-01-12', dueDate: '2025-02-11' },
  { id: '6', number: 'MED-P7Q8R9', dealer: 'Labaid Diagnostic', amount: 18900, paid: 10000, due: 8900, status: 'partial', date: '2025-01-10', dueDate: '2025-02-09' },
  { id: '7', number: 'MED-S1T2U3', dealer: 'Khulna Medical', amount: 45000, paid: 0, due: 45000, status: 'overdue', date: '2024-12-15', dueDate: '2025-01-14' },
]

export const demoInventory = [
  { id: '1', product: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', warehouse: 'Dhaka Main', stock: 70, reorderLevel: 20, status: 'in_stock' },
  { id: '2', product: 'Mediron Blood Glucose Test Strip (25 pcs)', sku: 'MED-TST-025', warehouse: 'Dhaka Main', stock: 150, reorderLevel: 50, status: 'in_stock' },
  { id: '3', product: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', warehouse: 'Dhaka Main', stock: 20, reorderLevel: 30, status: 'low_stock' },
  { id: '4', product: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', warehouse: 'Dhaka Main', stock: 80, reorderLevel: 25, status: 'in_stock' },
  { id: '5', product: 'Mediron Examination Gloves (Large)', sku: 'MED-GLV-L', warehouse: 'Dhaka Main', stock: 100, reorderLevel: 40, status: 'in_stock' },
  { id: '6', product: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', warehouse: 'Dhaka Main', stock: 45, reorderLevel: 15, status: 'in_stock' },
  { id: '7', product: 'Mediron Advance BP Monitor (MEDI 447)', warehouse: 'Dhaka Main', sku: 'MED-BP-447', stock: 35, reorderLevel: 10, status: 'in_stock' },
  { id: '8', product: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', warehouse: 'Dhaka Main', stock: 30, reorderLevel: 10, status: 'in_stock' },
  { id: '9', product: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', warehouse: 'Chattogram Hub', stock: 5, reorderLevel: 10, status: 'critical' },
]

export const demoReturns = [
  { id: '1', number: 'RET-001', dealer: 'Medicine Point', product: 'Mediron Blood Glucose Test Strip (50 pcs)', qty: 5, reason: 'Damaged packaging', status: 'pending', date: '2025-01-14', amount: 2750 },
  { id: '2', number: 'RET-002', dealer: 'Lazz Pharma', product: 'Mediron Examination Gloves (Large)', qty: 10, reason: 'Wrong size ordered', status: 'approved', date: '2025-01-12', amount: 3000 },
  { id: '3', number: 'RET-003', dealer: 'Central Pharmacy', product: 'Mediron Automatic BP Monitor (MEDI 589)', qty: 1, reason: 'Defective unit', status: 'completed', date: '2025-01-10', amount: 1200 },
  { id: '4', number: 'RET-004', dealer: 'Khulna Medical', product: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', qty: 20, reason: 'Near expiry', status: 'rejected', date: '2025-01-08', amount: 3200 },
]

export const demoCRM = [
  { id: '1', dealer: 'Medicine Point', lastContact: '2025-01-15', nextFollowup: '2025-01-22', status: 'hot', notes: 'Interested in bulk BP monitor order', owner: 'Rahim Uddin' },
  { id: '2', dealer: 'Lazz Pharma', lastContact: '2025-01-14', nextFollowup: '2025-01-28', status: 'warm', notes: 'Payment pending since Dec', owner: 'Rahim Uddin' },
  { id: '3', dealer: 'HealthCare Ltd', lastContact: '2025-01-10', nextFollowup: '2025-01-17', status: 'hot', notes: 'New product inquiry', owner: 'Karim Ahmed' },
  { id: '4', dealer: 'Khulna Medical', lastContact: '2024-12-20', nextFollowup: '2025-01-05', status: 'cold', notes: 'Inactive — needs visit', owner: 'Rahim Uddin' },
  { id: '5', dealer: 'Labaid Diagnostic', lastContact: '2025-01-13', nextFollowup: '2025-01-20', status: 'warm', notes: 'Contract renewal due', owner: 'Karim Ahmed' },
]

export const demoAreas = [
  { id: '1', name: 'Dhaka North', manager: 'Karim Ahmed', target: 2000000, actual: 1850000, dealers: 45 },
  { id: '2', name: 'Dhaka South', manager: 'Rahim Uddin', target: 1800000, actual: 1620000, dealers: 38 },
  { id: '3', name: 'Chattogram', manager: 'Sohel Rana', target: 1200000, actual: 1080000, dealers: 28 },
  { id: '4', name: 'Rajshahi', manager: 'Nabil Khan', target: 800000, actual: 640000, dealers: 18 },
  { id: '5', name: 'Khulna', manager: 'Tanvir Hasan', target: 600000, actual: 420000, dealers: 15 },
]

// Simulate async fetch (matches Supabase call shape)
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export const demoApi = {
  async getCurrentUser() {
    await delay(200)
    const flag = localStorage.getItem(DEMO_FLAG)
    return flag ? demoUser : null
  },
  async signIn() {
    await delay(300)
    localStorage.setItem(DEMO_FLAG, '1')
    return demoUser
  },
  async signOut() {
    await delay(100)
    localStorage.removeItem(DEMO_FLAG)
  },
  async getOrders() { await delay(250); return demoOrders },
  async getProducts() { await delay(200); return demoProducts },
  async getDealers() { await delay(200); return demoDealers },
  async getInvoices() { await delay(200); return demoInvoices },
  async getInventory() { await delay(200); return demoInventory },
  async getReturns() { await delay(200); return demoReturns },
  async getCRM() { await delay(200); return demoCRM },
  async getAreas() { await delay(200); return demoAreas },
  async getUsers() { await delay(200); return demoUsers },
}

export const isDemo = () => localStorage.getItem(DEMO_FLAG) === '1'
