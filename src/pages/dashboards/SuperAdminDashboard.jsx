import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import { formatCurrency, formatNumber } from '../../lib/utils'
import {
  MdAttachMoney, MdShoppingCart, MdPeople, MdInventory2,
  MdTrendingUp, MdWarning, MdStore, MdAssessment
} from 'react-icons/md'

const STATS = [
  { label: 'Today Sales', value: formatCurrency(245600), icon: MdAttachMoney, trend: 'up', trendValue: '12%', color: 'green' },
  { label: 'Monthly Sales', value: formatCurrency(4875000), icon: MdTrendingUp, trend: 'up', trendValue: '8%', color: 'brand' },
  { label: 'Total Outstanding', value: formatCurrency(1234500), icon: MdWarning, trend: 'down', trendValue: '3%', color: 'amber' },
  { label: 'Collections Today', value: formatCurrency(89300), icon: MdAttachMoney, trend: 'up', trendValue: '15%', color: 'blue' },
  { label: 'Total Orders', value: formatNumber(1284), icon: MdShoppingCart, color: 'purple' },
  { label: 'Active Dealers', value: formatNumber(342), icon: MdStore, color: 'brand' },
  { label: 'Products Active', value: formatNumber(8), icon: MdInventory2, color: 'green' },
  { label: 'Sales Executives', value: formatNumber(24), icon: MdPeople, color: 'blue' },
]

const TOP_PRODUCTS = [
  { name: 'Mediron Blood Glucose Meter', sales: 450, revenue: formatCurrency(315000) },
  { name: 'Mediron Prime BP Monitor (MEDI 712)', sales: 320, revenue: formatCurrency(416000) },
  { name: 'Mediron Test Strips (50 pcs)', sales: 280, revenue: formatCurrency(84000) },
  { name: 'Mediron Advance BP Monitor (MEDI 447)', sales: 195, formatCurrency(234000) },
  { name: 'Mediron Examination Gloves', sales: 160, revenue: formatCurrency(48000) },
]

const AREA_PERFORMANCE = [
  { area: 'Dhaka North', target: 2000000, actual: 1850000, percent: 93 },
  { area: 'Dhaka South', target: 1800000, actual: 1620000, percent: 90 },
  { area: 'Chattogram', target: 1200000, actual: 1080000, percent: 90 },
  { area: 'Rajshahi', target: 800000, actual: 640000, percent: 80 },
  { area: 'Khulna', target: 600000, total: 420000, percent: 70 },
]

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-brand-50 text-brand-600 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.sales} units sold</p>
                </div>
                <span className="text-xs font-semibold text-gray-900">{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Area Performance + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Area Performance</h3>
          <div className="space-y-4">
            {AREA_PERFORMANCE.map((a, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700">{a.area}</span>
                  <span className="text-xs text-gray-500">
                    {formatCurrency(a.actual)} / {formatCurrency(a.target)}
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
              </div>
            ))}
          </div>
        </div>

        <RecentOrdersTable />
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
          <a href="/products" className="btn-secondary text-xs">
            <MdInventory2 size={14} /> Manage Products
          </a>
          <a href="/reports" className="btn-secondary text-xs">
            <MdAssessment size={14} /> View Reports
          </a>
        </div>
      </div>
    </div>
  )
}
