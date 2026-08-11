import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { MdSend, MdChat, MdGroup, MdPerson, MdOutlineCommentsDisabled, MdSearch, MdClose } from 'react-icons/md'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { formatDateTime } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function Messages() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('common')
  const [users, setUsers] = useState([])
  const [areas, setAreas] = useState([])
  const [directMessages, setDirectMessages] = useState([])
  const [groupMessages, setGroupMessages] = useState([])
  const [commonComments, setCommonComments] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (activeTab === 'direct' && selectedUser?.id && user?.id) {
      fetchDirect(selectedUser.id)
    }
  }, [selectedUser?.id, activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      const usersData = await api.getUsers()
      setUsers(usersData.filter(u => u.id !== user?.id))
      setSelectedUser(prev => prev || usersData.find(u => u.id !== user?.id) || null)

      api.getAreas().then(setAreas).catch(() => {})

      const [common, group] = await Promise.all([
        api.getMessages({ channel: 'common' }),
        api.getMessages({ channel: 'group', areaId: user?.area_id || null }),
      ])
      setCommonComments(common.reverse())
      setGroupMessages(group.reverse())
    } catch (err) {
      console.error('Messages fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDirect = async (otherId) => {
    try {
      const direct = await api.getMessages({ channel: 'direct', userId: user?.id, otherUserId: otherId })
      setDirectMessages(direct.reverse())
    } catch (err) {
      console.error('Direct messages fetch failed:', err)
    }
  }

  const handleSendDirect = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return
    try {
      const msg = await api.sendMessage({
        channel: 'direct',
        sender_id: user?.id,
        recipient_id: selectedUser.id,
        message: newMessage.trim(),
      })
      setDirectMessages(prev => [...prev, msg])
      setNewMessage('')
    } catch (err) {
      console.error('Send direct failed:', err)
      toast.error('Failed: ' + err.message)
    }
  }

  const handleSendGroup = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    if (!user?.area_id) {
      toast.error('You are not assigned to a territory yet. Ask an admin to assign your area.')
      return
    }
    try {
      const msg = await api.sendMessage({
        channel: 'group',
        sender_id: user?.id,
        area_id: user.area_id,
        message: newMessage.trim(),
      })
      setGroupMessages(prev => [...prev, msg])
      setNewMessage('')
    } catch (err) {
      console.error('Send group failed:', err)
      toast.error('Failed: ' + err.message)
    }
  }

  const handleSendCommon = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    try {
      const msg = await api.sendMessage({
        channel: 'common',
        sender_id: user?.id,
        message: newMessage.trim(),
      })
      setCommonComments(prev => [...prev, msg])
      setNewMessage('')
    } catch (err) {
      console.error('Send common failed:', err)
      toast.error('Failed: ' + err.message)
    }
  }

  const tabs = [
    { key: 'common', label: 'Common Box', icon: MdOutlineCommentsDisabled },
    { key: 'group', label: 'Territory Group', icon: MdGroup },
    { key: 'direct', label: 'Direct', icon: MdChat },
  ]

  const nameOf = (id) => {
    if (id === user?.id) return 'You'
    const u = users.find(x => x.id === id)
    return u ? u.full_name : (id || 'Unknown').slice(0, 8)
  }

  const myArea = areas.find(a => a.id === user?.area_id)
  const myAreaName = myArea ? myArea.name : ''

  const query = search.trim().toLowerCase()
  const filteredUsers = users.filter(u =>
    !query ||
    (u.full_name || '').toLowerCase().includes(query) ||
    (u.role || '').toLowerCase().includes(query) ||
    (u.area?.name || '').toLowerCase().includes(query)
  )

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
                    {(nameOf(c.sender_id) || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{nameOf(c.sender_id)}</span>
                      <span className="text-[10px] text-gray-400">{formatDateTime(c.created_at)}</span>
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
              {myAreaName && <span className="ml-1 badge badge-info">{myAreaName}</span>}
            </p>
          </div>
          {!user?.area_id ? (
            <div className="p-8 text-center">
              <MdGroup size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-600">You are not assigned to a territory yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Ask a Super Admin to assign your Area in User Management, then this group will show your territory's thread.
              </p>
            </div>
          ) : (
          <>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {groupMessages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No messages in your territory yet. Start the conversation.</p>
            ) : (
              groupMessages.map(g => (
                <div key={g.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {(nameOf(g.sender_id) || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{nameOf(g.sender_id)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{g.message}</p>
                    <span className="text-[10px] text-gray-400">{formatDateTime(g.created_at)}</span>
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
          </>
          )}
        </div>
      )}

      {/* Direct Messages */}
      {activeTab === 'direct' && (
        <div className="card overflow-hidden">
          <div className="grid lg:grid-cols-[300px_1fr]">
            {/* Inbox sidebar */}
            <div className={`${selectedUser ? 'hidden lg:block' : 'block'} border-b lg:border-b-0 lg:border-r border-gray-100`}>
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 text-xs"
                    placeholder="Search people..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="max-h-[300px] lg:max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                {users.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4">No other users found. Create users to message them.</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4">No one matches “{search}”.</p>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                        selectedUser?.id === u.id ? 'bg-brand-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        selectedUser?.id === u.id ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
                      }`}>
                        {(u.full_name || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {u.role}
                          {u.area?.name ? ` · ${u.area.name}` : ''}
                        </p>
                      </div>
                      <MdChat size={13} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat panel */}
            <div className={`${selectedUser ? 'flex' : 'hidden lg:flex'} flex-col min-h-[380px]`}>
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                <button onClick={() => setSelectedUser(null)} className="lg:hidden text-gray-400 hover:text-gray-600">
                  <MdClose size={18} />
                </button>
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {(selectedUser?.full_name || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {selectedUser?.full_name || 'Select a person'}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{selectedUser?.role || 'Choose someone from the list to start chatting'}</p>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3 max-h-[320px] lg:max-h-[360px] overflow-y-auto">
                {!selectedUser ? (
                  <p className="text-sm text-gray-400 text-center py-10">Select a person to start messaging.</p>
                ) : directMessages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">
                    No messages with {selectedUser.full_name} yet. Say hi!
                  </p>
                ) : (
                  directMessages.map(m => {
                    const isMe = m.sender_id === user?.id
                    return (
                      <div key={m.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                          isMe ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          <p>{m.message}</p>
                          <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                            {formatDateTime(m.created_at)}
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
          </div>
        </div>
      )}
    </div>
  )
}
