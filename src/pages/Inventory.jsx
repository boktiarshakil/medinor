import { formatNumber } from '../lib/utils'
import { MdInventory2, MdWarning, MdArrowUpward, MdArrowDownward } from 'react-icons/md'

const STOCK = [
  { id: '1', name: 'Mediron Blood Glucose Meter', sku: 'MED-GLU-001', batch: 'B2025-001', stock: 70, min: 50, inQty: 450, outQty: 380, expiry: null },
  { id: '2', name: 'Mediron Test Strips (50 pcs)', sku: 'MED-TST-050', batch: 'B2025-003', stock: 20, min: 100, inQty: 800, outQty: 780, expiry: '2026-06-30' },
  { id: '3', name: 'Mediron Prime BP Monitor', sku: 'MED-BP-712', batch: 'B2025-002', stock: 30, min: 40, inQty: 320, outQty: 290, expiry: null },
  { id: '4', name: 'Mediron Advance BP Monitor', sku: 'MED-BP-447', batch: 'B2025-004', stock: 35, min: 30, inQty: 195, outQty: 160, expiry: null },
  { id: '5', name: 'Mediron Lancets (100 pcs)', sku: 'MED-LAN-100', batch: 'B2025-005', stock: 80, min: 100, inQty: 600, outQty: 520, expiry: '2027-03-15' },
  { id: '6', name: 'Mediron Gloves (Large)', sku: 'MED-GLV-L', batch: 'B2025-006', stock: 100, min: 200, inQty: 1200, outQty: 1100, expiry: '2026-12-01' },
]

export default function Inventory() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">{STOCK.length} SKUs · {STOCK.filter(s => s.stock < s.min).length} low stock alerts</p>
      </div>

      {/* Low stock alerts */}
      {STOCK.filter(s => s.stock < s.min).length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 flex items-start gap-3">
          <MdWarning size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Low Stock Alert</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {STOCK.filter(s => s.stock < s.min).map(s => `${s.name} (${s.stock} left)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Batch</th>
              <th>In</th>
              <th>Out</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Status</th>
              <th className="hidden md:table-cell">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {STOCK.map(item => (
              <tr key={item.id}>
                <td className="font-medium">{item.name}</td>
                <td className="font-mono text-xs text-gray-500">{item.sku}</td>
                <td className="font-mono text-xs text-gray-400">{item.batch}</td>
                <td className="text-emerald-600 font-medium">+{item.inQty}</td>
                <td className="text-red-500 font-medium">-{item.outQty}</td>
                <td className="font-bold text-lg">{item.stock}</td>
                <td className="text-gray-400">{item.min}</td>
                <td>
                  {item.stock < item.min ? (
                    <span className="badge-warning">Low</span>
                  ) : (
                    <span className="badge-success">OK</span>
                  )}
                </td>
                <td className="hidden md:table-cell text-gray-500">{item.expiry || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
