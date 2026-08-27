import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../../lib/utils'
import { api } from '../../lib/api'
import { MdShoppingCart } from 'react-icons/md'

export default function RecentOrdersTable({ orders: propOrders, limit = 5 }) {
  const [liveOrders, setLiveOrders] = useState([])
  const [loading, setLoading] = useState(!propOrders)

  useEffect(() => {
    if (propOrders) return
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await api.getOrders()
        setLiveOrders(data)
      } catch (err) {
        console.error('RecentOrders fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [propOrders])

  const orders = propOrders || liveOrders
  const display = orders.slice(0, limit)

  if (loading) {
    return (
      <div className="card p-6 text-center">
        <div className="w-6 h-6 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-500 mt-2">Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
        <Link to="/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</Link>
      </div>
      {display.length === 0 ? (
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
                <th>Dealer</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {display.map(order => (
                <tr key={order.id}>
                  <td className="font-mono text-xs font-medium text-gray-700">{order.order_number || order.order_no || order.id}</td>
                  <td className="font-medium">{order.dealer?.name || order.dealer_name || '-'}</td>
                  <td className="font-semibold text-gray-900">{formatCurrency(order.total_amount || order.amount || 0)}</td>
                  <td>
                    <span className={statusColor(order.status)}>{statusLabel(order.status)}</span>
                  </td>
                  <td className="hidden md:table-cell text-gray-500">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
