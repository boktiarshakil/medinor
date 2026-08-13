import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '../lib/utils'
import {
  MdPhone,
  MdLocationOn,
  MdExpandMore,
  MdCheckCircle,
  MdHourglassEmpty,
  MdClose,
  MdShoppingCart,
  MdCallMade,
  MdReceipt,
  MdNotes,
  MdPerson,
} from 'react-icons/md'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_META = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-600 ring-blue-100', icon: MdHourglassEmpty },
  processing: { label: 'Processing', color: 'bg-amber-50 text-amber-600 ring-amber-100', icon: MdCallMade },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-600 ring-emerald-100', icon: MdCheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-500 ring-red-100', icon: MdClose },
}

export default function CODRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await api.getCodOrders()
      setRequests(data)
    } catch (err) {
      console.error('COD requests fetch failed:', err)
      toast.error('Failed to load COD requests')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (req, nextStatus) => {
    if (busyId) return
    const confirm = nextStatus === 'cancelled'
      ? window.confirm(`Cancel COD request from ${req.customer_name}?`)
      : true
    if (nextStatus !== 'cancelled' || confirm) {
      setBusyId(req.id)
      try {
        await api.updateCodOrderStatus(req.id, nextStatus, user?.id)
        toast.success(`Marked as ${STATUS_META[nextStatus].label}`)
        fetchData()
      } catch (err) {
        console.error('Status update failed:', err)
        toast.error(err.message || 'Failed to update status')
      } finally {
        setBusyId(null)
      }
    }
  }

  let availableActions = (status) => {
    switch (status) {
      case 'new':
        return ['processing', 'cancelled']
      case 'processing':
        return ['completed', 'cancelled']
      default:
        return []
    }
  }

  const counts = {
    all: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    processing: requests.filter(r => r.status === 'processing').length,
    completed: requests.filter(r => r.status === 'completed').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  }
  const completedTotal = requests
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0)

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const statCards = [
    { title: 'New Requests', value: counts.new, icon: <MdHourglassEmpty size={18} />, accent: 'bg-blue-500' },
    { title: 'Processing', value: counts.processing, icon: <MdCallMade size={18} />, accent: 'bg-amber-500' },
    { title: 'Completed', value: counts.completed, icon: <MdCheckCircle size={18} />, accent: 'bg-emerald-500' },
    { title: 'Completed Value', value: formatCurrency(completedTotal), icon: <MdShoppingCart size={18} />, accent: 'bg-brand-500' },
  ]
  const filterTabs = ['all', 'new', 'processing', 'completed', 'cancelled']

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">COD Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Cash-on-delivery orders from public customers, kept separate from the dealer pipeline.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.accent} text-white rounded-lg flex items-center justify-center flex-shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(f => {
          const meta = f === 'all'
            ? { label: 'All', color: filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-gray-200' }
            : {
                label: STATUS_META[f].label,
                color: filter === f ? 'bg-gray-900 text-white' : `bg-white ring-gray-200 ${STATUS_META[f].color}`,
              }
          return (
            <button
              key={f}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ring-1 transition-colors ${meta.color}`}
              onClick={() => setFilter(f)}
            >
              {meta.label} ({counts[f]})
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MdReceipt size={32} className="text-gray-300 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">No COD requests here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const meta = STATUS_META[req.status] || STATUS_META.new
            const StatusIcon = meta.icon
            const items = req.items || []
            const expanded = expandedId === req.id
            const canCancel = req.status === 'new' || req.status === 'processing'
            return (
              <div key={req.id} className="card overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : req.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <MdPerson size={18} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{req.customer_name}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><MdPhone size={12} /> {req.phone}</span>
                        <span className="flex items-center gap-1 truncate"><MdLocationOn size={12} /> {req.address || 'No address'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ring-1 ${meta.color}`}>
                      <StatusIcon size={12} /> {meta.label}
                    </span>
                    <span className="text-sm font-bold text-brand-600">{formatCurrency(req.total_amount)}</span>
                    <MdExpandMore size={18} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    <div className="space-y-2">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 flex-1 truncate mr-2">{it.name || 'Product'}</span>
                          <span className="text-gray-400 mx-1">×{it.quantity}</span>
                          <span className="font-semibold">{formatCurrency(Number(it.total_price) || Number(it.unit_price || 0) * it.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {req.notes && (
                      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <MdNotes size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{req.notes}</span>
                      </div>
                    )}

                    {req.processedBy && (
                      <p className="text-[11px] text-gray-400">
                        Processed by {req.processedBy.full_name || '—'}{req.processed_at ? ` on ${formatDate(req.processed_at)}` : ''}
                      </p>
                    )}

                    {availableActions(req.status).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {canCancel && (
                          <button
                            className="btn-secondary text-xs px-4 py-2"
                            onClick={() => changeStatus(req, 'cancelled')}
                            disabled={!!busyId}
                          >
                            <MdClose size={14} /> Cancel
                          </button>
                        )}
                        {req.status === 'new' && (
                          <button
                            className="btn-primary text-xs px-4 py-2"
                            onClick={() => changeStatus(req, 'processing')}
                            disabled={!!busyId}
                          >
                            <MdCallMade size={14} /> Start Processing
                          </button>
                        )}
                        {req.status === 'processing' && (
                          <button
                            className="btn-primary text-xs px-4 py-2"
                            onClick={() => changeStatus(req, 'completed')}
                            disabled={!!busyId}
                          >
                            <MdCheckCircle size={14} /> Mark Completed
                          </button>
                        )}
                        {busyId === req.id && (
                          <span className="text-xs text-gray-400 self-center">Saving...</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}