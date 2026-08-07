import { useState, useEffect } from 'react'
import { formatDate, statusColor } from '../lib/utils'
import { MdSupportAgent } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const priorityColor = {
  low: 'badge-gray',
  medium: 'badge-warning',
  high: 'badge-danger',
  urgent: 'bg-red-100 text-red-700',
}

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getSupportTickets()
      setTickets(data)
    } catch (err) {
      console.error('Support tickets fetch failed:', err)
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading tickets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button className="btn-secondary mt-3 text-xs" onClick={fetchTickets}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-sm text-gray-500">{tickets.length} tickets</p>
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
            {tickets.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{t.ticket_number || t.number || t.id}</td>
                <td className="font-medium">{t.subject}</td>
                <td className="text-gray-600">{t.dealer?.name || t.dealer_name || '-'}</td>
                <td className="capitalize text-gray-600">{(t.type || '').replace(/_/g, ' ')}</td>
                <td><span className={priorityColor[t.priority] || 'badge-gray'}>{t.priority}</span></td>
                <td><span className={statusColor(t.status)}>{(t.status || '').replace(/_/g, ' ')}</span></td>
                <td className="text-gray-500">{formatDate(t.created_at || t.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tickets.length === 0 && (
        <div className="card p-12 text-center">
          <MdSupportAgent size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No support tickets</p>
        </div>
      )}
    </div>
  )
}
