import { useState, useEffect } from 'react'
import { formatNumber } from '../lib/utils'
import { MdInventory2, MdWarning, MdArrowUpward, MdArrowDownward } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInventory = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getInventory()
      const movements = await api.getStockMovements().catch(() => [])
      const inOut = {}
      movements.forEach(m => {
        if (!inOut[m.product_id]) inOut[m.product_id] = { in: 0, out: 0 }
        if (m.movement_type === 'in') inOut[m.product_id].in += m.quantity
        else inOut[m.product_id].out += m.quantity
      })
      setInventory(data.map(item => ({ ...item, in_quantity: inOut[item.product_id]?.in || 0, out_quantity: inOut[item.product_id]?.out || 0 })))
    } catch (err) {
      console.error('Inventory fetch failed:', err)
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInventory() }, [])

  const lowStock = inventory.filter(item => {
    const stock = item.quantity || item.stock || 0
    const min = item.low_stock_threshold || 0
    return min > 0 && stock < min
  })

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading inventory...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button className="btn-secondary mt-3 text-xs" onClick={fetchInventory}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">{inventory.length} SKUs · {lowStock.length} low stock alerts</p>
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 flex items-start gap-3">
          <MdWarning size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Low Stock Alert</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {lowStock.map(s => `${s.product?.name || s.name || 'Unknown'} (${s.quantity || s.stock || 0} left)`).join(' · ')}
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
            {inventory.map(item => {
              const stock = item.quantity || item.stock || 0
              const min = item.low_stock_threshold || 0
              const isLow = min > 0 && stock < min
              return (
                <tr key={item.id}>
                  <td className="font-medium">{item.product?.name || item.name || 'Unknown'}</td>
                  <td className="font-mono text-xs text-gray-500">{item.product?.sku || item.sku || '-'}</td>
                  <td className="font-mono text-xs text-gray-400">{item.batch_number || item.batch || '-'}</td>
                  <td className="text-emerald-600 font-medium">+{item.in_quantity || 0}</td>
                  <td className="text-red-500 font-medium">-{item.out_quantity || 0}</td>
                  <td className="font-bold text-lg">{stock}</td>
                  <td className="text-gray-400">{min || '-'}</td>
                  <td>
                    {isLow ? (
                      <span className="badge-warning">Low</span>
                    ) : (
                      <span className="badge-success">OK</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell text-gray-500">{item.expiry_date || item.expiry || '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {inventory.length === 0 && (
        <div className="card p-12 text-center">
          <MdInventory2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No inventory records</p>
        </div>
      )}
    </div>
  )
}
