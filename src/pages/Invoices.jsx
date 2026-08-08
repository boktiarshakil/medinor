import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import {
  formatCurrency, formatDate, statusColor, statusLabel, generateInvoiceNo
} from '../lib/utils'
import {
  MdSearch, MdFileDownload, MdReceipt, MdAdd, MdSend, MdVisibility,
  MdPerson, MdLocationOn, MdPhone, MdClose, MdCheckCircle, MdDelete,
  MdRefresh, MdErrorOutline, MdPayments
} from 'react-icons/md'
import toast from 'react-hot-toast'

export default function Invoices() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [dealers, setDealers] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [savingPayment, setSavingPayment] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    dealerId: '',
    orderId: '',
    items: [],
    discount: 0,
    notes: '',
    dueDate: ''
  })
  const [createSuccess, setCreateSuccess] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invData, prodData, dealerData, ordersData] = await Promise.all([
        api.getInvoices(),
        api.getProductsWithStock(),
        api.getDealers(),
        api.getOrders().catch(() => []),
      ])
      let invoices = invData
      if (user?.role === 'dealer') {
        const match = dealerData.find(
          d => d.email && d.email.toLowerCase() === String(user?.email || '').toLowerCase()
        )
        invoices = match ? invoices.filter(inv => inv.dealer_id === match.id) : []
      } else if (user?.role === 'sales_executive') {
        const myDealerIds = new Set(
          dealerData.filter(d => d.assigned_sr_id === user?.id).map(d => d.id)
        )
        invoices = invoices.filter(inv => myDealerIds.has(inv.dealer_id))
      }
      setInvoices(invoices)
      setProducts(prodData)
      setDealers(dealerData)
      setAllOrders(ordersData)
    } catch (err) {
      console.error('Failed to fetch invoices data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const normalizedInvoice = (inv) => ({
    id: inv.id,
    number: inv.invoice_number || inv.number || inv.id,
    dealer: typeof inv.dealer === 'object' ? inv.dealer?.name : (inv.dealer_name || inv.dealer || '-'),
    amount: inv.total_amount || inv.amount || 0,
    paid: inv.paid_amount || inv.paid || 0,
    due: inv.due_amount || inv.due || (inv.total_amount - (inv.paid_amount || 0)),
    status: inv.status || 'unpaid',
    date: inv.invoice_date || inv.date || inv.created_at,
    dueDate: inv.due_date || inv.dueDate,
    createdBy: inv.creator?.full_name || inv.created_by_name || inv.createdBy || '-',
    area: inv.dealer?.area?.name || inv.area_name || inv.area || '-',
  })

  const filtered = (inv) => {
    const n = normalizedInvoice(inv)
    const matchSearch =
      n.number?.toLowerCase().includes(search.toLowerCase()) ||
      n.dealer?.toLowerCase().includes(search.toLowerCase()) ||
      n.createdBy?.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  }

  const getProductPrice = (product) =>
    product.dealer_price || product.trade_price || product.mrp || product.price || 0

  const addItem = (productId) => {
    const product = products.find(p => String(p.id) === String(productId))
    if (!product) return
    const existing = newInvoice.items.find(i => String(i.id) === String(product.id))
    const price = getProductPrice(product)
    const stock = product.stock ?? null
    if (existing) {
      setNewInvoice({
        ...newInvoice,
        items: newInvoice.items.map(i => String(i.id) === String(product.id) ? { ...i, qty: i.qty + 1 } : i)
      })
    } else {
      setNewInvoice({
        ...newInvoice,
        items: [...newInvoice.items, {
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          price,
          stock,
          qty: 1
        }]
      })
    }
  }

  const removeItem = (productId) => {
    setNewInvoice({ ...newInvoice, items: newInvoice.items.filter(i => String(i.id) !== String(productId)) })
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.map(i => String(i.id) === String(productId) ? { ...i, qty } : i)
    })
  }

  const subtotal = newInvoice.items.reduce((sum, i) => sum + (i.price * i.qty), 0)
  const discountAmount = Math.round(subtotal * (newInvoice.discount / 100))
  const total = subtotal - discountAmount

  const selectedDealer = dealers.find(d => String(d.id) === String(newInvoice.dealerId))

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!selectedDealer || newInvoice.items.length === 0) return
    setCreating(true)
    try {
      const invoice = {
        invoice_number: generateInvoiceNo(),
        dealer_id: selectedDealer.id,
        order_id: newInvoice.orderId || null,
        created_by: user?.id || null,
        amount: total,
        total_amount: total,
        vat_amount: 0,
        paid_amount: 0,
        due_amount: total,
        status: 'unpaid',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: newInvoice.dueDate || null,
        notes: newInvoice.notes || null,
      }
      await api.createInvoice(invoice)
      toast.success('Invoice created')
      setShowCreate(false)
      setNewInvoice({ dealerId: '', orderId: '', items: [], discount: 0, notes: '', dueDate: '' })
      fetchAll()
    } catch (err) {
      console.error('Invoice create failed:', err)
      toast.error('Failed: ' + (err.message || 'Could not create invoice'))
    } finally {
      setCreating(false)
    }
  }

  const handleRecordPayment = async () => {
    const inv = normalizedInvoice(selectedInvoice)
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount')
      return
    }
    if (amount > inv.due) {
      toast.error(`Amount exceeds due (${formatCurrency(inv.due)})`)
      return
    }
    setSavingPayment(true)
    try {
      const newPaid = (inv.paid || 0) + amount
      const newDue = (inv.total_amount || inv.amount) - newPaid
      await api.createPayment({
        invoice_id: selectedInvoice.id,
        dealer_id: selectedInvoice.dealer_id,
        collected_by: user?.id || null,
        amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString().split('T')[0],
        notes: null,
      })
      await api.updateInvoice(selectedInvoice.id, {
        paid_amount: newPaid,
        due_amount: newDue < 0 ? 0 : newDue,
        status: newDue <= 0 ? 'paid' : 'partial',
      })
      toast.success('Payment recorded')
      setShowPayment(false)
      setPaymentAmount('')
      setSelectedInvoice(null)
      fetchAll()
    } catch (err) {
      console.error('Payment failed:', err)
      toast.error('Failed: ' + (err.message || 'Could not record payment'))
    } finally {
      setSavingPayment(false)
    }
  }

  const handleExport = () => {
    const rows = filteredInvoices.map(inv => {
      const n = normalizedInvoice(inv)
      return [n.number, n.dealer, n.amount, n.paid, n.due, n.status, n.date]
    })
    const header = ['Invoice #', 'Dealer', 'Amount', 'Paid', 'Due', 'Status', 'Date']
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading invoices…</p>
      </div>
    )
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <MdErrorOutline size={28} className="text-red-500" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Failed to load data</p>
        <p className="text-xs text-gray-500 max-w-xs text-center">{error}</p>
        <button onClick={fetchAll} className="btn-primary mt-2">
          <MdRefresh size={16} /> Retry
        </button>
      </div>
    )
  }

  const filteredInvoices = invoices.filter(filtered)
  const totalDue = invoices.reduce((s, i) => s + (normalizedInvoice(i).due || 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">
            {invoices.length} invoices · {formatCurrency(totalDue)} outstanding
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExport}>
            <MdFileDownload size={16} /> Export
          </button>
          {['super_admin', 'admin', 'sales_manager'].includes(user?.role) && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <MdAdd size={16} /> Create Invoice
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by invoice #, dealer, or created by..."
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Hierarchy visibility note */}
      <div className="card p-3 bg-brand-50 border border-brand-100 flex items-center gap-2">
        <MdVisibility size={16} className="text-brand-600 flex-shrink-0" />
        <p className="text-xs text-brand-700">
          <span className="font-semibold">Hierarchy visibility:</span> Invoices created by you are visible to all above in organization hierarchy (ASM → RSM → NSM → Directors)
        </p>
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <div className="card p-12 text-center">
          <MdReceipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-600">
            {invoices.length === 0 ? 'No invoices yet' : 'No invoices found'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {invoices.length === 0
              ? 'Create your first invoice to get started'
              : 'Try adjusting your search'}
          </p>
          {invoices.length === 0 && ['super_admin', 'admin', 'sales_manager'].includes(user?.role) && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              <MdAdd size={16} /> Create Invoice
            </button>
          )}
        </div>
      )}

      {/* Invoices Table */}
      {filteredInvoices.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Dealer</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Date</th>
                <th>Created By</th>
                <th>Area</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => {
                const n = normalizedInvoice(inv)
                return (
                  <tr key={n.id}>
                    <td className="font-mono text-xs font-semibold text-brand-600">{n.number}</td>
                    <td className="font-medium">{n.dealer}</td>
                    <td className="font-semibold">{formatCurrency(n.amount)}</td>
                    <td className="text-emerald-600">{formatCurrency(n.paid)}</td>
                    <td className={n.due > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{formatCurrency(n.due)}</td>
                    <td><span className={statusColor(n.status)}>{statusLabel(n.status)}</span></td>
                    <td className="text-gray-500">{formatDate(n.date)}</td>
                    <td className="text-gray-500 text-xs">{n.createdBy}</td>
                    <td className="text-gray-500 text-xs">{n.area}</td>
                    <td>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      >
                        <MdVisibility size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (() => {
        const n = normalizedInvoice(selectedInvoice)
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{n.number}</h3>
                  <p className="text-xs text-gray-500">Invoice Detail</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 text-gray-400 hover:text-gray-600">
                  <MdClose size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Dealer</p>
                    <p className="text-sm font-bold text-gray-900">{n.dealer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Status</p>
                    <span className={statusColor(n.status)}>{statusLabel(n.status)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Amount</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(n.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Due</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(n.due)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Created By</p>
                    <p className="text-sm font-semibold text-gray-800">{n.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Area</p>
                    <p className="text-sm font-semibold text-gray-800">{n.area}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Date</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(n.date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Due Date</p>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(n.dueDate)}</p>
                  </div>
                </div>
                {/* Hierarchy chain */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Visible to (Hierarchy Chain)</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {['SR (You)', 'ASM', 'RSM', 'NSM', 'Directors'].map((level, i) => (
                      <div key={level} className="flex items-center gap-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          i === 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                        }`}>{level}</span>
                        {i < 4 && <span className="text-gray-300 text-[10px]">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {n.status !== 'paid' && n.status !== 'cancelled' && (
                  <button onClick={() => { setPaymentAmount(''); setPaymentMethod('cash'); setShowPayment(true) }} className="btn-primary w-full">
                    <MdPayments size={15} /> Record Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        )})()}

      {/* Record Payment Modal */}
      {showPayment && selectedInvoice && (() => {
        const n = normalizedInvoice(selectedInvoice)
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Record Payment</h3>
                  <p className="text-xs text-gray-500">{n.number} · due {formatCurrency(n.due)}</p>
                </div>
                <button onClick={() => setShowPayment(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <MdClose size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="label">Amount *</label>
                  <input type="number" min="1" max={n.due} className="input" placeholder="Enter amount"
                    value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    {['cash', 'bank', 'cheque', 'bkash', 'nagad', 'rocket', 'card', 'other'].map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowPayment(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleRecordPayment} disabled={savingPayment || !paymentAmount} className="btn-primary flex-1 disabled:opacity-50">
                    {savingPayment ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdPayments size={15} /> Confirm Payment</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create New Invoice</h3>
                <p className="text-xs text-gray-500">Invoice will be visible upward in hierarchy</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={18} />
              </button>
            </div>

              <form onSubmit={handleCreate} className="p-5 space-y-5">
                {/* Dealer Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Select Dealer *</label>
                  <select
                    className="input"
                    value={newInvoice.dealerId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dealerId: e.target.value })}
                    required
                  >
                    <option value="">Choose dealer...</option>
                    {dealers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.area || d.area_name || ''}</option>
                    ))}
                  </select>
                </div>

                {/* Link to Order (optional) */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Link to Order (optional)</label>
                  <select
                    className="input"
                    value={newInvoice.orderId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, orderId: e.target.value })}
                  >
                    <option value="">No order link</option>
                    {allOrders
                      .filter(o => !newInvoice.dealerId || String(o.dealer_id) === String(newInvoice.dealerId))
                      .map(o => (
                        <option key={o.id} value={o.id}>
                          {o.order_number || o.order_no || o.id} — {o.dealer?.name || o.dealer_name || ''} ({o.status})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Dealer Info */}
                {selectedDealer && (
                  <div className="p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1.5">
                      <MdPhone size={13} className="text-gray-400" />
                      <span className="text-xs text-gray-700">{selectedDealer.phone || selectedDealer.contact_number || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MdLocationOn size={13} className="text-gray-400" />
                      <span className="text-xs text-gray-700 truncate">{selectedDealer.address || '-'}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Credit Limit</p>
                      <p className="text-xs font-semibold text-gray-800">{formatCurrency(selectedDealer.credit_limit || selectedDealer.creditLimit || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Outstanding</p>
                      <p className="text-xs font-semibold text-red-600">{formatCurrency(selectedDealer.current_due || selectedDealer.outstanding || 0)}</p>
                    </div>
                  </div>
                )}

                {/* Product Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Add Products</label>
                  {products.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3 bg-gray-50 rounded-lg">No products available</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {products.map(p => {
                        const price = getProductPrice(p)
                        const stock = p.stock ?? null
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addItem(p.id)}
                            className={`text-left p-2 rounded-md border text-xs transition-colors ${
                              newInvoice.items.find(i => String(i.id) === String(p.id))
                                ? 'border-brand-300 bg-brand-50'
                                : 'border-gray-100 hover:border-brand-200 hover:bg-brand-50/50'
                            }`}
                          >
                            <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-gray-500">৳{price}</span>
                              <span className={`text-[10px] font-semibold ${stock !== null && stock < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                Stock: {stock === null ? '—' : stock}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Items */}
                {newInvoice.items.length > 0 && (
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-50">
                      {newInvoice.items.map(item => (
                        <div key={item.id} className="p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-500">৳{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                            >−</button>
                            <input
                              type="number"
                              min="1"
                              max={item.stock && item.stock > 0 ? item.stock : undefined}
                              value={item.qty}
                              onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                              className="w-12 text-center text-xs border border-gray-200 rounded py-0.5"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-sm"
                            >+</button>
                          </div>
                          <p className="text-xs font-bold text-gray-900 w-20 text-right">
                            {formatCurrency(item.price * item.qty)}
                          </p>
                          <button type="button" onClick={() => removeItem(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                            <MdDelete size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discount + Total */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-gray-600">Discount %:</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={newInvoice.discount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, discount: Number(e.target.value) })}
                      className="w-20 text-xs border border-gray-200 rounded-md px-2 py-1.5"
                    />
                    <span className="text-xs text-gray-500">({formatCurrency(discountAmount)})</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-brand-700">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Due Date</label>
                  <input
                    type="date"
                    className="input"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Notes</label>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Any notes..."
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedDealer || newInvoice.items.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MdSend size={15} /> Create Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
