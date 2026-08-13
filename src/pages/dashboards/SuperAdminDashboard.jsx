import { useState, useEffect } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import OrgHierarchy from '../../components/OrgChart/OrgHierarchy'
import { formatCurrency, formatNumber, calcPercent, todayRange, thisMonthRange, buildProductsMap, orderCompanyShare } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  MdAttachMoney, MdShoppingCart, MdPeople, MdInventory2,
  MdTrendingUp, MdWarning, MdStore, MdAssessment,
  MdNotificationsActive, MdLocalShipping, MdQrCode, MdMyLocation,
  MdCampaign, MdChat, MdArrowForward, MdCheckCircle
} from 'react-icons/md'

export default function SuperAdminDashboard() {
  const [showOrgChart, setShowOrgChart] = useState(false)
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [dealers, setDealers] = useState([])
  const [inventory, setInventory] = useState([])
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [ordersData, invoicesData, dealersData, invData, usersData, paymentsData, productsData] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getInvoices().catch(() => []),
          api.getDealers().catch(() => []),
          api.getInventory().catch(() => []),
          api.getUsers().catch(() => []),
          api.getPayments().catch(() => []),
          api.getProducts().catch(() => []),
        ])
        setOrders(ordersData)
        setInvoices(invoicesData)
        setDealers(dealersData)
        setInventory(invData)
        setUsers(usersData)
        setPayments(paymentsData)
        setProducts(productsData)
      } catch (err) {
        console.error('Dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Compute stats from real data
  const { start: todayStart, end: todayEnd } = todayRange()
  const { start: monthStart, end: monthEnd } = thisMonthRange()
  const todayStartISO = todayStart.toISOString()
  const todayEndISO = todayEnd.toISOString()
  const monthStartISO = monthStart.toISOString()
  const monthEndISO = monthEnd.toISOString()

  const todayOrders = orders.filter(o => o.created_at >= todayStartISO && o.created_at <= todayEndISO && o.status !== 'cancelled' && o.status !== 'draft' && o.status !== 'submitted')
  const monthOrders = orders.filter(o => o.created_at >= monthStartISO && o.created_at <= monthEndISO && o.status !== 'cancelled' && o.status !== 'draft' && o.status !== 'submitted')

  // Sales/Revenue = the company's actual revenue share (Σ trade_price × qty).
  // Order totals are billed at dealer price and include the dealer's margin, so
  // they are not company revenue.
  const productsMap = buildProductsMap(products)
  const todaySales = todayOrders.reduce((sum, o) => sum + orderCompanyShare(o, productsMap), 0)
  const monthlySales = monthOrders.reduce((sum, o) => sum + orderCompanyShare(o, productsMap), 0)
  // Inventory is valued at cost (purchase price), not retail MRP.
  const stockValue = inventory.reduce((sum, item) => {
    const qty = item.quantity || item.stock || 0
    const price = productsMap[item.product_id]?.purchase_price || 0
    return sum + (qty * price)
  }, 0)
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'unpaid' || inv.status === 'partial' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + ((inv.due_amount ?? inv.total_amount) || inv.amount || 0), 0)
  const collectionsToday = payments
    .filter(p =>
      p.status === 'approved' &&
      (p.payment_date === todayStartISO.split('T')[0] || (p.created_at >= todayStartISO && p.created_at <= todayEndISO))
    )
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const activeDealers = dealers.filter(d => d.status === 'active').length
  const salesTeam = users.filter(u => u.role === 'sales_executive' || u.role === 'area_manager' || u.role === 'sales_manager').length

  const STATS = [
    { label: 'Today Sales', value: formatCurrency(todaySales), icon: MdAttachMoney, color: 'green' },
    { label: 'Monthly Sales', value: formatCurrency(monthlySales), icon: MdTrendingUp, color: 'brand' },
    { label: 'Stock Value', value: formatCurrency(stockValue), icon: MdInventory2, color: 'purple' },
    { label: 'Total Outstanding', value: formatCurrency(totalOutstanding), icon: MdWarning, color: 'amber' },
    { label: 'Collections Today', value: formatCurrency(collectionsToday), icon: MdAttachMoney, color: 'blue' },
    { label: 'Total Orders', value: formatNumber(orders.length), icon: MdShoppingCart, color: 'purple' },
    { label: 'Active Dealers', value: formatNumber(activeDealers), icon: MdStore, color: 'brand' },
    { label: 'Sales Team', value: formatNumber(salesTeam), icon: MdPeople, color: 'blue' },
  ]

  // Compute low stock alerts from real inventory
  const lowStockItems = inventory.filter(item => {
    const stock = item.quantity || item.stock || 0
    const min = item.low_stock_threshold || item.min_quantity || item.reorder_level || 0
    return min > 0 && stock < min
  })

  // Compute overdue invoices for alerts
  const overdueInvoices = invoices.filter(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false
    if (!inv.due_date) return false
    return new Date(inv.due_date) < new Date()
  })

  // Build alerts from real data
  const ALERTS = [
    ...lowStockItems.slice(0, 3).map(item => ({
      type: 'low_stock',
      message: `${item.product?.name || item.name || 'Unknown'} (${item.product?.sku || item.sku || ''}) — only ${item.quantity || item.stock || 0} units left`,
      severity: (item.quantity || item.stock || 0) < 10 ? 'critical' : 'warning'
    })),
    ...overdueInvoices.slice(0, 3).map(inv => ({
      type: 'due',
      message: `${inv.dealer?.name || 'Unknown'} — ${formatCurrency(inv.total_amount || inv.amount || 0)} overdue`,
      severity: 'critical'
    })),
  ]

  // Compute top products from order items
  const productSales = {}
  orders.forEach(o => {
    if (o.status === 'cancelled') return
    ;(o.items || []).forEach(item => {
      const name = item.product?.name || item.product_name || 'Unknown'
      const qty = item.quantity || 0
      const price = item.unit_price || item.price || 0
      if (!productSales[name]) productSales[name] = { name, qty: 0, revenue: 0 }
      productSales[name].qty += qty
      productSales[name].revenue += qty * price
    })
  })
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Compute area performance from dealers + orders
  const areaMap = {}
   dealers.forEach(d => {
     const area = d.area || d.area_name || d.territory || 'Unassigned'
     if (!areaMap[area]) areaMap[area] = { area, dealers: 0, actual: 0 }
     areaMap[area].dealers++
   })
   orders.forEach(o => {
     if (['cancelled', 'draft', 'submitted'].includes(o.status)) return
     const dName = o.dealer?.name || o.dealer_name
     const dealer = dealers.find(dd => (dd.name === dName) || (dd.id === o.dealer_id))
     const area = dealer?.area || dealer?.area_name || dealer?.territory || 'Unassigned'
     if (!areaMap[area]) areaMap[area] = { area, dealers: 0, actual: 0 }
     areaMap[area].actual += (o.total_amount || o.amount || 0)
   })
  const topAreaActual = Math.max(...Object.values(areaMap).map(a => a.actual), 0) || 1
  const AREA_PERFORMANCE = Object.values(areaMap)
    .map(a => ({ ...a, percent: a.actual > 0 ? Math.min(Math.round((a.actual / topAreaActual) * 100), 100) : 0 }))
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 6)

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { icon: MdCampaign, label: 'Announcements', path: '/announcements', color: 'bg-purple-50 text-purple-600' },
          { icon: MdChat, label: 'Messages', path: '/messages', color: 'bg-blue-50 text-blue-600' },
          { icon: MdLocalShipping, label: 'Order Tracker', path: '/order-tracker', color: 'bg-emerald-50 text-emerald-600' },
          { icon: MdMyLocation, label: 'GPS Tracking', path: '/gps-tracking', color: 'bg-amber-50 text-amber-600' },
          { icon: MdQrCode, label: 'Warranty', path: '/warranty', color: 'bg-rose-50 text-rose-600' },
          { icon: MdPeople, label: 'Org Chart', path: '/org-chart', color: 'bg-indigo-50 text-indigo-600' },
        ].map((action, i) => {
          const Icon = action.icon
          return (
            <a
              key={i}
              href={action.path}
              className="card p-3 flex flex-col items-center gap-1.5 card-hover relative"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color}`}>
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{action.label}</span>
            </a>
          )
        })}
      </div>

      {/* Alerts Section */}
      {ALERTS.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MdNotificationsActive className="text-amber-500" size={18} />
              Alerts & Notifications
            </h3>
            <span className="badge-danger text-[10px]">{ALERTS.length} active</span>
          </div>
          <div className="space-y-2">
            {ALERTS.map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg ${
                alert.severity === 'critical' ? 'bg-red-50' :
                alert.severity === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <p className="text-xs text-gray-700 flex-1">{alert.message}</p>
                <span className={`badge text-[9px] ${
                  alert.severity === 'critical' ? 'badge-danger' :
                  alert.severity === 'warning' ? 'badge-warning' : 'badge-info'
                }`}>{alert.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-500">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-50 text-brand-600 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.qty} units sold</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{formatCurrency(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Area Performance + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Area Performance</h3>
          {AREA_PERFORMANCE.length === 0 ? (
            <p className="text-xs text-gray-500">No area data yet</p>
          ) : (
            <div className="space-y-4">
              {AREA_PERFORMANCE.map((a, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{a.area}</span>
                      <span className="text-[10px] text-gray-400">({a.dealers} dealers)</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(a.actual)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        a.percent >= 90 ? 'bg-emerald-500' : a.percent >= 70 ? 'bg-amber-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${a.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{a.dealers} dealers</span>
                    <span className={`text-[10px] font-semibold ${
                      a.percent >= 90 ? 'text-emerald-600' : a.percent >= 70 ? 'text-amber-600' : 'text-red-500'
                    }`}>Top area: {a.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <RecentOrdersTable />
      </div>

      {/* Org Chart Toggle */}
      <div className="card p-5">
        <button
          onClick={() => setShowOrgChart(!showOrgChart)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="text-sm font-bold text-gray-900">Organizational Hierarchy</h3>
          <span className="text-xs font-semibold text-brand-600">
            {showOrgChart ? 'Hide' : 'Show'} Chart
          </span>
        </button>
        {showOrgChart && (
          <div className="mt-4">
            <OrgHierarchy />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <a href="/orders" className="btn-primary text-xs">
            <MdShoppingCart size={14} /> New Order
          </a>
          <a href="/dealers" className="btn-secondary text-xs">
            <MdStore size={14} /> Add Dealer
          </a>
          <a href="/inventory" className="btn-secondary text-xs">
            <MdInventory2 size={14} /> Manage Stock
          </a>
          <a href="/announcements" className="btn-secondary text-xs">
            <MdCampaign size={14} /> Send Announcement
          </a>
          <a href="/warranty" className="btn-secondary text-xs">
            <MdQrCode size={14} /> Warranty Check
          </a>
          <a href="/reports" className="btn-secondary text-xs">
            <MdAssessment size={14} /> View Reports
          </a>
        </div>
      </div>
    </div>
  )
}
