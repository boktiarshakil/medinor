import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import { formatCurrency, formatNumber } from '../../lib/utils'
import {
  MdAttachMoney, MdShoppingCart, MdPeople, MdTrendingUp,
  MdWarning, MdStore, MdAssessment
} from 'react-icons/md'

const STATS = [
  { label: 'Pipeline Value', value: formatCurrency(2450000), icon: MdTrendingUp, trend: 'up', trendValue: '14%', color: 'brand' },
  { label: 'Pending Approval', value: formatCurrency(385000), icon: MdShoppingCart, color: 'amber' },
  { label: 'Team Collections', value: formatCurrency(678000), icon: MdAttachMoney, trend: 'up', trendValue: '9%', color: 'green' },
  { label: 'Overdue Accounts', value: formatCurrency(234000), icon: MdWarning, color: 'red' },
]

const TEAM_PERFORMANCE = [
  { name: 'Rahim Uddin', area: 'Dhaka North', target: 300000, actual: 285000, orders: 42, visits: 18 },
  { name: 'Karim Ahmed', area: 'Dhaka South', target: 280000, actual: 245000, orders: 38, visits: 16 },
  { name: 'Sajid Hasan', area: 'Dhanmondi', target: 250000, actual: 262000, orders: 35, visits: 20 },
  { name: 'Nusrat Jahan', area: 'Uttara', target: 220000, actual: 178000, orders: 28, visits: 14 },
  { name: 'Tanvir Rahman', area: 'Mirpur', target: 200000, actual: 195000, orders: 31, visits: 15 },
]

export default function SalesManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Chart + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Order Pipeline</h3>
          <div className="space-y-3">
            {[
              { stage: 'Draft', count: 12, color: 'bg-gray-400' },
              { stage: 'Submitted', count: 8, color: 'bg-blue-500' },
              { stage: 'Approved', count: 15, color: 'bg-emerald-500' },
              { stage: 'Packed', count: 6, color: 'bg-amber-500' },
              { stage: 'Dispatched', count: 9, color: 'bg-purple-500' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-xs font-medium text-gray-700 flex-1">{s.stage}</span>
                <span className="text-sm font-bold text-gray-900">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Team Performance</h3>
          <a href="/reports" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Full Report →</a>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Executive</th>
                <th>Area</th>
                <th>Target</th>
                <th>Achieved</th>
                <th>Progress</th>
                <th className="hidden md:table-cell">Orders</th>
                <th className="hidden md:table-cell">Visits</th>
              </tr>
            </thead>
            <tbody>
              {TEAM_PERFORMANCE.map((t, i) => {
                const pct = Math.round((t.actual / t.target) * 100)
                return (
                  <tr key={i}>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-gray-500">{t.area}</td>
                    <td>{formatCurrency(t.target)}</td>
                    <td className="font-semibold">{formatCurrency(t.actual)}</td>
                    <td className="w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-600 w-8">{pct}%</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-gray-500">{t.orders}</td>
                    <td className="hidden md:table-cell text-gray-500">{t.visits}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <RecentOrdersTable />
    </div>
  )
}
