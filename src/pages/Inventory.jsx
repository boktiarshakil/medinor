import { useState, useEffect } from 'react'
import { formatNumber } from '../lib/utils'
import { MdInventory2, MdWarning, MdArrowUpward, MdArrowDownward, MdAdd, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const { role } = useAuth()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stockModal, setStockModal] = useState(null)
  const [qty, setQty] = useState('')
  const [saving, setSaving] = useState(false)

  const canAddStock = ['super_admin', 'admin', 'warehouse'].includes(role)

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

  const openStockModal = (item) => {
    setStockModal(item)
    setQty('')
  }

  const handleAddStock = async () => {
    const quantity = Number(qty)
    if (!stockModal || !quantity || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    setSaving(true)
    try {
      const productId = stockModal.product_id
      await api.addStockMovement({
        product_id: productId,
        movement_type: 'in',
        quantity,
        reference_type: 'manual_add',
        notes: 'Manual stock add'
      })
      const current = Number(stockModal.quantity || stockModal.stock || 0)
      await api.updateInventory(stockModal.id, { quantity: current + quantity })
      toast.success(`Added ${quantity} units`)
      setStockModal(null)
      setQty('')
      fetchInventory()
    } catch (err) {
      console.error('Add stock failed:', err)
      toast.error(err.message || 'Failed to add stock')
    } finally {
      setSaving(false)
    }
  }

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{inventory.length} SKUs · {lowStock.length} low stock alerts</p>
        </div>
        {canAddStock && (
          <button className="btn-primary text-xs" onClick={() => { setStockModal({ manual: true }); setQty('') }}>
            <MdAdd size={14} /> Add Stock
          </button>
        )}
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
              {canAddStock && <th className="text-right">Action</th>}
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
                  {canAddStock && (
                    <td className="text-right">
                      <button className="btn-secondary text-xs" onClick={() => openStockModal(item)}>
                        <MdAdd size={12} /> Add
                      </button>
                    </td>
                  )}
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

      {/* Add Stock modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Stock</h3>
              <button onClick={() => setStockModal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            {stockModal.manual && !stockModal.product_id ? (
              <p className="text-sm text-gray-500 mb-4">Select a product row to add stock.</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Product: <span className="font-semibold">{stockModal.product?.name || stockModal.name || 'Unknown'}</span>
                  <br />
                  Current stock: <span className="font-semibold">{stockModal.quantity || stockModal.stock || 0} units</span>
                </p>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity to add</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="input w-full mb-5"
                  placeholder="e.g. 20"
                />
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={handleAddStock} disabled={saving}>
                    {saving ? 'Adding...' : 'Add Stock'}
                  </button>
                  <button className="btn-secondary flex-1" onClick={() => setStockModal(null)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
