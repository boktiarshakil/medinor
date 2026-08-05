import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, calculateSettlement } from '../lib/utils'
import { MdAccountBalance, MdCheckCircle, MdInfo, MdReceipt, MdTrendingUp, MdShield } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Settlements() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersData, productsData] = await Promise.all([
        api.getOrders(),
        api.getProducts()
      ])
      setOrders(ordersData.filter(o => o.status === 'payment_received' || o.status === 'delivered' || o.status === 'completed'))
      setProducts(productsData)
    } catch (err) {
      console.error('Settlements fetch failed:', err)
      toast.error('Failed to load settlement data')
    } finally {
      setLoading(false)
    }
  }

  const getSettlement = (order) => {
    const items = (order.items || []).map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
    return calculateSettlement(items, products)
  }

  const allSettlements = orders.map(order => ({
    order,
    settlement: getSettlement(order),
  }))

  const totalCompanyShare = allSettlements.reduce((sum, s) => sum + s.settlement.company_total, 0)
  const totalDealerMargin = allSettlements.reduce((sum, s) => sum + s.settlement.dealer_margin_total, 0)
  const totalCollected = allSettlements.reduce((sum, s) => sum + s.settlement.grand_total, 0)

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading settlements...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Auto Settlements</h1>
        <p className="text-sm text-gray-500">Payment auto-split: company share + dealer margin</p>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <MdInfo size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1">How Auto Settlement Works</p>
            <ul className="text-[11px] text-blue-700 space-y-0.5">
              <li>• SR collects payment from customer at <strong>dealer price</strong></li>
              <li>• System auto-splits: company gets <strong>trade price</strong>, dealer keeps <strong>margin</strong></li>
              <li>• Dealer <strong>cannot see</strong> company cost. SR <strong>cannot see</strong> dealer's purchase price.</li>
              <li>• Margin credited to dealer wallet <strong>automatically</strong></li>
            </ul>
          </div>
        </div>
      </div>

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

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
        <MdShield size={16} className="text-emerald-500" />
        <span><strong>Price isolation active:</strong> SR sees trade price only. Dealer sees dealer price + MRP.</span>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <MdReceipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No settled orders yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Settlements</h3>
            <p className="text-xs text-gray-400 mt-0.5">{orders.length} orders settled</p>
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
                </tr>
              </thead>
              <tbody>
                {allSettlements.map(({ order, settlement }) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs font-medium">{order.order_number}</td>
                    <td className="text-xs">{order.dealer?.name || '—'}</td>
                    <td className="text-xs text-gray-500">{order.sr_name || order.sr_id || '—'}</td>
                    <td className="font-semibold text-xs">{formatCurrency(settlement.grand_total)}</td>
                    <td className="text-xs text-emerald-600 font-medium">{formatCurrency(settlement.company_total)}</td>
                    <td className="text-xs text-purple-600 font-medium">{formatCurrency(settlement.dealer_margin_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
