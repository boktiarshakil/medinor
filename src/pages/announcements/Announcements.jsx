import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MdCampaign, MdSend, MdSchedule, MdGroup, MdPerson, MdClose, MdAdd } from 'react-icons/md'
import { formatDateTime } from '../../lib/utils'

// Role levels that CAN announce (top-down only)
const CAN_ANNOUNCE = ['super_admin', 'admin', 'sales_manager', 'area_manager']

// Mock announcements data
const INITIAL_ANNOUNCEMENTS = [
  { id: 1, from: 'Managing Director', fromRole: 'md', to: 'All Employees', message: 'Q3 sales target has been increased by 15%. All territories please align your plans accordingly. Effective from 1st August.', timestamp: '2025-08-04T09:00:00Z', priority: 'high' },
  { id: 2, from: 'National Sales Manager', fromRole: 'nsm', to: 'Regional & District Managers', message: 'New product launch: Mediron Smart Thermometer. Training session this Friday at 10 AM. Attendance mandatory for all RSMs.', timestamp: '2025-08-03T14:30:00Z', priority: 'medium' },
  { id: 3, from: 'Marketing Director', fromRole: 'marketing', to: 'All Sales Staff', message: 'Campaign: Buy 10 BP Monitors get 1 free. Valid till August 31. Push this offer to all dealers in your territory.', timestamp: '2025-08-02T11:00:00Z', priority: 'medium' },
  { id: 4, from: 'CEO', fromRole: 'ceo', to: 'Management Only', message: 'Board meeting scheduled for August 10. All directors please prepare your department reports by August 8.', timestamp: '2025-08-01T16:00:00Z', priority: 'high' },
  { id: 5, from: 'Area Sales Manager', fromRole: 'asm', to: 'TSO - Dhaka North', message: 'Special incentive this week: Extra 2% commission on glucose meter sales. Target minimum 20 units per TSO.', timestamp: '2025-08-04T08:15:00Z', priority: 'low' },
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Employees' },
  { value: 'management', label: 'Management Only' },
  { value: 'rsm_dm', label: 'Regional & District Managers' },
  { value: 'asm', label: 'Area Sales Managers' },
  { value: 'tso', label: 'Territory Sales Officers' },
  { value: 'dealers', label: 'All Dealers' },
  { value: 'specific', label: 'Specific Person' },
]

export default function Announcements() {
  const { user, hasRole } = useAuth()
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS)
  const [showForm, setShowForm] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ message: '', to: 'all', priority: 'medium' })

  const canCreate = CAN_ANNOUNCE.includes(user?.role)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newAnnouncement.message.trim()) return

    const announcement = {
      id: Date.now(),
      from: user?.full_name || 'You',
      fromRole: user?.role,
      to: AUDIENCE_OPTIONS.find(o => o.value === newAnnouncement.to)?.label || 'All',
      message: newAnnouncement.message,
      timestamp: new Date().toISOString(),
      priority: newAnnouncement.priority,
    }
    setAnnouncements([announcement, ...announcements])
    setNewAnnouncement({ message: '', to: 'all', priority: 'medium' })
    setShowForm(false)
  }

  const priorityStyles = {
    high: 'border-l-red-500 bg-red-50/30',
    medium: 'border-l-amber-500 bg-amber-50/30',
    low: 'border-l-blue-500 bg-blue-50/30',
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
                </div>
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
