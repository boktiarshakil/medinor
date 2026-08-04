import { formatCurrency, formatDate, statusColor, statusLabel } from '../../lib/utils'

const MOCK_ORDERS = [
  { id: '1', order_number: 'ORD-A1B2C3', dealer: 'Medicine Point', amount: 15400, status: 'delivered', date: '2025-01-15' },
  { id: '2', order_number: 'ORD-D4E5F6', dealer: 'Lazz Pharma', amount: 8750, status: 'pending', date: '2025-01-14' },
  { id: '3', order_number: 'ORD-G7H8I9', dealer: 'HealthCare Ltd', amount: 22300, status: 'dispatched', date: '2025-01-14' },
  { id: '4', order_number: 'ORD-J1K2L3', dealer: 'Central Pharmacy', amount: 5600, status: 'approved', date: '2025-01-13' },
  { id: '5', order_number: 'ORD-M4N5O6', dealer: 'Square Hospital', amount: 31200, status: 'completed', date: '2025-01-12' },
]

export default function RecentOrdersTable({ orders = MOCK_ORDERS }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
        <a href="/orders" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</a>
      </div>
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
            {orders.map(order => (
              <tr key={order.id}>
                <td className="font-mono text-xs font-medium text-gray-700">{order.order_number}</td>
                <td className="font-medium">{order.dealer}</td>
                <td className="font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                <td>
                  <span className={statusColor(order.status)}>{statusLabel(order.status)}</span>
                </td>
                <td className="hidden md:table-cell text-gray-500">{formatDate(order.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
