import { format, formatDistanceToNow, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays } from 'date-fns'

// Currency formatting (BDT)
export const formatCurrency = (amount, options = {}) => {
  const { decimals = 0, prefix = '৳ ' } = options
  if (amount === null || amount === undefined) return `${prefix}0`
  return `${prefix}${Number(amount).toLocaleString('en-BD', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

// Number formatting
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-BD')
}

// Date formatting
export const formatDate = (date, formatStr = 'dd MMM yyyy') => {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a')

export const formatRelative = (date) => {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// Date ranges
export const thisMonthRange = () => ({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
})

export const todayRange = () => ({
  start: startOfDay(new Date()),
  end: endOfDay(new Date()),
})

export const lastNDays = (n) => ({
  start: startOfDay(subDays(new Date(), n)),
  end: endOfDay(new Date()),
})

// Status colors
export const statusColor = (status) => {
  const colors = {
    draft: 'badge-gray',
    submitted: 'badge-info',
    approved: 'badge-success',
    packed: 'badge-warning',
    dispatched: 'badge-info',
    delivered: 'badge-success',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    pending: 'badge-warning',
    partial: 'badge-warning',
    paid: 'badge-success',
    overdue: 'badge-danger',
    active: 'badge-success',
    inactive: 'badge-gray',
    rejected: 'badge-danger',
    open: 'badge-info',
    in_progress: 'badge-warning',
    resolved: 'badge-success',
    closed: 'badge-gray',
    expired: 'badge-gray',
  }
  return colors[status] || 'badge-gray'
}

export const statusLabel = (status) => {
  if (!status) return '-'
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

// Generate invoice number
export const generateInvoiceNo = () => {
  const prefix = 'MED'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// Generate order number
export const generateOrderNo = () => {
  const prefix = 'ORD'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// Generate support ticket number
export const generateTicketNo = () => {
  const prefix = 'TKT'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

// Calculate percentage
export const calcPercent = (value, total) => {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

// Truncate text
export const truncate = (str, len = 50) => {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

// Debounce
export const debounce = (fn, delay = 300) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

// Local storage helpers
export const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key),
}

// ============================================================
// PRICE ISOLATION ENGINE
// Each role sees only their authorized price tier.
// ============================================================

// Price tiers mapped to product fields
export const PRICE_FIELDS = {
  PURCHASE: 'purchase_price',   // company cost — super_admin only
  TRADE: 'trade_price',         // trade price — admin, sales_manager
  DEALER: 'dealer_price',       // dealer price — dealer role
  MRP: 'mrp',                   // public — everyone
}

// Which price field each role can see
export const ROLE_PRICE_ACCESS = {
  super_admin:    ['purchase_price', 'trade_price', 'dealer_price', 'mrp'],
  admin:          ['purchase_price', 'trade_price', 'dealer_price', 'mrp'],
  sales_manager:  ['trade_price', 'dealer_price', 'mrp'],
  area_manager:   ['trade_price', 'dealer_price', 'mrp'],
  sales_executive: ['trade_price', 'mrp'],        // SR sees company price only, NOT dealer purchase price
  warehouse:      ['mrp'],
  dealer:         ['dealer_price', 'mrp'],        // dealer sees their own price + MRP
}

// Get the price field visible to a given role
export const getVisiblePriceField = (role) => {
  const access = ROLE_PRICE_ACCESS[role]
  if (!access || access.length === 0) return 'mrp'
  // Return the most privileged visible price
  if (access.includes('dealer_price')) return 'dealer_price'
  if (access.includes('trade_price')) return 'trade_price'
  if (access.includes('purchase_price')) return 'purchase_price'
  return 'mrp'
}

// Get display price for a product based on role
export const getPriceForRole = (product, role) => {
  const field = getVisiblePriceField(role)
  return product[field] || product.mrp || 0
}

// Filter product object to only include role-authorized fields
export const filterProductByRole = (product, role) => {
  const access = ROLE_PRICE_ACCESS[role] || ['mrp']
  const filtered = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand,
    image: product.image || product.image_url,
    stock: product.stock,
    status: product.status,
    warranty_months: product.warranty_months,
  }
  // Only include prices the role can see
  if (access.includes('purchase_price')) filtered.purchase_price = product.purchase_price
  if (access.includes('trade_price')) filtered.trade_price = product.trade_price
  if (access.includes('dealer_price')) filtered.dealer_price = product.dealer_price
  filtered.mrp = product.mrp
  return filtered
}

// Check if role can see a specific price field
export const canSeePrice = (role, priceField) => {
  const access = ROLE_PRICE_ACCESS[role] || []
  return access.includes(priceField)
}

// ============================================================
// PERSONAL ID SYSTEM
// Unique code per dealer/SR for order attribution
// ============================================================

// Generate personal ID: MED-XXXX format
export const generatePersonalId = (entityType = 'user') => {
  const prefix = entityType === 'dealer' ? 'DLR' : 'SR'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

// Calculate dealer margin (what dealer earns per unit)
export const calculateDealerMargin = (product) => {
  const dealerPrice = product.dealer_price || 0
  const tradePrice = product.trade_price || 0
  return dealerPrice - tradePrice
}

// ============================================================
// AUTO SETTLEMENT ENGINE
// When SR collects payment, auto-split between company and dealer
// ============================================================

// Calculate settlement breakdown for an order
export const calculateSettlement = (orderItems, products) => {
  let companyTotal = 0
  let dealerMarginTotal = 0
  let srCommissionTotal = 0

  const itemBreakdown = orderItems.map(item => {
    const product = products.find(p => p.id === item.product_id)
    if (!product) return null

    const qty = item.quantity
    const dealerPrice = product.dealer_price || 0
    const tradePrice = product.trade_price || 0
    const purchasePrice = product.purchase_price || 0

    const itemDealerMargin = (dealerPrice - tradePrice) * qty  // dealer earns this
    const itemCompanyShare = tradePrice * qty                  // company gets this
    const itemProfit = (tradePrice - purchasePrice) * qty      // company profit

    companyTotal += itemCompanyShare
    dealerMarginTotal += itemDealerMargin

    return {
      product_id: item.product_id,
      product_name: product.name,
      quantity: qty,
      dealer_price: dealerPrice,
      trade_price: tradePrice,
      dealer_margin: itemDealerMargin,
      company_share: itemCompanyShare,
      unit_margin: dealerPrice - tradePrice,
    }
  }).filter(Boolean)

  return {
    items: itemBreakdown,
    company_total: companyTotal,
    dealer_margin_total: dealerMarginTotal,
    grand_total: companyTotal + dealerMarginTotal,
    item_count: orderItems.length,
  }
}

// Generate settlement record for database
export const generateSettlementRecord = (order, products) => {
  const settlement = calculateSettlement(order.items || [], products)
  return {
    order_id: order.id,
    dealer_id: order.dealer_id,
    sr_id: order.sr_id,
    company_amount: settlement.company_total,
    dealer_margin_amount: settlement.dealer_margin_total,
    total_collected: settlement.grand_total,
    item_breakdown: settlement.items,
    settled_at: new Date().toISOString(),
    status: 'auto_settled',
  }
}

// Format settlement for display
export const formatSettlementSummary = (settlement) => {
  return {
    company_share: formatCurrency(settlement.company_total),
    dealer_earns: formatCurrency(settlement.dealer_margin_total),
    total: formatCurrency(settlement.grand_total),
    label: `Company ${formatCurrency(settlement.company_total)} + Dealer margin ${formatCurrency(settlement.dealer_margin_total)}`
  }
}
