import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { MdAttachMoney, MdShoppingCart, MdPeople, MdWarning, MdLocationOn } from 'react-icons/md'

const STATS = [
  { label: 'Today Orders', value: formatCurrency(156400), icon: MdShoppingCart, trend: 'up', trendValue: '18%', color: 'brand' },
  { label: 'Target Achieved', value: formatCurrency(1850000), icon: MdAttachMoney, trend: 'up', trendValue: '5%', color: 'green' },
  { label: 'Overdue Accounts', value: formatCurrency(89000), icon: MdWarning, color: 'red' },
  { label: 'Active SRs', value: formatNumber(6), icon: MdPeople, color: 'blue' },
]

const DAILY_TARGET = { achieved: 1850000, target: 2000000, percent: 93 }

const SR_STATUS = [
  { name: 'Rahim Uddin', checkedIn: true, orders: 3, visits: 5, lastLocation: 'Dhanmondi 27' },
  { name: 'Karim Ahmed', checkedIn: true, orders: 2, visits: 4, lastLocation: 'New Market' },
  { name: 'Sajid Hasan', checkedIn: false, orders: 0, visits: 0, lastLocation: null },
  { name: 'Nusrat Jahan', checkedIn: true, orders: 4, visits: 6, lastLocation: 'Uttara Sector 7' },
  { name: 'Tanvir Rahman', checkedIn: true, orders: 1, visits: 3, lastLocation: 'Mirpur 10' },
  { name: 'Faruk Hossain', checkedIn: false, orders: 0, visits: 0, lastLocation: null },
]

export default function AreaManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Target Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Target Progress</h3>
            <p className="text-xs text-gray-400 mt-0.5">Dhaka North Territory</p>
          </div>
          <span className="text-xl font-bold text-brand-600">{DAILY_TARGET.percent}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${DAILY_TARGET.percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Achieved: {formatCurrency(DAILY_TARGET.achieved)}</span>
          <span>Target: {formatCurrency(DAILY_TARGET.target)}</span>
        </div>
      </div>

      {/* Chart + SR Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SalesChart />
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">SR Live Status</h3>
          <div className="space-y-3">
            {SR_STATUS.map((sr, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sr.checkedIn ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{sr.name}</p>
                  {sr.lastLocation ? (
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <MdLocationOn size={10} /> {sr.lastLocation}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400">Not checked in</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-800">{sr.orders} orders</p>
                  <p className="text-[10px] text-gray-400">{sr.visits} visits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RecentOrdersTable />
    </div>
  )
}
