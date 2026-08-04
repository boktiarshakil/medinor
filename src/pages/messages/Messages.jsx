import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MdSend, MdChat, MdGroup, MdPerson, MdOutlineCommentsDisabled } from 'react-icons/md'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { formatDateTime } from '../../lib/utils'

// Mock data
const MOCK_USERS = [
  { id: 'demo-002', name: 'Rahim Uddin', role: 'TSO', territory: 'Dhaka North' },
  { id: 'demo-003', name: 'Karim Ahmed', role: 'ASM', territory: 'Dhaka South' },
  { id: 'demo-004', name: 'Medicine Point', role: 'Dealer', territory: 'Dhanmondi' },
  { id: 'demo-005', name: 'Hasan Ali', role: 'Warehouse', territory: 'Dhaka Main' },
]

const INITIAL_DIRECT = [
  { id: 1, from: 'demo-003', to: 'demo-002', message: 'Please submit today\'s order report by 5 PM.', timestamp: '2025-08-04T10:30:00Z' },
  { id: 2, from: 'demo-002', to: 'demo-003', message: 'Done bhai, sending now. Also Medicine Point needs urgent restock.', timestamp: '2025-08-04T10:32:00Z' },
  { id: 3, from: 'demo-003', to: 'demo-002', message: 'Noted. I\'ll coordinate with warehouse. Check due amount first.', timestamp: '2025-08-04T10:35:00Z' },
]

const INITIAL_GROUP = [
  { id: 1, from: 'Karim Ahmed', territory: 'Dhaka North', message: 'Team meeting tomorrow 9 AM. All TSOs must attend.', timestamp: '2025-08-04T09:00:00Z', type: 'announcement' },
  { id: 2, from: 'Rahim Uddin', territory: 'Dhaka North', message: 'I have a new idea — if we target hospitals in Mirpur, we can push 50+ BP monitors per month. Who wants to collaborate?', timestamp: '2025-08-04T09:15:00Z', type: 'idea' },
  { id: 3, from: 'Sajid Hasan', territory: 'Dhaka North', message: 'Great idea Rahim! I have contacts in National Hospital Mirpur. Let me share.', timestamp: '2025-08-04T09:20:00Z', type: 'comment' },
  { id: 4, from: 'Faruk Hossain', territory: 'Dhaka North', message: 'There\'s a dealer issue in Mirpur 11 — they\'re complaining about delivery delays. Need to address this.', timestamp: '2025-08-04T09:45:00Z', type: 'issue' },
]

const COMMON_COMMENTS = [
  { id: 1, from: 'Managing Director', message: 'Monthly target reminder: We need 15% growth this month. Push hard!', timestamp: '2025-08-04T08:00:00Z' },
  { id: 2, from: 'National Sales Manager', message: 'All TSOs: Submit your route plan for this week by Monday 10 AM.', timestamp: '2025-08-03T17:00:00Z' },
  { id: 3, from: 'Karim Ahmed', message: 'Dhaka North territory achieved 93% of target last month. Keep it up team!', timestamp: '2025-08-03T16:30:00Z' },
]

export default function Messages() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('common') // common, group, direct
  const [directMessages, setDirectMessages] = useState(INITIAL_DIRECT)
  const [groupMessages, setGroupMessages] = useState(INITIAL_GROUP)
  const [commonComments, setCommonComments] = useState(COMMON_COMMENTS)
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0])

  const handleSendDirect = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setDirectMessages([...directMessages, {
      id: Date.now(),
      from: user?.id || 'demo-001',
      to: selectedUser.id,
      message: newMessage,
      timestamp: new Date().toISOString(),
    }])
    setNewMessage('')
  }

  const handleSendGroup = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setGroupMessages([...groupMessages, {
      id: Date.now(),
      from: user?.full_name || 'You',
      territory: 'Dhaka North',
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'comment',
    }])
    setNewMessage('')
  }

  const handleSendCommon = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setCommonComments([...commonComments, {
      id: Date.now(),
      from: user?.full_name || 'You',
      message: newMessage,
      timestamp: new Date().toISOString(),
    }])
    setNewMessage('')
  }

  const tabs = [
    { key: 'common', label: 'Common Box', icon: MdOutlineCommentsDisabled },
    { key: 'group', label: 'Territory Group', icon: MdGroup },
    { key: 'direct', label: 'Direct', icon: MdChat },
  ]

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <HiOutlineChatBubbleLeftRight className="text-brand-600" size={22} />
          Messages & Comments
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Common box, territory group, or direct message</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Common Comment Box */}
      {activeTab === 'common' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Common Comment Box</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Visible to everyone in your organization unit</p>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {commonComments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {c.from.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{c.from}</span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(c.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendCommon} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Write a comment for everyone..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="btn-primary px-3">
              <MdSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Territory Group */}
      {activeTab === 'group' && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Territory Group — Dhaka North</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              <MdGroup size={10} className="inline" /> 6 members · Ideas, issues, announcements
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {groupMessages.map(g => (
              <div key={g.id} className={`flex gap-3 ${g.type === 'announcement' ? 'p-2 bg-amber-50 rounded-lg' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  g.type === 'announcement' ? 'bg-amber-100 text-amber-600' :
                  g.type === 'idea' ? 'bg-emerald-100 text-emerald-600' :
                  g.type === 'issue' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {g.from.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900">{g.from}</span>
                    <span className="text-[10px] text-gray-400">{g.territory}</span>
                    {g.type !== 'comment' && (
                      <span className={`badge text-[9px] ${
                        g.type === 'announcement' ? 'badge-warning' :
                        g.type === 'idea' ? 'badge-success' : 'badge-danger'
                      }`}>{g.type}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{g.message}</p>
                  <span className="text-[10px] text-gray-400">{formatDateTime(g.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendGroup} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Share idea, issue, or comment..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="btn-primary px-3">
              <MdSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Direct Messages */}
      {activeTab === 'direct' && (
        <div className="card">
          {/* User selector */}
          <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
            {MOCK_USERS.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedUser.id === u.id ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <MdPerson size={13} />
                {u.name}
              </button>
            ))}
          </div>
          {/* Messages */}
          <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {directMessages
              .filter(m => m.from === selectedUser.id || m.to === selectedUser.id)
              .map(m => {
                const isMe = m.from === (user?.id || 'demo-001')
                return (
                  <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p>{m.message}</p>
                      <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                        {formatDateTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
          <form onSubmit={handleSendDirect} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="input flex-1"
              placeholder={`Message ${selectedUser.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="btn-primary px-3">
              <MdSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
