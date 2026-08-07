import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdAdd, MdSearch, MdFilterList, MdVisibility, MdShoppingCart, MdRefresh, MdClose, MdDelete, MdCheck, MdLocalShipping, MdInventory, MdHandshake, MdReceipt } from 'react-icons/md'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NEXT_ACTIONS = {
  submitted: { status: 'approved', label: 'Approve', icon: MdCheck, roles: ['super_admin', 'admin', 'sales_manager'] },
  approved: { status: 'packed', label: 'Pack', icon: MdInventory, roles: ['super_admin', 'admin', 'warehouse'] },
  packed: { status: 'dispatched', label: 'Dispatch', icon: MdLocalShipping, roles: ['super_admin', 'admin', 'warehouse'] },
  dispatched: { status: 'delivered', label: 'Deliver', icon: MdHandshake, roles: ['super_admin', 'admin', 'warehouse'] },
  delivered: { status: 'completed', label: 'Complete', icon: MdCheck, roles: ['super_admin', 'admin'] },
}

const CANCEL_ACTION = { status: 'cancelled', label: 'Cancel', icon: MdDelete, roles: ['super_admin', 'admin'] }
const CANCELABLE_STATUSES = ['submitted', 'approved', 'packed', 'dispatched']

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [dealers, setDealers] = useState([])
  const [products, setProducts] = useState([])
  const [orderDraft, setOrderDraft] = useState({
    dealer_id: '',
    sr_id: '',
    area_id: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    notes: '',
  })

  const statuses = ['all', 'draft', 'submitted', 'approved', 'packed', 'dispatched', 'delivered', 'completed', 'cancelled']

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, users] = await Promise.all([
        api.getOrders(),
        api.getUsers().catch(() => []),
      ])
      const userMap = {}
      users.forEach(u => { userMap[u.id] = u.full_name || u.email })
      const mapped = (data || []).map(order => ({
        id: order.id,
        number: order.order_number || order.order_no || order.id,
        dealer: order.dealer?.name || order.dealer_name || 'Unknown',
        sr: userMap[order.sr_id] || 'Unassigned',
        amount: order.net_amount || order.total_amount || order.amount || 0,
        items: (order.items || []).length,
        status: order.status,
        date: order.created_at,
        _raw: order,
      }))
      setOrders(mapped)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchDealersAndProducts()
  }, [])

  const fetchDealersAndProducts = async () => {
    try {
      const [dealerData, productData] = await Promise.all([
        api.getDealers(),
        api.getProducts(),
      ])
      setDealers(dealerData)
      setProducts(productData)
    } catch (err) {
      console.error('Failed to load dealers/products:', err)
    }
  }

  const addItem = () => {
    setOrderDraft(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0 }],
    }))
  }

  const removeItem = (index) => {
    setOrderDraft(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index, field, value) => {
    setOrderDraft(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'product_id') {
          const product = products.find(p => p.id === value)
          if (product) updated.unit_price = product.trade_price || product.mrp || 0
        }
        return updated
      }),
    }))
  }

  const handleCreateOrder = async () => {    if (!orderDraft.dealer_id) {
      toast.error('Select a dealer')
      return
    }
    const validItems = orderDraft.items.filter(i => i.product_id && i.quantity > 0)
    if (validItems.length === 0) {
      toast.error('Add at least one product')
      return
    }
    setCreating(true)
    try {
      const selectedDealer = dealers.find(d => d.id === orderDraft.dealer_id)
      const totalAmount = validItems.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
      await api.createOrder(
        {
          dealer_id: orderDraft.dealer_id,
          sr_id: user?.id || orderDraft.sr_id || null,
          area_id: selectedDealer?.area_id || orderDraft.area_id || null,
          status: 'submitted',
          total_amount: totalAmount,
          net_amount: totalAmount,
          notes: orderDraft.notes || null,
        },
        validItems.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total: i.quantity * i.unit_price,
        }))
      )
      toast.success('Order created')
      setShowCreate(false)
      setOrderDraft({ dealer_id: '', sr_id: '', area_id: '', items: [{ product_id: '', quantity: 1, unit_price: 0 }], notes: '' })
      fetchOrders()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleAdvance = async (order, action) => {
    if (!window.confirm(`Move order ${order.number} to "${action.label}"?`)) return
    try {
      const { order: updated, invoice } = await api.updateOrderStatus(order._raw.id, action.status)
      const newStatus = updated?.status || action.status
      toast.success(
        newStatus === 'delivered'
          ? `Order delivered. Invoice ${invoice?.invoice_number ? invoice.invoice_number + ' ' : ''}auto-generated.`
          : `Order moved to "${statusLabel(newStatus)}"`
      )
      setSelectedOrder(null)
      fetchOrders()
    } catch (err) {
      toast.error('Failed to update: ' + err.message)
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.number.toLowerCase().includes(search.toLowerCase()) || o.dealer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders · {formatCurrency(orders.reduce((s, o) => s + o.amount, 0))} total value</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={fetchOrders} disabled={loading}>
            <MdRefresh size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <MdAdd size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card p-2 flex gap-1 overflow-x-auto">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {s === 'all' ? `All (${orders.length})` : `${statusLabel(s)} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by order # or dealer..."
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card p-6 text-center border-l-4 border-l-red-400">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button className="btn-secondary mt-3 text-xs" onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Dealer</th>
                <th>SR</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className="font-mono text-xs font-semibold text-brand-600">{order.number}</td>
                  <td className="font-medium">{order.dealer}</td>
                  <td className="text-gray-500">{order.sr}</td>
                  <td className="text-gray-500">{order.items}</td>
                  <td className="font-semibold">{formatCurrency(order.amount)}</td>
                  <td><span className={statusColor(order.status)}>{statusLabel(order.status)}</span></td>
                  <td className="text-gray-500">{formatDate(order.date)}</td>
                  <td>
                    <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                      <MdVisibility size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No orders found</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedOrder.number}</h3>
                <p className="text-xs text-gray-500">{selectedOrder.dealer}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Status</p>
                  <span className={statusColor(selectedOrder.status)}>{statusLabel(selectedOrder.status)}</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">SR</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedOrder.sr}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Amount</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedOrder.date)}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Items ({selectedOrder.items})</p>
                {(selectedOrder._raw?.items || []).length === 0 ? (
                  <p className="text-xs text-gray-400">No item details</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {selectedOrder._raw.items.map(item => (
                      <div key={item.id} className="py-2 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{item.product?.name || item.product_name || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{formatCurrency(item.total_price || item.quantity * item.unit_price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                {(() => {
                  const action = NEXT_ACTIONS[selectedOrder.status]
                  if (!action || !action.roles.includes(user?.role)) return null
                  const ActionIcon = action.icon
                  const showInvoiceNotice = selectedOrder.status === 'dispatched'
                  return (
                    <button
                      onClick={() => handleAdvance(selectedOrder, action)}
                      className="btn-primary inline-flex items-center gap-2 text-xs"
                    >
                      <ActionIcon size={15} />
                      {action.label} Order
                      {showInvoiceNotice && <span className="opacity-80 text-[9px]">· invoice auto-generated</span>}
                    </button>
                  )
                })()}
                {CANCELABLE_STATUSES.includes(selectedOrder.status) && CANCEL_ACTION.roles.includes(user?.role) && (
                  <button
                    onClick={() => handleAdvance(selectedOrder, CANCEL_ACTION)}
                    className="btn-secondary inline-flex items-center gap-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <CANCEL_ACTION.icon size={15} />
                    Cancel Order
                  </button>
                )}
                <button onClick={() => setSelectedOrder(null)} className="btn-secondary text-xs">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create New Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add products and submit</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Dealer *</label>
                  <select className="input" value={orderDraft.dealer_id} onChange={(e) => setOrderDraft({ ...orderDraft, dealer_id: e.target.value })}>
                    <option value="">Select dealer...</option>
                    {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input type="text" className="input" placeholder="Optional notes"
                    value={orderDraft.notes} onChange={(e) => setOrderDraft({ ...orderDraft, notes: e.target.value })} />
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Order Items *</label>
                  <button type="button" onClick={addItem} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    <MdAdd size={14} /> Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {orderDraft.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <select className="input flex-1 text-xs" value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)}>
                        <option value="">Select product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                      <input type="number" className="input w-20 text-xs" placeholder="Qty" min="1" value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
                      <input type="number" className="input w-24 text-xs" placeholder="Price" value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} />
                      <span className="text-xs font-medium text-gray-600 w-24 text-right">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      {orderDraft.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)} className="p-1 text-red-400 hover:text-red-600">
                          <MdDelete size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2">
                  <p className="text-sm font-bold text-gray-900">
                    Total: {formatCurrency(orderDraft.items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0))}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreateOrder} disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Submit Order</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}