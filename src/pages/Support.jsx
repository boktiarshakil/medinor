import { useState, useEffect } from 'react'
import { formatDate, statusColor } from '../lib/utils'
import { MdSupportAgent, MdAdd, MdClose } from 'react-icons/md'
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
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    type: 'general',
    priority: 'medium',
    description: '',
  })

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

  const handleCreate = async () => {
    if (!newTicket.subject.trim()) {
      toast.error('Subject is required')
      return
    }
    setCreating(true)
    try {
      await api.createSupportTicket({
        subject: newTicket.subject,
        type: newTicket.type,
        priority: newTicket.priority,
        description: newTicket.description || null,
        status: 'open',
      })
      toast.success('Support ticket created')
      setShowCreate(false)
      setNewTicket({ subject: '', type: 'general', priority: 'medium', description: '' })
      fetchTickets()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500">{tickets.length} tickets</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> New Ticket
        </button>
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

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">New Support Ticket</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create a new support request</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Subject *</label>
                <input type="text" className="input" placeholder="Brief description of the issue"
                  value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={newTicket.type} onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}>
                    <option value="general">General</option>
                    <option value="complaint">Complaint</option>
                    <option value="warranty">Warranty</option>
                    <option value="replacement">Replacement</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} placeholder="Detailed description of the issue..."
                  value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newTicket.subject.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Create Ticket</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
