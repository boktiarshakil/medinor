import StatCard from '../../components/Dashboard/StatCard'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { MdInventory2, MdLocalShipping, MdWarning, MdAssignmentReturn, MdArrowUpward, MdArrowDownward } from 'react-icons/md'

const STATS = [
  { label: 'Total SKUs', value: formatNumber(8), icon: MdInventory2, color: 'brand' },
  { label: 'Stock Value', value: formatCurrency(3250000), icon: MdInventory2, color: 'blue' },
  { label: 'Low Stock Items', value: formatNumber(2), icon: MdWarning, color: 'amber' },
  { label: 'Pending Dispatch', value: formatNumber(15), icon: MdLocalShipping, color: 'purple' },
]

const STOCK_DATA = [
  { name: 'Mediron Blood Glucose Meter', sku: 'MED-GLU-001', in: 450, out: 380, stock: 70, min: 50, status: 'ok' },
  { name: 'Mediron Test Strips (50 pcs)', sku: 'MED-TST-050', in: 800, out: 780, stock: 20, min: 100, status: 'low' },
  { name: 'Mediron Prime BP Monitor', sku: 'MED-BP-712', in: 320, out: 290, stock: 30, min: 40, status: 'low' },
  { name: 'Mediron Advance BP Monitor', sku: 'MED-BP-447', in: 195, out: 160, stock: 35, min: 30, status: 'ok' },
  { name: 'Mediron Lancets (100 pcs)', sku: 'MED-LAN-100', in: 600, out: 520, stock: 80, min: 100, status: 'ok' },
  { name: 'Mediron Gloves (Large)', sku: 'MED-GLV-L', in: 1200, out: 1100, stock: 100, min: 200, status: 'ok' },
]

const RECENT_MOVEMENTS = [
  { type: 'in', product: 'Blood Glucose Meter', qty: 50, ref: 'PO-2025-001', date: '2025-01-15' },
  { type: 'out', product: 'Test Strips (50 pcs)', qty: 30, ref: 'ORD-A1B2C3', date: '2025-01-15' },
  { type: 'out', product: 'Prime BP Monitor', qty: 15, ref: 'ORD-D4E5F6', date: '2025-01-14' },
  { type: 'damage', product: 'Examination Gloves', qty: 10, ref: 'DMG-001', date: '2025-01-14' },
  { type: 'in', product: 'Lancets (100 pcs)', qty: 100, ref: 'PO-2025-002', date: '2025-01-13' },
]

export default function WarehouseDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Low Stock Alert */}
      <div className="card p-4 border-l-4 border-l-amber-400">
        <div className="flex items-center gap-2 text-amber-700">
          <MdWarning size={18} />
          <span className="text-sm font-semibold">Low Stock Alert</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Mediron Test Strips (50 pcs) — 20 remaining (min: 100) &nbsp;|&nbsp;
          Mediron Prime BP Monitor — 30 remaining (min: 40)
        </p>
      </div>

      {/* Stock Table */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Current Stock</h3>
          <button className="btn-secondary text-xs">Export CSV</button>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>In</th>
                <th>Out</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_DATA.map((item, i) => (
                <tr key={i}>
                  <td className="font-medium">{item.name}</td>
                  <td className="font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="text-emerald-600 font-medium">+{item.in}</td>
                  <td className="text-red-500 font-medium">-{item.out}</td>
                  <td className="font-bold">{item.stock}</td>
                  <td>
                    {item.status === 'low' ? (
                      <span className="badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge-success">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements */}
      <div className="card">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-gray-900">Recent Stock Movements</h3>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Reference</th>
                <th className="hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_MOVEMENTS.map((m, i) => (
                <tr key={i}>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      m.type === 'in' ? 'text-emerald-600' :
                      m.type === 'damage' ? 'text-red-500' : 'text-blue-600'
                    }`}>
                      {m.type === 'in' ? <MdArrowUpward size={12} /> :
                       m.type === 'damage' ? <MdWarning size={12} /> :
                       <MdArrowDownward size={12} />}
                      {m.type === 'in' ? 'Stock In' : m.type === 'damage' ? 'Damage' : 'Stock Out'}
                    </span>
                  </td>
                  <td className="font-medium">{m.product}</td>
                  <td className="font-semibold">{m.qty}</td>
                  <td className="font-mono text-xs text-gray-500">{m.ref}</td>
                  <td className="hidden sm:table-cell text-gray-500">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
