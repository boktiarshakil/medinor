import { Fragment, useState, useEffect } from 'react'
import { formatCurrency } from '../lib/utils'
import {
  MdAccountBalance,
  MdCheckCircle,
  MdExpandMore,
  MdHourglassEmpty,
  MdInfo,
  MdReceipt,
  MdShield,
  MdTrendingUp,
  MdWarning,
} from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Settlements() {
  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Self-heal first: any fully-paid invoice without a settlement gets one
      // recorded automatically, so the page always reflects the real books.
      const created = await api.reconcileSettlements().catch(err => {
        console.warn('Settlement reconcile failed:', err)
        return 0
      })
      const [ordersData, invoicesData, productsData, usersData, settlementsData] = await Promise.all([
        api.getOrders(),
        api.getInvoices(),
        api.getProducts(),
        api.getUsers().catch(() => []),
        api.getSettlements(),
      ])
      setOrders(ordersData.filter(o => o.status === 'delivered' || o.status === 'completed'))
      setInvoices(invoicesData)
      setProducts(productsData)
      setUsers(usersData)
      setSettlements(settlementsData)
      if (created > 0) {
        toast.success(`${created} settlement${created > 1 ? 's' : ''} auto-recorded`)
      }
    } catch (err) {
      console.error('Settlements fetch failed:', err)
      toast.error('Failed to load settlement data')
    } finally {
      setLoading(false)
    }
  }

  const userName = (id) => {
    const u = users.find(x => x.id === id)
    return u ? (u.full_name || u.email) : (id ? String(id).slice(0, 8) : '—')
  }

  const productName = (id) => {
    const p = products.find(x => x.id === id)
    return p ? p.name : (id ? String(id).slice(0, 8) : '—')
  }

  const invoiceByOrder = {}
  invoices.forEach(inv => { if (inv.order_id) invoiceByOrder[inv.order_id] = inv })

  const settledByOrder = {}
  settlements.forEach(s => { if (s.order_id) settledByOrder[s.order_id] = s })

  const allRows = (orders || []).map(order => {
    const invoice = invoiceByOrder[order.id]
    const settlement = settledByOrder[order.id]
    const paid = invoice ? Number(invoice.paid_amount || 0) : 0
    const due = invoice ? Number(invoice.due_amount ?? (invoice.total_amount || 0)) : 0
    const status = settlement
      ? 'settled'
      : invoice?.status === 'paid'
        ? 'queued'
        : invoice?.status === 'partial'
          ? 'partial'
          : 'unpaid'
    return { order, invoice, settlement, paid, due, status }
  })

  const pendingRows = allRows.filter(r => r.status !== 'settled')

  const totalCollected = settlements.reduce((sum, s) => sum + (Number(s.total_collected) || 0), 0)
  const totalCompanyShare = settlements.reduce((sum, s) => sum + (Number(s.company_amount) || 0), 0)
  const totalDealerMargin = settlements.reduce((sum, s) => sum + (Number(s.dealer_margin_amount) || 0), 0)
  const totalOutstanding = allRows.reduce((sum, r) => sum + r.due, 0)

  const badge = (status) => {
    switch (status) {
      case 'settled':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <MdCheckCircle size={14} /> Auto-settled
          </span>
        )
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
            <MdWarning size={14} /> Paid — queued
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
            Partial paid
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
            <MdHourglassEmpty size={14} /> Not paid
          </span>
        )
    }
  }

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
        <p className="text-sm text-gray-500">Settlement auto-files the moment an invoice is fully paid</p>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <MdInfo size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-800 mb-1">How Auto Settlement Works</p>
            <ul className="text-[11px] text-blue-700 space-y-0.5">
              <li>• A settlement is created <strong>automatically</strong> when an invoice is fully paid</li>
              <li>• Company gets its <strong>trade-price share</strong>, dealer keeps the remaining <strong>margin</strong></li>
              <li>• One settlement per invoice — <strong>no manual entry</strong>, no double booking</li>
              <li>• Dealer <strong>cannot see</strong> company cost. SR <strong>cannot see</strong> the dealer's purchase price.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <MdWarning size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Outstanding Due</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
        <MdShield size={16} className="text-emerald-500" />
        <span><strong>Price isolation active:</strong> SR sees trade price only. Dealer sees dealer price + MRP.</span>
      </div>

      {allRows.length === 0 ? (
        <div className="card p-12 text-center">
          <MdReceipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No delivered or completed orders yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-bold text-gray-900">Settlement Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">{allRows.length - pendingRows.length} settled · {pendingRows.length} awaiting payment</p>
          </div>
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Dealer</th>
                  <th>SR</th>
                  <th>Invoice #</th>
                  <th>Invoice Status</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Company</th>
                  <th>Dealer Margin</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allRows.map(({ order, invoice, settlement, paid, due, status }) => (
                  <Fragment key={order.id}>
                    <tr>
                      <td className="font-mono text-xs font-medium">{order.order_number}</td>
                      <td className="text-xs">{order.dealer?.name || '—'}</td>
                      <td className="text-xs text-gray-500">{userName(order.sr_id) || '—'}</td>
                      <td className="font-mono text-xs">{invoice?.invoice_number || '—'}</td>
                      <td className="text-xs">{invoice?.status || '—'}</td>
                      <td className="font-semibold text-xs">{formatCurrency(paid)}</td>
                      <td className="font-semibold text-xs text-red-600">{formatCurrency(due)}</td>
                      <td className="text-xs text-emerald-600 font-medium">{settlement ? formatCurrency(settlement.company_amount) : '—'}</td>
                      <td className="text-xs text-purple-600 font-medium">{settlement ? formatCurrency(settlement.dealer_margin_amount) : '—'}</td>
                      <td className="text-xs">{badge(status)}</td>
                      <td className="text-right">
                        {settlement?.item_breakdown?.length ? (
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="inline-flex items-center gap-0.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            <MdExpandMore size={14} className={expandedId === order.id ? 'rotate-180 transition-transform' : 'transition-transform'} />
                            {expandedId === order.id ? 'Hide' : 'View'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {expandedId === order.id && settlement?.item_breakdown?.length > 0 && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={11} className="bg-gray-50 px-5 py-3">
                          <div className="text-[11px] text-gray-700 space-y-1 max-w-2xl">
                            {settlement.item_breakdown.map((it, i) => (
                              <div key={i} className="flex items-center justify-between gap-4 border-b border-gray-200 pb-1">
                                <span className="flex-1 truncate">{productName(it.product_id)}</span>
                                <span className="text-gray-400">{it.quantity} × {formatCurrency(it.trade_price)}</span>
                                <span className="font-semibold w-20 text-right">{formatCurrency(it.trade_subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}