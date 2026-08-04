import { formatCurrency, formatDate, statusColor, statusLabel } from '../../lib/utils'
import { MdShoppingCart, MdReceipt, MdAssessment, MdPayment, MdFileDownload } from 'react-icons/md'

const DEALER_INFO = {
  name: 'Medicine Point',
  owner: 'Dr. Rahim Uddin',
  mobile: '+880 1712-345678',
  creditLimit: 50000,
  currentDue: 12300,
  paymentTerms: 30,
}

const RECENT_ORDERS = [
  { id: '1', number: 'ORD-A1B2C3', amount: 15400, status: 'delivered', date: '2025-01-15' },
  { id: '2', number: 'ORD-D4E5F6', amount: 8750, status: 'dispatched', date: '2025-01-14' },
  { id: '3', number: 'ORD-G7H8I9', amount: 22300, status: 'pending', date: '2025-01-14' },
]

const RECENT_PAYMENTS = [
  { id: '1', amount: 5000, method: 'bkash', date: '2025-01-12', ref: 'TXN123456' },
  { id: '2', amount: 8750, method: 'bank', date: '2025-01-08', ref: 'CHQ789012' },
  { id: '3', amount: 3000, method: 'cash', date: '2025-01-05', ref: null },
]

export default function DealerDashboard() {
  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <div className="card p-5 bg-gradient-to-r from-brand-500 to-brand-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-brand-100">Welcome back,</p>
            <h2 className="text-xl font-bold mt-0.5">{DEALER_INFO.name}</h2>
            <p className="text-xs text-brand-200 mt-1">{DEALER_INFO.owner}</p>
          </div>
          <button className="btn bg-white/15 text-white hover:bg-white/25 text-xs backdrop-blur-sm">
            <MdFileDownload size={14} /> Statement
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Credit Limit</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(DEALER_INFO.creditLimit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Current Due</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(DEALER_INFO.currentDue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-200 uppercase font-medium">Available</p>
            <p className="text-lg font-bold mt-0.5">{formatCurrency(DEALER_INFO.creditLimit - DEALER_INFO.currentDue)}</p>
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
              {RECENT_ORDERS.map(order => (
                <tr key={order.id}>
                  <td className="font-mono text-xs font-medium">{order.number}</td>
                  <td className="font-semibold">{formatCurrency(order.amount)}</td>
                  <td><span className={statusColor(order.status)}>{statusLabel(order.status)}</span></td>
                  <td className="hidden sm:table-cell text-gray-500">{formatDate(order.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Recent Payments</h3>
          <a href="/payments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All →</a>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th className="hidden sm:table-cell">Reference</th>
                <th className="hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_PAYMENTS.map(p => (
                <tr key={p.id}>
                  <td className="font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                  <td className="capitalize">{p.method}</td>
                  <td className="hidden sm:table-cell text-gray-500 font-mono text-xs">{p.ref || '-'}</td>
                  <td className="hidden sm:table-cell text-gray-500">{formatDate(p.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
