import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { MdSend, MdChat, MdGroup, MdPerson, MdOutlineCommentsDisabled } from 'react-icons/md'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { formatDateTime } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function Messages() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('common')
  const [users, setUsers] = useState([])
  const [directMessages, setDirectMessages] = useState([])
  const [groupMessages, setGroupMessages] = useState([])
  const [commonComments, setCommonComments] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const usersData = await api.getUsers()
      setUsers(usersData.filter(u => u.id !== user?.id))
      setSelectedUser(usersData[0] || null)

      // TODO: Fetch messages from a messages table when created
      // For now, show empty state directing admin to set up messaging
      setDirectMessages([])
      setGroupMessages([])
      setCommonComments([])
    } catch (err) {
      console.error('Messages fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendDirect = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return
    // TODO: Persist to messages table
    toast.success('Message sent (local only — wire to DB)')
    setNewMessage('')
  }

  const handleSendGroup = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    toast.success('Group message sent (local only)')
    setNewMessage('')
  }

  const handleSendCommon = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    toast.success('Comment posted (local only)')
    setNewMessage('')
  }

  const tabs = [
    { key: 'common', label: 'Common Box', icon: MdOutlineCommentsDisabled },
    { key: 'group', label: 'Territory Group', icon: MdGroup },
    { key: 'direct', label: 'Direct', icon: MdChat },
  ]

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <HiOutlineChatBubbleLeftRight className="text-brand-600" size={22} />
          Messages & Comments
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Common box, territory group, or direct message</p>
      </div>

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
            <p className="text-[10px] text-gray-400 mt-0.5">Visible to everyone in your organization</p>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {commonComments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No comments yet. Start the conversation.</p>
            ) : (
              commonComments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {(c.from || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{c.from}</span>
                      <span className="text-[10px] text-gray-400">{formatDateTime(c.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{c.message}</p>
                  </div>
                </div>
              ))
            )}
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
            <h3 className="text-sm font-bold text-gray-900">Territory Group</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              <MdGroup size={10} className="inline" /> Ideas, issues, announcements
            </p>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {groupMessages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No group messages yet.</p>
            ) : (
              groupMessages.map(g => (
                <div key={g.id} className={`flex gap-3 ${g.type === 'announcement' ? 'p-2 bg-amber-50 rounded-lg' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    g.type === 'announcement' ? 'bg-amber-100 text-amber-600' :
                    g.type === 'idea' ? 'bg-emerald-100 text-emerald-600' :
                    g.type === 'issue' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {(g.from || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">{g.from}</span>
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
              ))
            )}
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
          <div className="p-3 border-b border-gray-100 flex gap-2 overflow-x-auto">
            {users.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No other users found. Create users to message them.</p>
            ) : (
              users.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    selectedUser?.id === u.id
                      ? 'bg-brand-50 text-brand-700 border border-brand-200'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <MdPerson size={13} />
                  {u.full_name}
                </button>
              ))
            )}
          </div>
          <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
            {directMessages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {selectedUser ? `No messages with ${selectedUser.full_name} yet.` : 'Select a user to start messaging.'}
              </p>
            ) : (
              directMessages.map(m => {
                const isMe = m.from === user?.id
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
              })
            )}
          </div>
          <form onSubmit={handleSendDirect} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="input flex-1"
              placeholder={selectedUser ? `Message ${selectedUser.full_name}...` : 'Select a user first...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!selectedUser}
            />
            <button type="submit" className="btn-primary px-3" disabled={!selectedUser}>
              <MdSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
