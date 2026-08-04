import { useState } from 'react'
import {
  formatCurrency, formatDate, statusColor, statusLabel, generateInvoiceNo
} from '../lib/utils'
import {
  MdSearch, MdFileDownload, MdReceipt, MdAdd, MdSend, MdVisibility,
  MdPerson, MdLocationOn, MdPhone, MdClose, MdCheckCircle, MdDelete
} from 'react-icons/md'

const INITIAL_INVOICES = [
  { id: '1', number: 'MED-A1B2C3', dealer: 'Medicine Point', amount: 15400, paid: 15400, due: 0, status: 'paid', date: '2025-01-15', dueDate: '2025-02-14', createdBy: 'Rahim Uddin', area: 'Dhaka North' },
  { id: '2', number: 'MED-D4E5F6', dealer: 'Lazz Pharma', amount: 8750, paid: 5000, due: 3750, status: 'partial', date: '2025-01-14', dueDate: '2025-02-13', createdBy: 'Rahim Uddin', area: 'Dhaka South' },
  { id: '3', number: 'MED-G7H8I9', dealer: 'HealthCare Ltd', amount: 22300, paid: 0, due: 22300, status: 'unpaid', date: '2025-01-14', dueDate: '2025-02-13', createdBy: 'Karim Ahmed', area: 'Chattogram' },
  { id: '4', number: 'MED-J1K2L3', dealer: 'Central Pharmacy', amount: 5600, paid: 0, due: 5600, status: 'overdue', date: '2025-01-01', dueDate: '2025-01-31', createdBy: 'Rahim Uddin', area: 'Rajshahi' },
  { id: '5', number: 'MED-M4N5O6', dealer: 'Square Hospital', amount: 31200, paid: 31200, due: 0, status: 'paid', date: '2025-01-12', dueDate: '2025-02-11', createdBy: 'Karim Ahmed', area: 'Dhaka North' },
]

const PRODUCTS = [
  { id: 1, name: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', price: 750, stock: 70 },
  { id: 2, name: 'Mediron Blood Glucose Test Strip (25 pcs)', sku: 'MED-TST-025', price: 350, stock: 150 },
  { id: 3, name: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', price: 600, stock: 20 },
  { id: 4, name: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', price: 200, stock: 80 },
  { id: 5, name: 'Mediron Examination Gloves (Large)', sku: 'MED-GLV-L', price: 350, stock: 100 },
  { id: 6, name: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', price: 1500, stock: 45 },
  { id: 7, name: 'Mediron Advance BP Monitor (MEDI 447)', sku: 'MED-BP-447', price: 1800, stock: 35 },
  { id: 8, name: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', price: 2000, stock: 30 },
]

const DEALERS = [
  { id: 1, name: 'Medicine Point', phone: '+8801711110001', address: '78 Elephant Road, Dhaka', area: 'Dhaka North', creditLimit: 50000, outstanding: 15400 },
  { id: 2, name: 'Lazz Pharma', phone: '+8801711110002', address: '23 Nawabpur Road, Dhaka', area: 'Dhaka South', creditLimit: 80000, outstanding: 8750 },
  { id: 3, name: 'HealthCare Ltd', phone: '+8801711110003', address: '45 Agrabad C/A, Chattogram', area: 'Chattogram', creditLimit: 100000, outstanding: 22300 },
  { id: 4, name: 'Central Pharmacy', phone: '+8801711110004', address: '12 Shaheb Bazar, Rajshahi', area: 'Rajshahi', creditLimit: 40000, outstanding: 5600 },
  { id: 5, name: 'Square Hospital', phone: '+8801711110005', address: '188 Panthapath, Dhaka', area: 'Dhaka North', creditLimit: 200000, outstanding: 31200 },
]

export default function Invoices() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [newInvoice, setNewInvoice] = useState({
    dealerId: '',
    items: [],
    discount: 0,
    notes: '',
    dueDate: ''
  })
  const [createSuccess, setCreateSuccess] = useState(false)

  const filtered = inv => {
    const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.dealer.toLowerCase().includes(search.toLowerCase()) ||
      inv.createdBy.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  }

  const addItem = (productId) => {
    const product = PRODUCTS.find(p => p.id === Number(productId))
    if (!product) return
    const existing = newInvoice.items.find(i => i.id === product.id)
    if (existing) {
      setNewInvoice({
        ...newInvoice,
        items: newInvoice.items.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      })
    } else {
      setNewInvoice({
        ...newInvoice,
        items: [...newInvoice.items, { id: product.id, name: product.name, sku: product.sku, price: product.price, stock: product.stock, qty: 1 }]
      })
    }
  }

  const removeItem = (productId) => {
    setNewInvoice({ ...newInvoice, items: newInvoice.items.filter(i => i.id !== productId) })
  }

  const updateQty = (productId, qty) => {
    if (qty < 1) return
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.map(i => i.id === productId ? { ...i, qty } : i)
    })
  }

  const subtotal = newInvoice.items.reduce((sum, i) => sum + (i.price * i.qty), 0)
  const discountAmount = Math.round(subtotal * (newInvoice.discount / 100))
  const total = subtotal - discountAmount

  const selectedDealer = DEALERS.find(d => d.id === Number(newInvoice.dealerId))

  const handleCreate = (e) => {
    e.preventDefault()
    if (!selectedDealer || newInvoice.items.length === 0) return

    const invoice = {
      id: String(invoices.length + 1),
      number: generateInvoiceNo(),
      dealer: selectedDealer.name,
      amount: total,
      paid: 0,
      due: total,
      status: 'unpaid',
      date: new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      createdBy: 'You (SR)',
      area: selectedDealer.area,
    }

    setInvoices([invoice, ...invoices])
    setCreateSuccess(true)
    setTimeout(() => {
      setShowCreate(false)
      setCreateSuccess(false)
      setNewInvoice({ dealerId: '', items: [], discount: 0, notes: '', dueDate: '' })
    }, 1500)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">
            {invoices.length} invoices · {formatCurrency(invoices.reduce((s, i) => s + i.due, 0))} outstanding
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <MdFileDownload size={16} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <MdAdd size={16} /> Create Invoice
          </button>
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

      {/* Invoices Table */}
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
            {invoices.filter(filtered).map(inv => (
              <tr key={inv.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{inv.number}</td>
                <td className="font-medium">{inv.dealer}</td>
                <td className="font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="text-emerald-600">{formatCurrency(inv.paid)}</td>
                <td className={inv.due > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{formatCurrency(inv.due)}</td>
                <td><span className={statusColor(inv.status)}>{statusLabel(inv.status)}</span></td>
                <td className="text-gray-500">{formatDate(inv.date)}</td>
                <td className="text-gray-500 text-xs">{inv.createdBy}</td>
                <td className="text-gray-500 text-xs">{inv.area}</td>
                <td>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <MdVisibility size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.filter(filtered).length === 0 && (
        <div className="card p-12 text-center">
          <MdReceipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No invoices found</p>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{selectedInvoice.number}</h3>
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
                  <p className="text-sm font-bold text-gray-900">{selectedInvoice.dealer}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Status</p>
                  <span className={statusColor(selectedInvoice.status)}>{statusLabel(selectedInvoice.status)}</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Amount</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Due</p>
                  <p className="text-sm font-bold text-red-600">{formatCurrency(selectedInvoice.due)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Created By</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedInvoice.createdBy}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Area</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedInvoice.area}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Due Date</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedInvoice.dueDate)}</p>
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
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create New Invoice</h3>
                <p className="text-xs text-gray-500">Invoice will be visible upward in hierarchy</p>
              </div>
              <button onClick={() => { setShowCreate(false); setCreateSuccess(false) }} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={18} />
              </button>
            </div>

            {createSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">Invoice Created!</p>
                <p className="text-xs text-gray-500 mt-1">Visible to all above in hierarchy</p>
              </div>
            ) : (
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
                    {DEALERS.map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.area}</option>
                    ))}
                  </select>
                </div>

                {/* Dealer Info */}
                {selectedDealer && (
                  <div className="p-3 bg-gray-50 rounded-lg grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1.5">
                      <MdPhone size={13} className="text-gray-400" />
                      <span className="text-xs text-gray-700">{selectedDealer.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MdLocationOn size={13} className="text-gray-400" />
                      <span className="text-xs text-gray-700 truncate">{selectedDealer.address}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Credit Limit</p>
                      <p className="text-xs font-semibold text-gray-800">{formatCurrency(selectedDealer.creditLimit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Outstanding</p>
                      <p className="text-xs font-semibold text-red-600">{formatCurrency(selectedDealer.outstanding)}</p>
                    </div>
                  </div>
                )}

                {/* Product Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1.5 block">Add Products</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {PRODUCTS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p.id)}
                        className={`text-left p-2 rounded-md border text-xs transition-colors ${
                          newInvoice.items.find(i => i.id === p.id)
                            ? 'border-brand-300 bg-brand-50'
                            : 'border-gray-100 hover:border-brand-200 hover:bg-brand-50/50'
                        }`}
                      >
                        <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-gray-500">৳{p.price}</span>
                          <span className={`text-[10px] font-semibold ${p.stock < 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            Stock: {p.stock}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
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
                              max={item.stock}
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
