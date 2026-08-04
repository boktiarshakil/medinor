import { useState } from 'react'
import { MdCheckCircle, MdRadioButtonUnchecked, MdLocalShipping, MdReceipt, MdInventory, MdHandshake, MdOutlinePlace, MdSend, MdPayment } from 'react-icons/md'
import { formatDateTime } from '../../lib/utils'

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: MdOutlinePlace, description: 'Order submitted by dealer/SR' },
  { key: 'approved', label: 'Approved', icon: MdCheckCircle, description: 'Approved by management' },
  { key: 'accounts', label: 'Accounts', icon: MdReceipt, description: 'Billing verified, invoice generated' },
  { key: 'warehouse', label: 'Warehouse', icon: MdInventory, description: 'Packed and ready for dispatch' },
  { key: 'dispatched', label: 'Dispatched', icon: MdLocalShipping, description: 'Handed to delivery' },
  { key: 'delivered', label: 'Delivered', icon: MdHandshake, description: 'Received by dealer' },
  { key: 'payment', label: 'Payment Received', icon: MdPayment, description: 'Payment confirmed' },
]

const MOCK_ORDERS = [
  {
    id: 'ORD-20250804-001',
    dealer: 'Medicine Point',
    amount: 15400,
    items: 3,
    currentStep: 4, // warehouse
    placedAt: '2025-08-04T09:00:00Z',
    comments: [
      { step: 'placed', user: 'Rahim Uddin', text: 'Urgent order — dealer needs by tomorrow', time: '2025-08-04T09:00:00Z' },
      { step: 'approved', user: 'Karim Ahmed', text: 'Approved. Credit limit OK.', time: '2025-08-04T09:30:00Z' },
      { step: 'accounts', user: 'Shakib (Accounts)', text: 'Invoice generated. 30% advance received.', time: '2025-08-04T10:00:00Z' },
      { step: 'warehouse', user: 'Hasan (Warehouse)', text: 'Packed. 3 boxes ready.', time: '2025-08-04T11:00:00Z' },
    ]
  },
  {
    id: 'ORD-20250804-002',
    dealer: 'Lazz Pharma',
    amount: 8750,
    items: 2,
    currentStep: 2, // accounts
    placedAt: '2025-08-04T10:15:00Z',
    comments: [
      { step: 'placed', user: 'Rahim Uddin', text: 'Regular restock', time: '2025-08-04T10:15:00Z' },
      { step: 'approved', user: 'Karim Ahmed', text: 'Approved', time: '2025-08-04T10:45:00Z' },
    ]
  },
  {
    id: 'ORD-20250803-003',
    dealer: 'HealthCare Ltd',
    amount: 22300,
    items: 5,
    currentStep: 6, // payment received
    placedAt: '2025-08-03T08:00:00Z',
    comments: [
      { step: 'placed', user: 'Karim Ahmed', text: 'Bulk order — hospital supply', time: '2025-08-03T08:00:00Z' },
      { step: 'approved', user: 'ASM', text: 'Approved with 10% discount', time: '2025-08-03T09:00:00Z' },
      { step: 'accounts', user: 'Accounts', text: 'Full payment via bank transfer', time: '2025-08-03T10:00:00Z' },
      { step: 'warehouse', user: 'Warehouse', text: 'Dispatched via Sundarbans Courier', time: '2025-08-03T14:00:00Z' },
      { step: 'delivered', user: 'Delivery', text: 'Delivered. Signed by receiver.', time: '2025-08-04T09:00:00Z' },
      { step: 'payment', user: 'Accounts', text: 'Payment cleared. Invoice closed.', time: '2025-08-04T10:00:00Z' },
    ]
  },
]

export default function OrderTracker() {
  const [selectedOrder, setSelectedOrder] = useState(MOCK_ORDERS[0])
  const [newComment, setNewComment] = useState('')

  const handleAddComment = (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    const stepKey = ORDER_STEPS[selectedOrder.currentStep]?.key || 'placed'
    setSelectedOrder({
      ...selectedOrder,
      comments: [...selectedOrder.comments, {
        step: stepKey,
        user: 'You',
        text: newComment,
        time: new Date().toISOString(),
      }]
    })
    setNewComment('')
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
          {MOCK_ORDERS.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedOrder.id === order.id
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
                  {ORDER_STEPS[order.currentStep]?.label || 'Processing'}
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
                <p className="text-xs text-gray-500">{selectedOrder.dealer} · {selectedOrder.items} items · Placed {formatDateTime(selectedOrder.placedAt)}</p>
              </div>
              <span className="text-lg font-bold text-brand-600">৳{selectedOrder.amount.toLocaleString()}</span>
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
              {selectedOrder.comments.map((c, i) => (
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
              ))}
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
