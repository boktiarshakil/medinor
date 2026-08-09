import { useState, useEffect } from 'react'
import { MdInventory2, MdWarning, MdAdd, MdRemove, MdTune, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const canManage = ['super_admin', 'admin', 'warehouse'].includes(role)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [prods, inv] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getInventory().catch(() => []),
      ])
      setProducts(prods || [])
      setInventory(inv || [])
    } catch (err) {
      console.error('Inventory fetch failed:', err)
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Build merged view: each product with its total stock and inventory rows
  const rows = products.map(p => {
    const invRows = inventory.filter(i => i.product_id === p.id)
    const stock = invRows.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    const min = invRows.length ? Math.min(...invRows.map(i => Number(i.low_stock_threshold) || 0)) : 0
    return { product: p, invRows, stock, min }
  })

  const openModal = (type, row) => {
    setModal({ type, row })
    setQty('')
    setReason('')
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setQty('')
    setReason('')
  }

  // Find or create the primary inventory row for a product
  const primaryInv = (row) => row.invRows[0] || null

  const handleAdd = async () => {
    const quantity = Number(qty)
    if (!modal?.row || !quantity || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    setSaving(true)
    try {
      const row = modal.row
      const inv = primaryInv(row)
      await api.addStockMovement({
        product_id: row.product.id,
        movement_type: 'in',
        quantity,
        reference_type: 'manual_add',
        notes: reason || 'Manual stock add'
      })
      if (inv) {
        await api.updateInventory(inv.id, { quantity: Number(inv.quantity || 0) + quantity })
      } else {
        await api.createInventory({ product_id: row.product.id, quantity, low_stock_threshold: 50 })
      }
      toast.success(`Added ${quantity} units of ${row.product.name}`)
      closeModal()
      fetchData()
    } catch (err) {
      console.error('Add stock failed:', err)
      toast.error(err.message || 'Failed to add stock')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    const quantity = Number(qty)
    const row = modal?.row
    if (!row || !quantity || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    if (quantity > row.stock) {
      toast.error(`Cannot remove more than current stock (${row.stock})`)
      return
    }
    if (!reason.trim()) {
      toast.error('Reason is required for removal')
      return
    }
    setSaving(true)
    try {
      await api.addStockMovement({
        product_id: row.product.id,
        movement_type: 'out',
        quantity,
        reference_type: 'manual_remove',
        notes: reason || 'Manual stock remove'
      })
      // Reduce from inventory rows (oldest first)
      let remaining = quantity
      const sorted = [...row.invRows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      for (const inv of sorted) {
        if (remaining <= 0) break
        const current = Number(inv.quantity) || 0
        const deduct = Math.min(current, remaining)
        await api.updateInventory(inv.id, { quantity: current - deduct })
        remaining -= deduct
      }
      toast.success(`Removed ${quantity} units of ${row.product.name}`)
      closeModal()
      fetchData()
    } catch (err) {
      console.error('Remove stock failed:', err)
      toast.error(err.message || 'Failed to remove stock')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjust = async () => {
    const newQty = Number(qty)
    const row = modal?.row
    if (!row || Number.isNaN(newQty) || newQty < 0) {
      toast.error('Enter a valid quantity')
      return
    }
    if (!reason.trim()) {
      toast.error('Reason is required for adjustment')
      return
    }
    setSaving(true)
    try {
      const diff = newQty - row.stock
      if (diff !== 0) {
        await api.addStockMovement({
          product_id: row.product.id,
          movement_type: 'adjustment',
          quantity: Math.abs(diff),
          reference_type: 'manual_adjust',
          notes: `${diff > 0 ? 'Up' : 'Down'} adjust to ${newQty}: ${reason}`
        })
      }
      // Clear existing rows, set one row to the new quantity
      const inv = primaryInv(row)
      if (inv) {
        for (const r of row.invRows) {
          await api.updateInventory(r.id, { quantity: 0 })
        }
        await api.updateInventory(inv.id, { quantity: newQty })
      } else {
        await api.createInventory({ product_id: row.product.id, quantity: newQty, low_stock_threshold: 50 })
      }
      toast.success(`Adjusted ${row.product.name} to ${newQty} units`)
      closeModal()
      fetchData()
    } catch (err) {
      console.error('Adjust stock failed:', err)
      toast.error(err.message || 'Failed to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  const lowStock = rows.filter(r => r.min > 0 && r.stock < r.min)
  const outOfStock = rows.filter(r => r.stock === 0)

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
        <button className="btn-secondary mt-3 text-xs" onClick={fetchData}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">{rows.length} SKUs · {outOfStock.length} out of stock · {lowStock.length} low stock</p>
      </div>

      {/* Out of stock alerts */}
      {outOfStock.length > 0 && (
        <div className="card p-4 border-l-4 border-l-red-400 flex items-start gap-3">
          <MdWarning size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Out of Stock</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {outOfStock.map(s => `${s.product.name} (0 left)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-400 flex items-start gap-3">
          <MdWarning size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Low Stock Alert</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {lowStock.map(s => `${s.product.name} (${s.stock} left)`).join(' · ')}
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
              <th>Category</th>
              <th>Stock</th>
              <th>Status</th>
              {canManage && <th className="text-right">Manage</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isOut = row.stock === 0
              const isLow = !isOut && row.min > 0 && row.stock < row.min
              return (
                <tr key={row.product.id}>
                  <td className="font-medium">{row.product.name}</td>
                  <td className="font-mono text-xs text-gray-500">{row.product.sku || '-'}</td>
                  <td className="text-xs text-gray-500">{row.product.category || '-'}</td>
                  <td className="font-bold text-lg">{row.stock}</td>
                  <td>
                    {isOut ? (
                      <span className="badge-danger">Out</span>
                    ) : isLow ? (
                      <span className="badge-warning">Low</span>
                    ) : (
                      <span className="badge-success">OK</span>
                    )}
                  </td>
                  {canManage && (
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button className="btn-secondary text-xs" title="Add stock" onClick={() => openModal('add', row)}>
                          <MdAdd size={12} /> Add
                        </button>
                        <button className="btn-secondary text-xs" title="Remove stock" onClick={() => openModal('remove', row)}>
                          <MdRemove size={12} /> Remove
                        </button>
                        <button className="btn-secondary text-xs" title="Adjust stock" onClick={() => openModal('adjust', row)}>
                          <MdTune size={12} /> Adjust
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="card p-12 text-center">
          <MdInventory2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No products</p>
        </div>
      )}

      {/* Manage Stock modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {modal.type === 'add' && 'Add Stock'}
                {modal.type === 'remove' && 'Remove Stock'}
                {modal.type === 'adjust' && 'Adjust Stock'}
              </h3>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Product: <span className="font-semibold">{modal.row.product.name}</span>
              <br />
              Current stock: <span className="font-semibold">{modal.row.stock} units</span>
            </p>

            {modal.type === 'adjust' ? (
              <>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New quantity</label>
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="input w-full mb-4"
                  placeholder="e.g. 50"
                />
              </>
            ) : (
              <>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {modal.type === 'remove' ? 'Quantity to remove' : 'Quantity to add'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="input w-full mb-4"
                  placeholder="e.g. 20"
                />
              </>
            )}

            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {modal.type === 'remove' || modal.type === 'adjust' ? 'Reason *' : 'Notes (optional)'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full mb-5"
              placeholder={modal.type === 'remove' ? 'e.g. damaged, expired' : modal.type === 'adjust' ? 'e.g. recount, correction' : 'optional note'}
            />

            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={modal.type === 'add' ? handleAdd : modal.type === 'remove' ? handleRemove : handleAdjust} disabled={saving}>
                {saving ? 'Saving...' : modal.type === 'add' ? 'Add Stock' : modal.type === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
              </button>
              <button className="btn-secondary flex-1" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
