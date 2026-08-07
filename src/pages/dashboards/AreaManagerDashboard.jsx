import { useState, useEffect } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import { formatCurrency, formatNumber, thisMonthRange } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { MdAttachMoney, MdShoppingCart, MdPeople, MdWarning, MdLocationOn } from 'react-icons/md'

export default function AreaManagerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [users, setUsers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [targets, setTargets] = useState([])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [ordersData, invoicesData, usersData, attendanceData, targetsData] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getInvoices().catch(() => []),
          api.getUsers().catch(() => []),
          api.getTodayAttendanceList().catch(() => []),
          api.getTargets({ areaId: user?.area_id }).catch(() => []),
        ])
        setOrders(ordersData)
        setInvoices(invoicesData)
        setUsers(usersData)
        setAttendance(attendanceData)
        setTargets(targetsData)
      } catch (err) {
        console.error('AreaManager dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const { start: monthStart, end: monthEnd } = thisMonthRange()
  const monthStartISO = monthStart.toISOString()
  const monthEndISO = monthEnd.toISOString()
  const todayISO = new Date().toISOString().split('T')[0]

  // SRs in this area manager's team
  const mySRs = users.filter(u => u.role === 'sales_executive' && u.area_id === user?.area_id)
  const srIds = mySRs.map(sr => sr.id)
  const attendedIds = new Set(attendance.filter(a => a.check_in).map(a => a.user_id))

  // Orders from this area's SRs
  const areaOrders = orders.filter(o => srIds.includes(o.sr_id) || srIds.includes(o.created_by))
  const todayOrders = areaOrders.filter(o => o.created_at >= todayISO && o.status !== 'cancelled')
  const monthOrders = areaOrders.filter(o => o.created_at >= monthStartISO && o.created_at <= monthEndISO && o.status !== 'cancelled')

  const todayOrdersTotal = todayOrders.reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const monthAchieved = monthOrders.reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const overdueAccounts = invoices
    .filter(inv => {
      if (inv.status === 'paid') return false
      return inv.due_date && new Date(inv.due_date) < new Date()
    })
    .reduce((sum, inv) => sum + ((inv.due_amount ?? inv.total_amount) || inv.amount || 0), 0)

  const dbMonthTarget = targets
    .filter(t => t.target_type === 'sales')
    .reduce((sum, t) => sum + (t.target_value || 0), 0)
  const monthTarget = dbMonthTarget > 0 ? dbMonthTarget : 2000000
  const percent = Math.min(Math.round((monthAchieved / monthTarget) * 100), 100)

  const STATS = [
    { label: 'Today Orders', value: formatCurrency(todayOrdersTotal), icon: MdShoppingCart, color: 'brand' },
    { label: 'Target Achieved', value: formatCurrency(monthAchieved), icon: MdAttachMoney, color: 'green' },
    { label: 'Overdue Accounts', value: formatCurrency(overdueAccounts), icon: MdWarning, color: 'red' },
    { label: 'Active SRs', value: formatNumber(mySRs.length), icon: MdPeople, color: 'blue' },
  ]

  // SR live status — compute from orders and GPS history
  const SR_STATUS = mySRs.map(sr => {
    const srOrders = areaOrders.filter(o => o.sr_id === sr.id || o.created_by === sr.id)
    const todayOrders_sr = srOrders.filter(o => o.created_at >= new Date().toISOString().split('T')[0])
    return {
      id: sr.id,
      name: sr.full_name || sr.email || 'Unknown',
      checkedIn: attendedIds.has(sr.id),
      orders: todayOrders_sr.filter(o => o.status !== 'cancelled').length,
      visits: todayOrders_sr.length,
      lastLocation: sr.area?.name || 'Unknown',
    }
  })

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
            <p className="text-xs text-gray-400 mt-0.5">{user?.area?.name || user?.area_name || 'Your Territory'}</p>
          </div>
          <span className="text-xl font-bold text-brand-600">{percent}%</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Achieved: {formatCurrency(monthAchieved)}</span>
          <span>Target: {formatCurrency(monthTarget)}</span>
        </div>
      </div>

      {/* Chart + SR Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SalesChart />
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">SR Live Status</h3>
          {SR_STATUS.length === 0 ? (
            <p className="text-xs text-gray-500">No SRs assigned</p>
          ) : (
            <div className="space-y-3">
              {SR_STATUS.map((sr) => (
                <div key={sr.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sr.checkedIn ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{sr.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <MdLocationOn size={10} /> {sr.lastLocation}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-800">{sr.orders} orders</p>
                    <p className="text-[10px] text-gray-400">{sr.visits} visits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RecentOrdersTable />
    </div>
  )
}
