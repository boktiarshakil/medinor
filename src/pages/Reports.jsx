import { useState, useEffect } from 'react'
import { formatCurrency, formatNumber } from '../lib/utils'
import { MdFileDownload, MdAssessment, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import BlurredValue from '../components/BlurredValue'

const REPORT_CARDS = [
  { title: 'Sales Report', description: 'Detailed sales by period, area, product, and executive', icon: '📊', color: 'bg-blue-50 text-blue-600' },
  { title: 'Dealer Report', description: 'Dealer performance, outstanding dues, and order history', icon: '🏪', color: 'bg-emerald-50 text-emerald-600' },
  { title: 'Executive Report', description: 'SR/MPO performance, visits, and target achievement', icon: '👤', color: 'bg-purple-50 text-purple-600' },
  { title: 'Collection Report', description: 'Payment collections by method, area, and period', icon: '💰', color: 'bg-amber-50 text-amber-600' },
  { title: 'Outstanding Report', description: 'All unpaid invoices and overdue accounts', icon: '⚠️', color: 'bg-red-50 text-red-600' },
  { title: 'Stock Report', description: 'Current stock levels, movements, and valuation', icon: '📦', color: 'bg-cyan-50 text-cyan-600' },
  { title: 'Product Performance', description: 'Best and worst performing products', icon: '📈', color: 'bg-indigo-50 text-indigo-600' },
  { title: 'Visit Report', description: 'Field visit tracking and coverage analysis', icon: '📍', color: 'bg-pink-50 text-pink-600' },
  { title: 'Profit Report', description: 'Revenue, cost, and profit margins', icon: '💹', color: 'bg-teal-50 text-teal-600' },
  { title: 'COD Requests', description: 'Cash-on-delivery orders from public customers, with processing status', icon: '🛒', color: 'bg-brand-50 text-brand-600' },
]

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataCache, setDataCache] = useState({ orders: [], invoices: [], dealers: [], inventory: [], products: [], users: [], visits: [], codOrders: [] })
  const [viewReport, setViewReport] = useState(null)

  const downloadCSV = (filename, header, rows) => {
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeOrders = dataCache.orders.filter(o => o.status !== 'cancelled' && o.status !== 'draft')

  const getReportRows = (report) => {
    const { orders, invoices, dealers, inventory, products, users, visits } = dataCache
    const userMap = {}
    users.forEach(u => { userMap[u.id] = u.full_name || u.email })
    switch (report.title) {
      case 'Sales Report':
        return {
          headers: ['Order #', 'Dealer', 'Amount', 'Status', 'Date'],
          rows: activeOrders.map(o => [o.order_number, o.dealer?.name || '', o.net_amount ?? o.total_amount ?? 0, o.status, o.created_at]),
        }
      case 'Dealer Report':
        return {
          headers: ['Name', 'Mobile', 'District', 'Area', 'Credit Limit', 'Current Due', 'Status'],
          rows: dealers.map(d => [d.name, d.mobile, d.district, d.area, d.credit_limit, d.current_due, d.status]),
        }
      case 'Executive Report': {
        const bySr = {}
        activeOrders.forEach(o => {
          const key = o.sr_id || 'unassigned'
          bySr[key] = bySr[key] || { count: 0, revenue: 0 }
          bySr[key].count += 1
          bySr[key].revenue += o.net_amount || o.total_amount || 0
        })
        return {
          headers: ['Executive', 'Orders', 'Revenue'],
          rows: Object.entries(bySr).map(([id, v]) => [userMap[id] || 'Unassigned', v.count, v.revenue]),
        }
      }
      case 'Collection Report':
        return {
          headers: ['Invoice #', 'Dealer', 'Paid', 'Status'],
          rows: invoices
            .filter(i => (i.paid_amount || 0) > 0)
            .map(i => [i.invoice_number, i.dealer?.name || '', i.paid_amount || 0, i.status]),
        }
      case 'Outstanding Report':
        return {
          headers: ['Invoice #', 'Dealer', 'Amount', 'Paid', 'Due', 'Status'],
          rows: invoices
            .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
            .map(i => [i.invoice_number, i.dealer?.name || '', i.total_amount || 0, i.paid_amount || 0, i.due_amount || i.total_amount || 0, i.status]),
        }
      case 'Stock Report':
        return {
          headers: ['Product', 'Quantity', 'Low Stock Threshold', 'Expiry'],
          rows: inventory.map(i => [i.product?.name || '', i.quantity || 0, i.low_stock_threshold || 0, i.expiry_date]),
        }
      case 'Product Performance': {
        const prodMap = {}
        activeOrders.forEach(o => (o.items || []).forEach(it => {
          const pid = it.product_id
          prodMap[pid] = prodMap[pid] || { units: 0, revenue: 0 }
          prodMap[pid].units += it.quantity || 0
          prodMap[pid].revenue += it.total_price || it.quantity * it.unit_price || 0
        }))
        return {
          headers: ['Product', 'Units Sold', 'Revenue'],
          rows: Object.entries(prodMap).map(([pid, v]) => {
            const p = products.find(pr => pr.id === pid)
            return [p?.name || pid, v.units, v.revenue]
          }).sort((a, b) => b[2] - a[2]),
        }
      }
      case 'Visit Report':
        return {
          headers: ['SR', 'Contact', 'Date', 'Purpose', 'Outcome'],
          rows: visits.map(v => [userMap[v.sr_id] || v.sr_id, v.contact?.name || v.contact_name || '—', v.visit_date, v.purpose || '—', v.outcome || '—']),
        }
      case 'Profit Report': {
        // Company profit = (trade_price − purchase_price) × units. The dealer's
        // margin (dealer_price − trade_price) is not company profit — the full
        // invoiced revenue (dealer price × qty) includes the dealer's margin, so
        // profit must be computed on the trade-price share the company keeps.
        const itemMap = {}
        activeOrders.forEach(o => (o.items || []).forEach(it => {
          const pid = it.product_id
          const p = products.find(pr => pr.id === pid)
          if (!p) return
          const qty = it.quantity || 0
          const trade = p.trade_price || 0
          const purchase = p.purchase_price || 0
          if (!itemMap[pid]) itemMap[pid] = { name: p.name || pid, units: 0, revenue: 0, tradeValue: 0, cost: 0 }
          itemMap[pid].units += qty
          itemMap[pid].revenue += it.total_price || it.unit_price * qty || 0
          itemMap[pid].tradeValue += trade * qty
          itemMap[pid].cost += purchase * qty
        }))
        return {
          headers: ['Product', 'Units', 'Revenue', 'Dealer Margin', 'Cost', 'Company Profit'],
          rows: Object.values(itemMap).map(v => [
            v.name,
            v.units,
            v.revenue,
            Math.max(v.revenue - v.tradeValue, 0),
            v.cost,
            v.tradeValue - v.cost,
          ]),
        }
      }
      case 'COD Requests':
        return {
          headers: ['Customer', 'Phone', 'Address', 'Items', 'Total', 'Status', 'Date'],
          rows: (dataCache.codOrders || []).map(r => [
            r.customer_name,
            r.phone,
            r.address || '—',
            (r.items || []).map(it => `${it.name || 'Product'} ×${it.quantity}`).join('; '),
            r.total_amount || 0,
            r.status,
            r.created_at,
          ]),
        }
      default:
        return {
          headers: ['Order #', 'Dealer', 'Amount', 'Status', 'Date'],
          rows: activeOrders.map(o => [o.order_number, o.dealer?.name || '', o.net_amount ?? o.total_amount ?? 0, o.status, o.created_at]),
        }
    }
  }

  const handleExport = (report) => {
    const date = new Date().toISOString().split('T')[0]
    const { headers, rows } = getReportRows(report)
    downloadCSV(`${report.title.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`, headers, rows)
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, invoices, dealers, inventory, products, users, visits, payments, codOrders] = await Promise.all([
          api.getOrders(),
          api.getInvoices(),
          api.getDealers(),
          api.getInventory().catch(() => []),
          api.getProducts().catch(() => []),
          api.getUsers().catch(() => []),
          api.getCRMVisits().catch(() => []),
          api.getPayments().catch(() => []),
          api.getCodOrders().catch(() => []),
        ])
        setDataCache({ orders, invoices, dealers, inventory, products, users, visits, codOrders })

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const mtdOrders = orders.filter(o =>
          o.status !== 'cancelled' && o.status !== 'draft' &&
          new Date(o.created_at) >= monthStart
        )
        const totalRevenue = mtdOrders.reduce((s, o) => s + (o.net_amount || o.total_amount || 0), 0)
        // True month-to-date collection: approved payments received this month.
        const totalPaid = (payments || [])
          .filter(p =>
            p.status === 'approved' &&
            new Date(p.payment_date || p.confirmed_at || p.created_at) >= monthStart
          )
          .reduce((s, p) => s + (p.amount || 0), 0)
        const outstanding = invoices
          .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
          .reduce((s, i) => s + (i.due_amount || i.total_amount || 0), 0)
        const activeDealers = dealers.filter(d => d.status === 'active').length
        const avgOrder = mtdOrders.length > 0 ? totalRevenue / mtdOrders.length : 0
        // COD revenue is retail money collected directly by the company — reported
        // separately from the dealer pipeline so every shipped unit is accounted for.
        const codRevenue = (codOrders || [])
          .filter(r => r.status === 'completed')
          .reduce((s, r) => s + (Number(r.total_amount) || 0), 0)

        setStats({
          totalRevenue,
          totalPaid,
          outstanding,
          activeDealers,
          mtdOrders: mtdOrders.length,
          avgOrder,
          codRevenue,
        })
      } catch (err) {
        console.error('Reports stats fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const summaryStats = stats ? [
    { label: 'Total Revenue (MTD)', value: formatCurrency(stats.totalRevenue) },
    { label: 'Total Collection (MTD)', value: formatCurrency(stats.totalPaid) },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding) },
    { label: 'Active Dealers', value: formatNumber(stats.activeDealers) },
    { label: 'Orders (MTD)', value: formatNumber(stats.mtdOrders) },
    { label: 'Avg Order Value', value: formatCurrency(stats.avgOrder) },
    { label: 'COD Revenue', value: formatCurrency(stats.codRevenue) },
  ] : []

  const renderReportModal = () => {
    if (!viewReport) return null
    const { headers, rows } = getReportRows(viewReport)
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{viewReport.title}</h3>
              <p className="text-xs text-gray-500">{viewReport.description}</p>
            </div>
            <button onClick={() => setViewReport(null)} className="p-1 text-gray-400 hover:text-gray-600">
              <MdClose size={20} />
            </button>
          </div>
          <div className="p-5">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="text-xs">
                          {viewReport.title === 'Profit Report' && headers[j] === 'Cost'
                            ? <BlurredValue value={formatCurrency(cell)} />
                            : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No data available for this report</p>
              </div>
            )}
          </div>
          <div className="p-5 border-t border-gray-100 flex justify-end">
            <button onClick={() => handleExport(viewReport)} className="btn-primary text-xs">
              <MdFileDownload size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Business intelligence and performance data</p>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading stats...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryStats.map((stat, i) => (
            <div key={i} className="card p-4">
              <p className="stat-value text-lg">{stat.value}</p>
              <p className="stat-label text-[10px]">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Cards */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Available Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_CARDS.map((report, i) => (
            <div key={i} className="card card-hover p-5 cursor-pointer">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${report.color}`}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{report.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{report.description}</p>
                </div>
              </div>
               <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                <button onClick={() => setViewReport(report)} className="btn-ghost text-xs flex-1">
                  <MdAssessment size={14} /> View
                </button>
                <button onClick={() => handleExport(report)} className="btn-ghost text-xs flex-1">
                  <MdFileDownload size={14} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderReportModal()}
    </div>
  )
}
