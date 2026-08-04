import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdAssignmentReturn } from 'react-icons/md'

const RETURNS = [
  { id: '1', number: 'RET-001', dealer: 'Medicine Point', reason: 'damaged', amount: 2400, status: 'pending', date: '2025-01-14' },
  { id: '2', number: 'RET-002', dealer: 'Lazz Pharma', reason: 'expired', amount: 1800, status: 'approved', date: '2025-01-12' },
  { id: '3', number: 'RET-003', dealer: 'Central Pharmacy', reason: 'wrong_product', amount: 750, status: 'replaced', date: '2025-01-10' },
  { id: '4', number: 'RET-004', dealer: 'Square Hospital', reason: 'quality_issue', amount: 3200, status: 'rejected', date: '2025-01-08' },
]

export default function Returns() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Returns</h1>
        <p className="text-sm text-gray-500">{RETURNS.length} return requests</p>
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
            </tr>
          </thead>
          <tbody>
            {RETURNS.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{r.number}</td>
                <td className="font-medium">{r.dealer}</td>
                <td className="capitalize text-gray-600">{r.reason.replace(/_/g, ' ')}</td>
                <td className="font-semibold">{formatCurrency(r.amount)}</td>
                <td><span className={statusColor(r.status)}>{statusLabel(r.status)}</span></td>
                <td className="text-gray-500">{formatDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
