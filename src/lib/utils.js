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
