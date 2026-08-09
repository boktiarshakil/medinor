import { useState, useEffect } from 'react'
import { MdInventory2, MdWarning, MdAdd, MdRemove, MdTune, MdClose, MdSearch, MdCheckCircle, MdErrorOutline } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function Inventory() {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
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
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const rows = products.map(p => {
    const invRows = inventory.filter(i => i.product_id === p.id)
    const stock = invRows.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    const min = invRows.length ? Math.min(...invRows.map(i => Number(i.low_stock_threshold) || 0)) : 0
    return { product: p, invRows, stock, min }
  })

  const filtered = rows.filter(r =>
    r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.product.sku || '').toLowerCase().includes(search.toLowerCase())
  )

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

  const primaryInv = (row) => row.invRows[0] || null

  const handleAdd = async () => {
    const quantity = Number(qty)
    const row = modal?.row
    if (!row || !quantity || quantity <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    setSaving(true)
    try {
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
        notes: reason
      })
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
      toast.error(err.message || 'Failed to adjust stock')
    } finally {
      setSaving(false)
    }
  }

  const lowStock = rows.filter(r => r.min > 0 && r.stock > 0 && r.stock < r.min)
  const outOfStock = rows.filter(r => r.stock === 0)

  const statusBadge = (stock, min) => {
    if (stock === 0) return <span className="badge-danger">Out</span>
    if (min > 0 && stock < min) return <span className="badge-warning">Low</span>
    return <span className="badge-success">OK</span>
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{rows.length} SKUs · {outOfStock.length} out of stock · {lowStock.length} low stock</p>
        </div>
      </div>

      {/* Alerts */}
      {outOfStock.length > 0 && (
        <div className="card p-4 border-l-4 border-l-red-400 flex items-start gap-3">
          <MdErrorOutline size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Out of Stock</p>
            <p className="text-xs text-gray-600 mt-0.5">
              {outOfStock.map(s => `${s.product.name} (0 left)`).join(' · ')}
            </p>
          </div>
        </div>
      )}

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

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={modal?.filterStatus || 'all'}
          onChange={(e) => setModal(m => m ? { ...m, filterStatus: e.target.value } : { filterStatus: e.target.value })}
        >
          <option value="all">All Status</option>
          <option value="out">Out of Stock</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
      </div>

      {/* Table */}
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
            {filtered.map(row => (
              <tr key={row.product.id}>
                <td className="font-medium">{row.product.name}</td>
                <td className="font-mono text-xs text-gray-500">{row.product.sku || '-'}</td>
                <td className="text-xs text-gray-500">{row.product.category || '-'}</td>
                <td className="font-bold text-lg">{row.stock}</td>
                <td>{statusBadge(row.stock, row.min)}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdInventory2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      )}

      {/* Manage Stock modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {modal.type === 'add' && 'Add Stock'}
                  {modal.type === 'remove' && 'Remove Stock'}
                  {modal.type === 'adjust' && 'Adjust Stock'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{modal.row.product.name}</p>
              </div>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="card p-3 bg-gray-50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <MdInventory2 size={18} className="text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current stock</p>
                  <p className="text-lg font-bold text-gray-900">{modal.row.stock} units</p>
                </div>
              </div>

              {modal.type === 'adjust' ? (
                <div>
                  <label className="label">New quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="input"
                    placeholder="e.g. 50"
                  />
                </div>
              ) : (
                <div>
                  <label className="label">
                    {modal.type === 'remove' ? 'Quantity to remove' : 'Quantity to add'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="input"
                    placeholder="e.g. 20"
                  />
                </div>
              )}

              <div>
                <label className="label">
                  {modal.type === 'remove' || modal.type === 'adjust' ? 'Reason *' : 'Notes (optional)'}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  placeholder={modal.type === 'remove' ? 'e.g. damaged, expired' : modal.type === 'adjust' ? 'e.g. recount, correction' : 'optional note'}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button className="btn-primary flex-1" onClick={modal.type === 'add' ? handleAdd : modal.type === 'remove' ? handleRemove : handleAdjust} disabled={saving}>
                  {saving ? 'Saving...' : modal.type === 'add' ? 'Add Stock' : modal.type === 'remove' ? 'Remove Stock' : 'Adjust Stock'}
                </button>
                <button className="btn-secondary flex-1" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
