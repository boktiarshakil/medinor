import { useState, useEffect } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import { formatCurrency, formatNumber, calcPercent } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  MdAttachMoney, MdShoppingCart, MdPeople, MdTrendingUp,
  MdWarning, MdStore, MdAssessment
} from 'react-icons/md'

export default function SalesManagerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [users, setUsers] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [ordersData, invoicesData, usersData, targetsData] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getInvoices().catch(() => []),
          api.getUsers().catch(() => []),
          api.getTargets({ areaId: user?.area_id }).catch(() => []),
        ])
        setOrders(ordersData)
        setInvoices(invoicesData)
        setUsers(usersData)
        setTargets(targetsData)
      } catch (err) {
        console.error('SalesManager dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const pipelineValue = orders
    .filter(o => o.status === 'submitted' || o.status === 'pending')
    .reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const pendingApproval = orders
    .filter(o => o.status === 'submitted')
    .reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const teamCollections = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + ((inv.paid_amount ?? inv.total_amount) || inv.amount || 0), 0)
  const overdueAccounts = invoices
    .filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled') return false
      return inv.due_date && new Date(inv.due_date) < new Date()
    })
    .reduce((sum, inv) => sum + ((inv.due_amount ?? inv.total_amount) || inv.amount || 0), 0)

  const STATS = [
    { label: 'Pipeline Value', value: formatCurrency(pipelineValue), icon: MdTrendingUp, color: 'brand' },
    { label: 'Pending Approval', value: formatCurrency(pendingApproval), icon: MdShoppingCart, color: 'amber' },
    { label: 'Team Collections', value: formatCurrency(teamCollections), icon: MdAttachMoney, color: 'green' },
    { label: 'Overdue Accounts', value: formatCurrency(overdueAccounts), icon: MdWarning, color: 'red' },
  ]

  // Compute team performance from real users + orders
  const salesUsers = users.filter(u => u.role === 'sales_executive' || u.role === 'area_manager')
  const targetMap = {}
  targets.filter(t => t.target_type === 'sales').forEach(t => {
    if (t.user_id) targetMap[t.user_id] = (targetMap[t.user_id] || 0) + t.target_value
  })

  const TEAM_PERFORMANCE = salesUsers.map(sr => {
    const srOrders = orders.filter(o => o.sr_id === sr.id || o.created_by === sr.id)
    const achieved = srOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
    return {
      id: sr.id,
      name: sr.full_name || sr.email || 'Unknown',
      area: sr.area?.name || sr.area_name || 'Unassigned',
      target: targetMap[sr.id] || 300000,
      achieved,
      orders: srOrders.filter(o => o.status !== 'cancelled').length,
      visits: srOrders.length,
    }
  }).sort((a, b) => b.achieved - a.achieved)

  // Stage pipeline counts
  const stages = [
    { stage: 'Draft', status: 'draft' },
    { stage: 'Submitted', status: 'submitted' },
    { stage: 'Approved', status: 'approved' },
    { stage: 'Packed', status: 'packed' },
    { stage: 'Dispatched', status: 'dispatched' },
  ]
  const stageData = stages.map(s => ({
    stage: s.stage,
    count: orders.filter(o => o.status === s.status).length,
    color: s.status === 'draft' ? 'bg-gray-400' :
           s.status === 'submitted' ? 'bg-blue-500' :
           s.status === 'approved' ? 'bg-emerald-500' :
           s.status === 'packed' ? 'bg-amber-500' : 'bg-purple-500'
  }))

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

      {/* Chart + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Order Pipeline</h3>
          <div className="space-y-3">
            {stageData.map((s, i) => (
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
        {TEAM_PERFORMANCE.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-500">No team members found</p>
          </div>
        ) : (
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
                {TEAM_PERFORMANCE.map((t) => {
                  const pct = calcPercent(t.achieved, t.target)
                  return (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>
                      <td className="text-gray-500">{t.area}</td>
                      <td>{formatCurrency(t.target)}</td>
                      <td className="font-semibold">{formatCurrency(t.achieved)}</td>
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
        )}
      </div>

      <RecentOrdersTable />
    </div>
  )
}
