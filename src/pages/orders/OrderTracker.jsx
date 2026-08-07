import { useState, useEffect } from 'react'
import { MdCheckCircle, MdRadioButtonUnchecked, MdLocalShipping, MdReceipt, MdInventory, MdHandshake, MdOutlinePlace, MdSend, MdPayment, MdRefresh } from 'react-icons/md'
import { formatDateTime } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: MdOutlinePlace, description: 'Order submitted by dealer/SR' },
  { key: 'approved', label: 'Approved', icon: MdCheckCircle, description: 'Approved by management' },
  { key: 'accounts', label: 'Accounts', icon: MdReceipt, description: 'Billing verified, invoice generated' },
  { key: 'warehouse', label: 'Warehouse', icon: MdInventory, description: 'Packed and ready for dispatch' },
  { key: 'dispatched', label: 'Dispatched', icon: MdLocalShipping, description: 'Handed to delivery' },
  { key: 'delivered', label: 'Delivered', icon: MdHandshake, description: 'Received by dealer' },
  { key: 'payment', label: 'Payment Received', icon: MdPayment, description: 'Payment confirmed' },
]

const STATUS_INDEX = {
  draft: 0,
  submitted: 1,
  approved: 2,
  packed: 3,
  dispatched: 4,
  delivered: 5,
  completed: 6,
}

const STEP_KEYS = ['placed', 'approved', 'accounts', 'warehouse', 'dispatched', 'delivered', 'payment']

function mapOrder(order, invoices, payments) {
  const invoice = invoices.find(inv => inv.order_id === order.id)
  const hasInvoice = !!invoice
  const orderPayments = invoice ? payments.filter(p => p.invoice_id === invoice.id) : []
  const hasPayment = orderPayments.length > 0

  const si = STATUS_INDEX[order.status] ?? 0
  const stepComplete = {
    placed: true,
    approved: si >= 1,        // submitted or beyond
    accounts: hasInvoice,     // invoice generated for this order
    warehouse: si >= 3,       // packed or beyond
    dispatched: si >= 4,      // dispatched or beyond
    delivered: si >= 5,       // delivered or beyond
    payment: hasPayment,      // payment recorded against invoice
  }
  let currentStep = STEP_KEYS.findIndex(k => !stepComplete[k])
  if (currentStep === -1) currentStep = STEP_KEYS.length

  return {
    id: order.order_number || order.order_no || order.id,
    dbId: order.id,
    dealer: order.dealer?.name || order.dealer_name || 'Unknown Dealer',
    sr: order.sr_name || null,
    amount: order.net_amount ?? order.total_amount ?? order.amount ?? 0,
    items: order.items?.length || order.order_items?.length || 0,
    currentStep,
    placedAt: order.created_at,
    status: order.status,
    hasInvoice,
    hasPayment,
    invoiceNumber: invoice?.invoice_number || null,
    comments: [],
  }
}

export default function OrderTracker() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [newComment, setNewComment] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const [allOrders, invoices, payments] = await Promise.all([
        api.getOrders(),
        api.getInvoices().catch(() => []),
        api.getPayments().catch(() => []),
      ])
      let data = allOrders
      if (user?.role === 'dealer') {
        const dealers = await api.getDealers().catch(() => [])
        const match = dealers.find(
          d => d.email && d.email.toLowerCase() === String(user?.email || '').toLowerCase()
        )
        if (match) data = data.filter(o => o.dealer_id === match.id)
        else data = []
      }
      const mapped = data.map(order => mapOrder(order, invoices, payments))
      setOrders(mapped)
      setSelectedOrder(prev => {
        if (prev) {
          const updated = mapped.find(o => o.dbId === prev.dbId)
          return updated || mapped[0] || null
        }
        return mapped[0] || null
      })
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user?.role, user?.email])

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim() || !selectedOrder) return
    const stepKey = ORDER_STEPS[Math.min(selectedOrder.currentStep, ORDER_STEPS.length - 1)]?.key || 'placed'
    setSelectedOrder({
      ...selectedOrder,
      comments: [...selectedOrder.comments, {
        step: stepKey,
        user: user?.full_name || 'You',
        text: newComment,
        time: new Date().toISOString(),
      }]
    })
    setNewComment('')
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdLocalShipping className="text-brand-600" size={22} />
            Order Tracker
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Track order status step-by-step with comments</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdLocalShipping className="text-brand-600" size={22} />
            Order Tracker
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Track order status step-by-step with comments</p>
        </div>
        <div className="card p-8 text-center">
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button onClick={fetchOrders} className="btn-primary inline-flex items-center gap-2">
            <MdRefresh size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdLocalShipping className="text-brand-600" size={22} />
            Order Tracker
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Track order status step-by-step with comments</p>
        </div>
        <div className="card p-8 text-center">
          <MdLocalShipping className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-sm text-gray-500 font-medium">No orders found</p>
          <p className="text-xs text-gray-400 mt-1">Orders will appear here once created.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MdLocalShipping className="text-brand-600" size={22} />
          Order Tracker
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Track order status step-by-step with comments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order List */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase">Active Orders</p>
          {orders.map(order => (
            <button
              key={order.dbId}
              onClick={() => setSelectedOrder(order)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedOrder?.dbId === order.dbId
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{order.id}</span>
                <span className="text-xs font-semibold text-brand-600">৳{order.amount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">{order.dealer} · {order.items} items</p>
              <div className="mt-1.5">
                <span className={`badge text-[9px] ${
                  order.currentStep >= 6 ? 'badge-success' : order.currentStep >= 4 ? 'badge-info' : 'badge-warning'
                }`}>
                  {ORDER_STEPS[Math.min(order.currentStep, ORDER_STEPS.length - 1)]?.label || 'Processing'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Order Detail + Steps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Info */}
          <div className="card p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedOrder.id}</h3>
                <p className="text-xs text-gray-500">
                  {selectedOrder.dealer}
                  {selectedOrder.sr && <> · SR: {selectedOrder.sr}</>} · {selectedOrder.items} items · Placed {formatDateTime(selectedOrder.placedAt)}
                </p>
              </div>
              <span className="text-lg font-bold text-brand-600">৳{selectedOrder.amount.toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedOrder.hasInvoice ? (
                <span className="badge badge-info text-[10px]">Invoice: {selectedOrder.invoiceNumber || 'Generated'}</span>
              ) : (
                <span className="badge badge-gray text-[10px]">No invoice yet</span>
              )}
              {selectedOrder.hasPayment ? (
                <span className="badge badge-success text-[10px]">Payment received</span>
              ) : (
                <span className="badge badge-gray text-[10px]">Payment pending</span>
              )}
            </div>
          </div>

          {/* Step Tracker */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Order Progress</h3>
            <div className="space-y-0">
              {ORDER_STEPS.map((step, i) => {
                const Icon = step.icon
                const isCompleted = i < selectedOrder.currentStep
                const isCurrent = i === selectedOrder.currentStep
                return (
                  <div key={step.key} className="flex gap-3">
                    {/* Line + Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-emerald-500 text-white' :
                        isCurrent ? 'bg-brand-500 text-white ring-4 ring-brand-100' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? <MdCheckCircle size={16} /> : <Icon size={16} />}
                      </div>
                      {i < ORDER_STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-4">
                      <p className={`text-xs font-semibold ${isCurrent ? 'text-brand-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-400">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comments Timeline */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Comments & Updates</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {selectedOrder.comments.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No comments yet. Add one below.</p>
              ) : (
                selectedOrder.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-600">
                      {c.user.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{c.user}</span>
                        <span className="badge-gray text-[9px]">{c.step}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
                      <span className="text-[10px] text-gray-400">{formatDateTime(c.time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
              <input
                className="input flex-1"
                placeholder="Add comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className="btn-primary px-3">
                <MdSend size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
