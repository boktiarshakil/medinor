import { formatDate, statusColor } from '../lib/utils'
import { MdSupportAgent } from 'react-icons/md'

const TICKETS = [
  { id: '1', number: 'TKT-001', subject: 'Glucose Meter Display Issue', dealer: 'Medicine Point', type: 'warranty', priority: 'high', status: 'open', date: '2025-01-15' },
  { id: '2', number: 'TKT-002', subject: 'Wrong Strips Delivered', dealer: 'Lazz Pharma', type: 'complaint', priority: 'medium', status: 'in_progress', date: '2025-01-14' },
  { id: '3', number: 'TKT-003', subject: 'BP Monitor Replacement', dealer: 'Square Hospital', type: 'replacement', priority: 'urgent', status: 'resolved', date: '2025-01-12' },
  { id: '4', number: 'TKT-004', subject: 'Bulk Order Inquiry', dealer: 'Chittagong Medical', type: 'general', priority: 'low', status: 'closed', date: '2025-01-10' },
]

const priorityColor = {
  low: 'badge-gray',
  medium: 'badge-warning',
  high: 'badge-danger',
  urgent: 'bg-red-100 text-red-700',
}

export default function Support() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500">{TICKETS.length} tickets</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Subject</th>
              <th>Dealer</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {TICKETS.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{t.number}</td>
                <td className="font-medium">{t.subject}</td>
                <td className="text-gray-600">{t.dealer}</td>
                <td className="capitalize text-gray-600">{t.type.replace(/_/g, ' ')}</td>
                <td><span className={priorityColor[t.priority]}>{t.priority}</span></td>
                <td><span className={statusColor(t.status)}>{t.status.replace(/_/g, ' ')}</span></td>
                <td className="text-gray-500">{formatDate(t.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
