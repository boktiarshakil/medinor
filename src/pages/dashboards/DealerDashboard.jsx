import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { MdShoppingCart, MdReceipt, MdAssessment, MdPayment, MdFileDownload } from 'react-icons/md'

export default function DealerDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [dealerRecord, setDealerRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [ordersData, invoicesData, dealersData] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getInvoices().catch(() => []),
          api.getDealers().catch(() => []),
        ])
        setOrders(ordersData)
        setInvoices(invoicesData)
        const match = dealersData.find(
          d => d.email && d.email.toLowerCase() === String(user?.email || '').toLowerCase()
        )
        setDealerRecord(match || null)
      } catch (err) {
        console.error('Dealer dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user?.email])

  // Filter for this dealer's orders and invoices
  const dealerId = dealerRecord?.id
  const myOrders = orders.filter(o => dealerId && o.dealer_id === dealerId)
  const myInvoices = invoices.filter(inv => dealerId && inv.dealer_id === dealerId)

  // Compute credit info
  const creditLimit = dealerRecord?.credit_limit || 50000
  const totalDue = myInvoices
    .filter(inv => inv.status === 'pending' || inv.status === 'unpaid' || inv.status === 'partial')
    .reduce((sum, inv) => sum + ((inv.due_amount ?? inv.total_amount) || inv.amount || 0), 0)
  const available = Math.max(0, creditLimit - totalDue)

  // Recent payments from paid invoices
  const recentPayments = myInvoices
    .filter(inv => inv.status === 'paid')
    .slice(0, 10)

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
      {/* Account Summary */}
      <div className="card p-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-brand-100">Welcome back,</p>
            <h2 className="text-xl font-bold mt-0.5">{dealerRecord?.name || user?.full_name || user?.name || 'Dealer'}</h2>
            <p className="text-xs text-brand-200 mt-1">{user?.email || ''}</p>
          </div>
          <button className="btn bg-white/15 text-white hover:bg-white/25 text-xs backdrop-blur-sm">
            <MdFileDownload size={14} /> Statement
          </button>
        </div>
        {!dealerRecord && (
          <p className="text-xs text-brand-100 mt-3 bg-white/10 rounded px-3 py-2">
            Your login is not linked to a dealer record yet. Contact admin to link it, then orders placed here will appear.
          </p>
        )}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Credit Limit</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(creditLimit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Current Due</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(totalDue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Available</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(available)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/place-order" className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <MdShoppingCart size={20} className="text-brand-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Place Order</span>
        </a>
        <a href="/payments" className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <MdPayment size={20} className="text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Pay Now</span>
        </a>
        <a href="/my-orders" className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <MdReceipt size={20} className="text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Order History</span>
        </a>
        <a href="/payments" className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <MdAssessment size={20} className="text-purple-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Ledger</span>
        </a>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
          <a href="/my-orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</a>
        </div>
        {myOrders.length === 0 ? (
          <div className="p-8 text-center">
            <MdShoppingCart size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">No orders yet</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.slice(0, 10).map(order => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs font-medium">{order.order_number || order.order_no || order.id}</td>
                    <td className="font-semibold">{formatCurrency(order.total_amount || order.amount || 0)}</td>
                    <td><span className={statusColor(order.status)}>{statusLabel(order.status)}</span></td>
                    <td className="hidden sm:table-cell text-gray-500">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Payments</h3>
          <a href="/payments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</a>
        </div>
        {recentPayments.length === 0 ? (
          <div className="p-8 text-center">
            <MdPayment size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">No payments yet</p>
          </div>
        ) : (
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(p => (
                  <tr key={p.id}>
                    <td className="font-semibold text-emerald-600">{formatCurrency(p.total_amount || p.amount || 0)}</td>
                    <td><span className={statusColor(p.status)}>{statusLabel(p.status)}</span></td>
                    <td className="hidden sm:table-cell text-gray-500">{formatDate(p.paid_at || p.updated_at || p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
