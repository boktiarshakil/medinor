import { useState, useEffect } from 'react'
import { formatDate } from '../lib/utils'
import { api } from '../lib/api'
import { MdAdd, MdSearch, MdEdit, MdDelete, MdCheckCircle, MdPersonAdd, MdClose, MdBadge } from 'react-icons/md'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [areas, setAreas] = useState([])
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'sales_executive',
    area_id: '',
    password: ''
  })
  const [editUser, setEditUser] = useState({})

  const ROLES = [
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'area_manager', label: 'Area Manager' },
    { value: 'sales_executive', label: 'Sales Executive' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'dealer', label: 'Dealer' },
  ]

  useEffect(() => {
    fetchUsers()
    fetchAreas()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers({ includeInactive: true })
      setUsers(data)
    } catch (err) {
      toast.error('Failed to load users: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchAreas = async () => {
    try {
      const data = await api.getAreas()
      setAreas(data)
    } catch (err) {
      console.error('Areas fetch failed:', err)
    }
  }

  const handleCreate = async () => {
    if (!newUser.full_name || !newUser.email) {
      toast.error('Name and email required')
      return
    }
    try {
      toast.loading('Creating user...', { id: 'create' })
      await api.createUser({
        ...newUser,
        password: newUser.password || 'Mediron@2025'
      })
      toast.success('User created! They can now sign in.', { id: 'create' })
      setNewUser({ full_name: '', email: '', phone: '', role: 'sales_executive', area_id: '', password: '' })
      setShowCreate(false)
      fetchUsers()
    } catch (err) {
      toast.error(err.message || 'Failed to create user', { id: 'create' })
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await api.toggleUserActive(user.id, !user.is_active)
      toast.success(`${user.is_active ? 'Deactivated' : 'Active'}d ${user.full_name}`)
      fetchUsers()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Delete ${user.full_name}? This cannot be undone.`)) return
    try {
      await api.deleteUser(user.id)
      toast.success('User deleted')
      fetchUsers()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const handleEdit = async () => {
    try {
      await api.updateUser(editUser.id, {
        full_name: editUser.full_name,
        phone: editUser.phone,
        role: editUser.role,
        area_id: editUser.area_id
      })
      toast.success('User updated')
      setShowEdit(null)
      fetchUsers()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const activeCount = users.filter(u => u.is_active !== false).length
  const roleCount = role => users.filter(u => u.role === role).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{users.length} users · {activeCount} active</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <MdPersonAdd size={16} /> Create User
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map(r => (
          <div key={r.value} className="card p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{roleCount(r.value)}</p>
            <p className="text-[9px] text-gray-400 uppercase">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading users...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container border-0 rounded-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-600">
                            {(user.full_name || '?')[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                          {user.phone && <p className="text-[10px] text-gray-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-gray-600">{user.email}</td>
                    <td>
                      <span className="badge-info text-[9px]">
                        {ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      {areas.find(a => a.id === user.area_id)?.name || '—'}
                    </td>
                    <td>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                        user.is_active !== false
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">{formatDate(user.created_at)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditUser(user); setShowEdit(user.id) }}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                          title="Edit"
                        >
                          <MdEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded ${user.is_active !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                          title={user.is_active !== false ? 'Deactivate' : 'Activate'}
                        >
                          <MdCheckCircle size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <MdDelete size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Create New User</h3>
                <p className="text-xs text-gray-500 mt-0.5">User will be able to sign in immediately</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Rahim Uddin"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="user@kgsmgroup.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+8801XXXXXXXXX"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select
                    className="input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Area / Territory</label>
                  <select
                    className="input"
                    value={newUser.area_id}
                    onChange={(e) => setNewUser({ ...newUser, area_id: e.target.value })}
                  >
                    <option value="">No area assigned</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Temp Password</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Mediron@2025"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <strong>Note:</strong> User will receive login credentials via email. They can change password after first login.
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newUser.full_name || !newUser.email}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  <MdPersonAdd size={15} /> Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setShowEdit(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={editUser.full_name || ''}
                  onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={editUser.phone || ''}
                  onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={editUser.role || ''}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Area</label>
                <select
                  className="input"
                  value={editUser.area_id || ''}
                  onChange={(e) => setEditUser({ ...editUser, area_id: e.target.value })}
                >
                  <option value="">No area</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowEdit(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleEdit} className="btn-primary flex-1">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
