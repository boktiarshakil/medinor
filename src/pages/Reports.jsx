import { useState, useEffect } from 'react'
import { formatCurrency, formatNumber } from '../lib/utils'
import { MdFileDownload, MdAssessment } from 'react-icons/md'
import { api } from '../lib/api'

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
]

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orders, invoices, dealers] = await Promise.all([
          api.getOrders(),
          api.getInvoices(),
          api.getDealers(),
        ])

        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const mtdOrders = orders.filter(o => new Date(o.created_at) >= monthStart)
        const totalRevenue = mtdOrders.reduce((s, o) => s + (o.net_amount || o.total_amount || 0), 0)
        const totalPaid = invoices.reduce((s, i) => s + (i.paid || 0), 0)
        const outstanding = invoices.reduce((s, i) => s + ((i.amount || 0) - (i.paid || 0)), 0)
        const activeDealers = dealers.filter(d => d.status === 'active').length
        const avgOrder = mtdOrders.length > 0 ? totalRevenue / mtdOrders.length : 0

        setStats({
          totalRevenue,
          totalPaid,
          outstanding,
          activeDealers,
          mtdOrders: mtdOrders.length,
          avgOrder,
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
  ] : []

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
                <button className="btn-ghost text-xs flex-1">
                  <MdAssessment size={14} /> View
                </button>
                <button className="btn-ghost text-xs flex-1">
                  <MdFileDownload size={14} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
