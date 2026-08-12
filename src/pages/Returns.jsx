import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdAssignmentReturn, MdAdd, MdClose, MdCheck, MdCancel } from 'react-icons/md'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Returns() {
  const { role } = useAuth()
  const canManage = ['super_admin', 'admin', 'sales_manager'].includes(role)
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [dealers, setDealers] = useState([])
  const [orders, setOrders] = useState([])
  const [newReturn, setNewReturn] = useState({
    dealer_id: '',
    order_id: '',
    reason: 'damaged',
    notes: '',
    items: []
  })
  const [selectedOrderItems, setSelectedOrderItems] = useState([])

  const fetchReturns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getReturns()
      setReturns(data)
    } catch (err) {
      console.error('Returns fetch failed:', err)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDealersAndOrders = async () => {
    try {
      const [dealerData, orderData] = await Promise.all([
        api.getDealers(),
        api.getOrders(),
      ])
      setDealers(dealerData)
      setOrders(orderData)
    } catch (err) {
      console.error('Failed to load dealers/orders:', err)
    }
  }

  useEffect(() => {
    fetchReturns()
    fetchDealersAndOrders()
  }, [])

  const handleOrderChange = (orderId) => {
    setNewReturn(prev => ({ ...prev, order_id: orderId }))
    const order = orders.find(o => o.id === orderId)
    setSelectedOrderItems(order?.items || [])
    setNewReturn(prev => ({
      ...prev,
      items: (order?.items || []).map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price || 0,
        reason: 'damaged'
      }))
    }))
  }

  const handleCreateReturn = async () => {
    if (!newReturn.dealer_id || !newReturn.order_id) {
      toast.error('Select a dealer and order')
      return
    }
    if (newReturn.items.length === 0) {
      toast.error('No items to return')
      return
    }
    setCreating(true)
    try {
      await api.createReturn({
        dealer_id: newReturn.dealer_id,
        order_id: newReturn.order_id,
        reason: newReturn.reason,
        notes: newReturn.notes || null,
        status: 'pending',
        total_amount: newReturn.items.reduce((sum, i) => sum + (i.quantity * (i.unit_price || 0)), 0)
      }, newReturn.items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        reason: i.reason || 'damaged'
      })))
      toast.success('Return request submitted')
      setShowCreate(false)
      setNewReturn({ dealer_id: '', order_id: '', reason: 'damaged', notes: '', items: [] })
      setSelectedOrderItems([])
      fetchReturns()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleApprove = async (r) => {
    if (!window.confirm(`Approve return ${r.return_number || r.id}? Stock will be restored.`)) return
    try {
      await api.updateReturnStatus(r.id, 'approved')
      toast.success('Return approved — stock restored')
      fetchReturns()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleReject = async (r) => {
    if (!window.confirm(`Reject return ${r.return_number || r.id}?`)) return
    try {
      await api.updateReturnStatus(r.id, 'rejected')
      toast.success('Return rejected')
      fetchReturns()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading returns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Returns</h1>
          <p className="text-sm text-gray-500">{returns.length} return requests</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> New Return
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Return #</th>
              <th>Dealer</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              {canManage && <th className="text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{r.return_number || `RET-${String(r.id).slice(0, 8).toUpperCase()}`}</td>
                <td className="font-medium">{r.dealer?.name || r.dealer_name || '-'}</td>
                <td className="capitalize text-gray-600">{(r.reason || '').replace(/_/g, ' ')}</td>
                <td className="font-semibold">{formatCurrency(r.total_amount || r.amount || 0)}</td>
                <td><span className={statusColor(r.status)}>{statusLabel(r.status)}</span></td>
                <td className="text-gray-500">{formatDate(r.created_at || r.date)}</td>
                {canManage && (
                  <td className="text-right">
                    {r.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <button className="btn-secondary text-xs" title="Approve" onClick={() => handleApprove(r)}>
                          <MdCheck size={12} /> Approve
                        </button>
                        <button className="btn-secondary text-xs" title="Reject" onClick={() => handleReject(r)}>
                          <MdCancel size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {returns.length === 0 && (
        <div className="card p-12 text-center">
          <MdAssignmentReturn size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No return requests</p>
        </div>
      )}

      {/* Create Return Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">New Return Request</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create a product return request</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Dealer *</label>
                <select className="input" value={newReturn.dealer_id} onChange={(e) => setNewReturn({ ...newReturn, dealer_id: e.target.value })}>
                  <option value="">Select dealer...</option>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Order *</label>
                <select className="input" value={newReturn.order_id} onChange={(e) => handleOrderChange(e.target.value)}>
                  <option value="">Select order...</option>
                  {orders
                    .filter(o =>
                      (!newReturn.dealer_id || o.dealer_id === newReturn.dealer_id) &&
                      ['delivered', 'completed'].includes(o.status)
                    )
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.order_number || o.order_no || o.id} — {o.dealer?.name || o.dealer_name || ''} ({o.status})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Reason *</label>
                <select className="input" value={newReturn.reason} onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}>
                  <option value="damaged">Damaged Product</option>
                  <option value="wrong_product">Wrong Product Shipped</option>
                  <option value="expired">Expired Product</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Order Items */}
              {selectedOrderItems.length > 0 && (
                <div>
                  <label className="label">Items to Return</label>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50">
                    {selectedOrderItems.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{item.product?.name || item.product_name || 'Unknown'}</p>
                          <p className="text-[10px] text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          className="w-16 text-xs border border-gray-200 rounded px-2 py-1"
                          value={newReturn.items[idx]?.quantity ?? item.quantity}
                          onChange={(e) => {
                            const qty = Math.min(Number(e.target.value), item.quantity)
                            setNewReturn(prev => ({
                              ...prev,
                              items: prev.items.map((ri, i) => i === idx ? { ...ri, quantity: qty } : ri)
                            }))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} placeholder="Any additional notes..."
                  value={newReturn.notes} onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })} />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreateReturn} disabled={creating || !newReturn.dealer_id || !newReturn.order_id} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Submit Return</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
