import { useState, useEffect } from 'react'
import StatCard from '../../components/Dashboard/StatCard'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { api } from '../../lib/api'
import { MdInventory2, MdLocalShipping, MdWarning, MdArrowUpward, MdArrowDownward } from 'react-icons/md'

export default function WarehouseDashboard() {
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [invData, ordersData] = await Promise.all([
          api.getInventory().catch(() => []),
          api.getOrders().catch(() => []),
        ])
        setInventory(invData)
        setOrders(ordersData)
      } catch (err) {
        console.error('Warehouse dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const totalSKUs = inventory.length
  const stockValue = inventory.reduce((sum, item) => {
    const qty = item.quantity || item.stock || 0
    const price = item.product?.mrp || item.mrp || item.purchase_price || 0
    return sum + (qty * price)
  }, 0)
  const lowStockItems = inventory.filter(item => {
    const stock = item.quantity || item.stock || 0
    const min = item.low_stock_threshold ?? item.min_quantity ?? item.reorder_level ?? 0
    return min > 0 && stock < min
  })
  const pendingDispatch = orders.filter(o => o.status === 'approved' || o.status === 'packed').length

  const STATS = [
    { label: 'Total SKUs', value: formatNumber(totalSKUs), icon: MdInventory2, color: 'brand' },
    { label: 'Stock Value', value: formatCurrency(stockValue), icon: MdInventory2, color: 'blue' },
    { label: 'Low Stock Items', value: formatNumber(lowStockItems.length), icon: MdWarning, color: 'amber' },
    { label: 'Pending Dispatch', value: formatNumber(pendingDispatch), icon: MdLocalShipping, color: 'purple' },
  ]

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading warehouse data...</p>
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

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 text-amber-700">
            <MdWarning size={18} />
            <span className="text-sm font-semibold">Low Stock Alert</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {lowStockItems.map(s => `${s.product?.name || s.name || 'Unknown'} (${s.quantity || s.stock || 0} left)`).join(' · ')}
          </p>
        </div>
      )}

      {/* Stock Table */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Current Stock</h3>
          <button className="btn-secondary text-xs">Export CSV</button>
        </div>
        {inventory.length === 0 ? (
          <div className="p-8 text-center">
            <MdInventory2 size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">No inventory records</p>
          </div>
        ) : (
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
                {inventory.map((item) => {
                  const stock = item.quantity || item.stock || 0
                  const min = item.low_stock_threshold ?? item.min_quantity ?? item.reorder_level ?? 0
                  const isLow = min > 0 && stock < min
                  return (
                    <tr key={item.id}>
                      <td className="font-medium">{item.product?.name || item.name || 'Unknown'}</td>
                      <td className="font-mono text-xs text-gray-500">{item.product?.sku || item.sku || '-'}</td>
                      <td className="text-emerald-600 font-medium">+{item.in_quantity || item.inQty || 0}</td>
                      <td className="text-red-500 font-medium">-{item.out_quantity || item.outQty || 0}</td>
                      <td className="font-bold">{stock}</td>
                      <td>
                        {isLow ? (
                          <span className="badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge-success">In Stock</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
