import { useState } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import SalesChart from '../../components/Dashboard/SalesChart'
import RecentOrdersTable from '../../components/Dashboard/RecentOrdersTable'
import OrgHierarchy from '../../components/OrgChart/OrgHierarchy'
import { formatCurrency, formatNumber, calcPercent } from '../../lib/utils'
import {
  MdAttachMoney, MdShoppingCart, MdPeople, MdInventory2,
  MdTrendingUp, MdWarning, MdStore, MdAssessment,
  MdNotificationsActive, MdLocalShipping, MdQrCode, MdMyLocation,
  MdCampaign, MdChat, MdArrowForward, MdCheckCircle
} from 'react-icons/md'

// ============================================================
// STATS — Today Sales, Stock Value, Outstanding, Collections
// ============================================================
const STATS = [
  { label: 'Today Sales', value: formatCurrency(245600), icon: MdAttachMoney, trend: 'up', trendValue: '12%', color: 'green' },
  { label: 'Monthly Sales', value: formatCurrency(4875000), icon: MdTrendingUp, trend: 'up', trendValue: '8%', color: 'brand' },
  { label: 'Stock Value', value: formatCurrency(3250000), icon: MdInventory2, color: 'purple' },
  { label: 'Total Outstanding', value: formatCurrency(1234500), icon: MdWarning, trend: 'down', trendValue: '3%', color: 'amber' },
  { label: 'Collections Today', value: formatCurrency(89300), icon: MdAttachMoney, trend: 'up', trendValue: '15%', color: 'blue' },
  { label: 'Total Orders', value: formatNumber(1284), icon: MdShoppingCart, color: 'purple' },
  { label: 'Active Dealers', value: formatNumber(342), icon: MdStore, color: 'brand' },
  { label: 'Sales Team', value: formatNumber(24), icon: MdPeople, color: 'blue' },
]

// ============================================================
// TARGET BOXES — Per user target with progress (conversation spec)
// ============================================================
const TARGET_BOXES = [
  { name: 'Rahim Uddin', role: 'TSO', territory: 'Dhaka North', target: 300000, achieved: 285000, orders: 42, commission: '5%', commissionEarned: 14250 },
  { name: 'Karim Ahmed', role: 'ASM', territory: 'Dhaka South', target: 280000, achieved: 245000, orders: 38, commission: '3%', commissionEarned: 7350 },
  { name: 'Sajid Hasan', role: 'TSO', territory: 'Dhanmondi', target: 250000, achieved: 262000, orders: 35, commission: '5%', commissionEarned: 13100 },
  { name: 'Nusrat Jahan', role: 'TSO', territory: 'Uttara', target: 220000, achieved: 178000, orders: 28, commission: '5%', commissionEarned: 8900 },
  { name: 'Tanvir Rahman', role: 'TSO', territory: 'Mirpur', target: 200000, achieved: 195000, orders: 31, commission: '5%', commissionEarned: 9750 },
]

// ============================================================
// ALERTS — Low stock, Expiry, Due collections
// ============================================================
const ALERTS = [
  { type: 'low_stock', message: 'Mediron Prime BP Monitor (MEDI 712) — only 5 units in Chattogram Hub', severity: 'critical' },
  { type: 'low_stock', message: 'Mediron Test Strip 50pcs — below reorder level (20/30)', severity: 'warning' },
  { type: 'expiry', message: 'Mediron Gloves (Batch GL-2024-03) expires in 30 days', severity: 'warning' },
  { type: 'due', message: 'Khulna Medical — ৳45,000 overdue (45 days)', severity: 'critical' },
  { type: 'due', message: 'HealthCare Ltd — ৳22,300 due in 7 days', severity: 'info' },
]

// ============================================================
// AREA PERFORMANCE
// ============================================================
const AREA_PERFORMANCE = [
  { area: 'Dhaka North', target: 2000000, actual: 1850000, percent: 93, dealers: 45, asm: 'Karim Ahmed' },
  { area: 'Dhaka South', target: 1800000, actual: 1620000, percent: 90, dealers: 38, asm: 'Rahim Uddin' },
  { area: 'Chattogram', target: 1200000, actual: 1080000, percent: 90, dealers: 28, asm: 'Sohel Rana' },
  { area: 'Rajshahi', target: 800000, actual: 640000, percent: 80, dealers: 18, asm: 'Nabil Khan' },
  { area: 'Khulna', target: 600000, actual: 420000, percent: 70, dealers: 15, asm: 'Tanvir Hasan' },
]

export default function SuperAdminDashboard() {
  const [showOrgChart, setShowOrgChart] = useState(false)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Action Tiles — conversation spec features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { icon: MdCampaign, label: 'Announcements', path: '/announcements', color: 'bg-purple-50 text-purple-600', badge: 2 },
          { icon: MdChat, label: 'Messages', path: '/messages', color: 'bg-blue-50 text-blue-600', badge: 5 },
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
              {action.badge && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
            </a>
          )
        })}
      </div>

      {/* Alerts Section — Low Stock, Expiry, Due */}
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

      {/* Charts + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {[
              { name: 'Mediron Glucose Meter', sales: 450, revenue: formatCurrency(315000) },
              { name: 'Mediron Prime BP Monitor', sales: 320, revenue: formatCurrency(416000) },
              { name: 'Mediron Test Strips (50)', sales: 280, revenue: formatCurrency(84000) },
              { name: 'Mediron Advance BP Monitor', sales: 195, revenue: formatCurrency(234000) },
              { name: 'Mediron Gloves (Large)', sales: 160, revenue: formatCurrency(48000) },
            ].map((p, i) => (
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

      {/* Target Boxes — conversation spec: individual boxes per user */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Target vs Achievement</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Individual target boxes — each user sees only their own</p>
          </div>
          <a href="/reports" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
            Details <MdArrowForward size={14} />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {TARGET_BOXES.map((t, i) => {
            const pct = calcPercent(t.achieved, t.target)
            return (
              <div key={i} className="p-3 rounded-xl border border-gray-100 hover:border-brand-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{t.role} · {t.territory}</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500'
                  }`}>{pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>{formatCurrency(t.achieved)}</span>
                  <span>{formatCurrency(t.target)}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{t.orders} orders</span>
                  <span className="text-[10px] font-semibold text-emerald-600">{t.commission} = {formatCurrency(t.commissionEarned)}</span>
                </div>
              </div>
            )
          })}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">{a.area}</span>
                    <span className="text-[10px] text-gray-400">({a.dealers} dealers)</span>
                  </div>
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
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400">ASM: {a.asm}</span>
                  <span className={`text-[10px] font-semibold ${
                    a.percent >= 90 ? 'text-emerald-600' : a.percent >= 70 ? 'text-amber-600' : 'text-red-500'
                  }`}>{a.percent}%</span>
                </div>
              </div>
            ))}
          </div>
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
