import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'
import { MdCampaign, MdSend, MdSchedule, MdGroup, MdPerson, MdClose, MdAdd, MdRefresh } from 'react-icons/md'
import { formatDateTime } from '../../lib/utils'

// Role levels that CAN announce (top-down only)
const CAN_ANNOUNCE = ['super_admin', 'admin', 'sales_manager', 'area_manager']

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Employees' },
  { value: 'management', label: 'Management Only' },
  { value: 'rsm_dm', label: 'Regional & District Managers' },
  { value: 'asm', label: 'Area Sales Managers' },
  { value: 'tso', label: 'Territory Sales Officers' },
  { value: 'dealers', label: 'All Dealers' },
]

export default function Announcements() {
  const { user, hasRole } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ message: '', to: 'all', priority: 'medium' })

  const canCreate = CAN_ANNOUNCE.includes(user?.role)

  const fetchAnnouncements = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const data = await api.getNotifications(user.id)
      const mapped = data.map(n => ({
        id: n.id,
        from: 'Management',
        fromRole: n.reference_type === 'announcement' ? 'Management' : undefined,
        to: n.title || 'All',
        message: n.message,
        timestamp: n.created_at,
        priority: n.type === 'warning' ? 'high' : n.type === 'error' ? 'high' : 'medium',
        isActive: n.is_active !== false,
      }))
      setAnnouncements(mapped)
    } catch (err) {
      console.error('Announcements fetch failed:', err)
      setError('Failed to load announcements')
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [user?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newAnnouncement.message.trim()) return

    try {
      const audienceLabel = AUDIENCE_OPTIONS.find(o => o.value === newAnnouncement.to)?.label || 'All'
      await api.broadcastAnnouncement({
        title: audienceLabel,
        message: newAnnouncement.message,
        priority: newAnnouncement.priority,
        audience: newAnnouncement.to,
        senderId: user?.id,
      })
      setNewAnnouncement({ message: '', to: 'all', priority: 'medium' })
      setShowForm(false)
      toast.success('Announcement sent')
      fetchAnnouncements()
    } catch (err) {
      console.error('Announcement send failed:', err)
      toast.error('Failed to send announcement')
    }
  }

  const handleToggleActive = async (a) => {
    try {
      await api.setNotificationActive(a.id, !a.isActive)
      toast.success(a.isActive ? 'Announcement deactivated' : 'Announcement activated')
      fetchAnnouncements()
    } catch (err) {
      console.error('Toggle active failed:', err)
      toast.error('Failed to update announcement')
    }
  }

  const priorityStyles = {
    high: 'border-l-red-500 bg-red-50/30',
    medium: 'border-l-amber-500 bg-amber-50/30',
    low: 'border-l-blue-500 bg-blue-50/30',
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdCampaign className="text-brand-600" size={22} />
            Announcements
          </h2>
        </div>
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Loading announcements...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdCampaign className="text-brand-600" size={22} />
            Announcements
          </h2>
        </div>
        <div className="card p-8 text-center">
          <p className="text-sm text-red-500 mb-3">{error}</p>
          <button onClick={fetchAnnouncements} className="btn-primary text-xs inline-flex items-center gap-1.5">
            <MdRefresh size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdCampaign className="text-brand-600" size={22} />
            Announcements
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {canCreate ? 'Send announcements to your team' : 'Announcements from management'}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs">
            {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> New Announcement</>}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showForm && canCreate && (
        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Send To</label>
              <select
                className="input"
                value={newAnnouncement.to}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, to: e.target.value })}
              >
                {AUDIENCE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      newAnnouncement.priority === p
                        ? p === 'high' ? 'bg-red-100 border-red-300 text-red-700'
                          : p === 'medium' ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="Type your announcement..."
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                maxLength={500}
              />
              <p className="text-[10px] text-gray-400 mt-1">{newAnnouncement.message.length}/500</p>
            </div>
            <button type="submit" className="btn-primary w-full">
              <MdSend size={16} /> Send Announcement
            </button>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className={`card p-4 border-l-4 ${priorityStyles[a.priority]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-900">{a.from}</span>
                  <span className="text-[10px] text-gray-400">→</span>
                  <span className="text-[10px] font-medium text-gray-500 flex items-center gap-0.5">
                    {a.to.includes('All') ? <MdGroup size={11} /> : <MdPerson size={11} />}
                    {a.to}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{a.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MdSchedule size={11} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">{formatDateTime(a.timestamp)}</span>
                  <span className={`text-[10px] font-semibold ${
                    a.isActive ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {a.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
                {canCreate && (
                  <button
                    onClick={() => handleToggleActive(a)}
                    className={`mt-2 text-[10px] font-semibold rounded-md px-2 py-1 transition-colors ${
                      a.isActive
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {a.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
              <span className={`badge text-[9px] flex-shrink-0 ${
                a.priority === 'high' ? 'badge-danger' : a.priority === 'medium' ? 'badge-warning' : 'badge-info'
              }`}>
                {a.priority}
              </span>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="card p-8 text-center">
          <MdCampaign size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No announcements yet</p>
        </div>
      )}
    </div>
  )
}
