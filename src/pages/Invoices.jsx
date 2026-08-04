import { useState } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdSearch, MdFileDownload, MdReceipt } from 'react-icons/md'

const INVOICES = [
  { id: '1', number: 'MED-A1B2C3', dealer: 'Medicine Point', amount: 15400, paid: 15400, due: 0, status: 'paid', date: '2025-01-15', dueDate: '2025-02-14' },
  { id: '2', number: 'MED-D4E5F6', dealer: 'Lazz Pharma', amount: 8750, paid: 5000, due: 3750, status: 'partial', date: '2025-01-14', dueDate: '2025-02-13' },
  { id: '3', number: 'MED-G7H8I9', dealer: 'HealthCare Ltd', amount: 22300, paid: 0, due: 22300, status: 'unpaid', date: '2025-01-14', dueDate: '2025-02-13' },
  { id: '4', number: 'MED-J1K2L3', dealer: 'Central Pharmacy', amount: 5600, paid: 0, due: 5600, status: 'overdue', date: '2025-01-01', dueDate: '2025-01-31' },
  { id: '5', number: 'MED-M4N5O6', dealer: 'Square Hospital', amount: 31200, paid: 31200, due: 0, status: 'paid', date: '2025-01-12', dueDate: '2025-02-11' },
]

export default function Invoices() {
  const [search, setSearch] = useState('')
  const filtered = INVOICES.filter(i =>
    i.number.toLowerCase().includes(search.toLowerCase()) ||
    i.dealer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{INVOICES.length} invoices · {formatCurrency(INVOICES.reduce((s, i) => s + i.due, 0))} outstanding</p>
        </div>
        <button className="btn-secondary">
          <MdFileDownload size={16} /> Export
        </button>
      </div>

      <div className="relative">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Search invoices..." className="input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

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
              <th className="hidden md:table-cell">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{inv.number}</td>
                <td className="font-medium">{inv.dealer}</td>
                <td className="font-semibold">{formatCurrency(inv.amount)}</td>
                <td className="text-emerald-600">{formatCurrency(inv.paid)}</td>
                <td className={inv.due > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>{formatCurrency(inv.due)}</td>
                <td><span className={statusColor(inv.status)}>{statusLabel(inv.status)}</span></td>
                <td className="text-gray-500">{formatDate(inv.date)}</td>
                <td className="hidden md:table-cell text-gray-500">{formatDate(inv.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdReceipt size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No invoices found</p>
        </div>
      )}
    </div>
  )
}
