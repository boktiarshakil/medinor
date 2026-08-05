import { useState } from 'react'
import { formatCurrency, formatDate, calculateSettlement, formatSettlementSummary } from '../lib/utils'
import { MdAccountBalance, MdCheckCircle, MdInfo, MdReceipt, MdTrendingUp, MdShield } from 'react-icons/md'

// Demo data — replace with Supabase fetch
const DEMO_ORDERS = [
  { id: 'ord-001', order_number: 'ORD-2025-001', dealer_id: 'd1', dealer_name: 'Medicine Point', sr_id: 'sr1', sr_name: 'Rahim Uddin', total_amount: 15400, status: 'payment_received', date: '2025-01-15' },
  { id: 'ord-002', order_number: 'ORD-2025-002', dealer_id: 'd2', dealer_name: 'Lazz Pharma', sr_id: 'sr1', sr_name: 'Rahim Uddin', total_amount: 8750, status: 'payment_received', date: '2025-01-14' },
  { id: 'ord-003', order_number: 'ORD-2025-003', dealer_id: 'd3', dealer_name: 'HealthCare Ltd', sr_id: 'sr2', sr_name: 'Karim Ahmed', total_amount: 22300, status: 'payment_received', date: '2025-01-14' },
]

const DEMO_PRODUCTS = [
  { id: '1', name: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', purchase_price: 550, trade_price: 650, dealer_price: 700, mrp: 750 },
  { id: '2', name: 'Mediron Blood Glucose Test Strip (25 pcs)', sku: 'MED-TST-025', purchase_price: 220, trade_price: 280, dealer_price: 300, mrp: 350 },
  { id: '3', name: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', purchase_price: 400, trade_price: 500, dealer_price: 550, mrp: 600 },
  { id: '4', name: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', purchase_price: 120, trade_price: 160, dealer_price: 180, mrp: 200 },
  { id: '6', name: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', purchase_price: 950, trade_price: 1200, dealer_price: 1300, mrp: 1500 },
]

// Simulated order items for demo
const ORDER_ITEMS = {
  'ord-001': [
    { product_id: '1', quantity: 10 },
    { product_id: '2', quantity: 20 },
  ],
  'ord-002': [
    { product_id: '4', quantity: 30 },
    { product_id: '3', quantity: 10 },
  ],
  'ord-003': [
    { product_id: '6', quantity: 15 },
    { product_id: '2', quantity: 10 },
  ],
}

export default function Settlements() {
  const [selectedOrder, setSelectedOrder] = useState(null)

  const getSettlement = (orderId) => {
    const items = ORDER_ITEMS[orderId] || []
    return calculateSettlement(items, DEMO_PRODUCTS)
  }

  const allSettlements = DEMO_ORDERS.map(order => ({
    order,
    settlement: getSettlement(order.id),
  }))

  const totalCompanyShare = allSettlements.reduce((sum, s) => sum + s.settlement.company_total, 0)
  const totalDealerMargin = allSettlements.reduce((sum, s) => sum + s.settlement.dealer_margin_total, 0)
  const totalCollected = allSettlements.reduce((sum, s) => sum + s.settlement.grand_total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Auto Settlements</h1>
        <p className="text-sm text-gray-500">Payment auto-split: company share + dealer margin</p>
      </div>

      {/* How it works */}
      <div className="card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <MdInfo size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1">How Auto Settlement Works</p>
            <ul className="text-[11px] text-blue-700 space-y-0.5">
              <li>• SR collects payment from customer at <strong>dealer price</strong></li>
              <li>• System auto-splits: company gets <strong>trade price</strong>, dealer keeps <strong>margin</strong></li>
              <li>• Dealer <strong>cannot see</strong> company cost. SR <strong>cannot see</strong> dealer's purchase price.</li>
              <li>• Margin credited to dealer wallet <strong>automatically</strong> — no manual reconciliation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <MdAccountBalance size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Company Share</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalCompanyShare)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <MdTrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Dealer Margins</p>
              <p className="text-lg font-bold text-purple-700">{formatCurrency(totalDealerMargin)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <MdReceipt size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Total Collected</p>
              <p className="text-lg font-bold text-brand-700">{formatCurrency(totalCollected)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price Isolation Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
        <MdShield size={16} className="text-emerald-500" />
        <span><strong>Price isolation active:</strong> SR sees trade price only. Dealer sees dealer price + MRP. No cross-tier visibility.</span>
      </div>

      {/* Settlements Table */}
      <div className="card">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-gray-900">Recent Settlements</h3>
          <p className="text-xs text-gray-400 mt-0.5">Auto-processed on payment receipt</p>
        </div>
        <div className="table-container border-0 rounded-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Dealer</th>
                <th>SR</th>
                <th>Total</th>
                <th>Company</th>
                <th>Dealer Margin</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allSettlements.map(({ order, settlement }) => (
                <tr key={order.id}>
                  <td className="font-mono text-xs font-medium">{order.order_number}</td>
                  <td className="text-xs">{order.dealer_name}</td>
                  <td className="text-xs text-gray-500">{order.sr_name}</td>
                  <td className="font-semibold text-xs">{formatCurrency(settlement.grand_total)}</td>
                  <td className="text-xs text-emerald-600 font-medium">{formatCurrency(settlement.company_total)}</td>
                  <td className="text-xs text-purple-600 font-medium">{formatCurrency(settlement.dealer_margin_total)}</td>
                  <td>
                    <span className="badge-success text-[9px] flex items-center gap-1 w-fit">
                      <MdCheckCircle size={10} /> Settled
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className="text-xs text-brand-600 font-semibold hover:underline"
                    >
                      {selectedOrder === order.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Breakdown */}
      {selectedOrder && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            Settlement Breakdown — {DEMO_ORDERS.find(o => o.id === selectedOrder)?.order_number}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Product</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Trade Price</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Dealer Price</th>
                  <th className="text-right py-2 text-emerald-600 font-medium">Company Gets</th>
                  <th className="text-right py-2 text-purple-600 font-medium">Dealer Earns</th>
                </tr>
              </thead>
              <tbody>
                {getSettlement(selectedOrder).items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium">{item.product_name}</td>
                    <td className="py-2.5 text-right">{item.quantity}</td>
                    <td className="py-2.5 text-right">{formatCurrency(item.trade_price)}</td>
                    <td className="py-2.5 text-right">{formatCurrency(item.dealer_price)}</td>
                    <td className="py-2.5 text-right text-emerald-600 font-semibold">{formatCurrency(item.company_share)}</td>
                    <td className="py-2.5 text-right text-purple-600 font-semibold">{formatCurrency(item.dealer_margin)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan="4" className="py-3 font-bold text-gray-700">Total</td>
                  <td className="py-3 text-right font-bold text-emerald-700">{formatCurrency(getSettlement(selectedOrder).company_total)}</td>
                  <td className="py-3 text-right font-bold text-purple-700">{formatCurrency(getSettlement(selectedOrder).dealer_margin_total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
