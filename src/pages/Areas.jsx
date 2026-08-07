import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { MdAdd, MdSearch, MdEdit, MdDelete, MdClose, MdLocationOn, MdPerson } from 'react-icons/md'
import toast from 'react-hot-toast'

export default function Areas() {
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [managers, setManagers] = useState([])
  const [newArea, setNewArea] = useState({ name: '', code: '', district: '', division: '', manager_id: '' })

  const fetchAreas = async () => {
    try {
      setLoading(true)
      const data = await api.getAreas()
      setAreas(data)
    } catch (err) {
      toast.error('Failed to load areas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAreas()
    api.getUsers()
      .then(users => setManagers(users.filter(u => ['sales_manager', 'area_manager'].includes(u.role) && u.is_active)))
      .catch(() => {})
  }, [])

  const handleCreate = async () => {
    if (!newArea.name.trim()) {
      toast.error('Area name is required')
      return
    }
    setCreating(true)
    try {
      const payload = { name: newArea.name }
      if (newArea.code) payload.code = newArea.code
      if (newArea.district) payload.district = newArea.district
      if (newArea.division) payload.division = newArea.division
      if (newArea.manager_id) payload.manager_id = newArea.manager_id
      await api.createArea(payload)
      toast.success(`Area "${newArea.name}" created`)
      setNewArea({ name: '', code: '', district: '', division: '', manager_id: '' })
      setShowCreate(false)
      fetchAreas()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (area) => {
    setEditingArea({
      id: area.id,
      name: area.name || '',
      code: area.code || '',
      district: area.district || '',
      division: area.division || '',
      manager_id: area.manager_id || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingArea.name.trim()) {
      toast.error('Area name is required')
      return
    }
    setSaving(true)
    try {
      const payload = { name: editingArea.name }
      if (editingArea.code) payload.code = editingArea.code
      if (editingArea.district) payload.district = editingArea.district
      if (editingArea.division) payload.division = editingArea.division
      if (editingArea.manager_id) payload.manager_id = editingArea.manager_id
      await api.updateArea(editingArea.id, payload)
      toast.success(`Area "${editingArea.name}" updated`)
      setEditingArea(null)
      fetchAreas()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (area) => {
    if (!confirm(`Delete area "${area.name}"? This cannot be undone.`)) return
    setDeletingId(area.id)
    try {
      await api.deleteArea(area.id)
      toast.success(`Area "${area.name}" deleted`)
      fetchAreas()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = areas.filter(a => {
    const q = search.toLowerCase()
    return !q || a.name.toLowerCase().includes(q) || (a.code || '').toLowerCase().includes(q) || (a.district || '').toLowerCase().includes(q)
  })

  const managerName = (id) => managers.find(m => m.id === id)?.full_name || null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Areas / Territories</h1>
          <p className="text-sm text-gray-500">Define sales areas to assign to managers, SRs and dealers</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> Add Area
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, code or district..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading areas...</p>
        </div>
      ) : (
        <>
          {/* Areas Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(area => (
              <div key={area.id} className="card card-hover p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                      <MdLocationOn size={20} className="text-brand-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{area.name}</h3>
                      {area.code && <p className="text-[10px] font-mono text-gray-400">{area.code}</p>}
                    </div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${area.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {area.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-50 space-y-1 text-xs text-gray-500">
                  {area.district && (
                    <div className="flex items-center gap-1.5">
                      <MdLocationOn size={12} className="text-gray-400" />
                      <span>{area.district}{area.division ? `, ${area.division}` : ''}</span>
                    </div>
                  )}
                  {managerName(area.manager_id) && (
                    <div className="flex items-center gap-1.5">
                      <MdPerson size={12} className="text-gray-400" />
                      <span>{managerName(area.manager_id)}</span>
                    </div>
                  )}
                  {!area.district && !managerName(area.manager_id) && (
                    <p className="text-gray-400">No district or manager assigned</p>
                  )}
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button className="btn-ghost flex-1 text-xs" onClick={() => handleEdit(area)}>
                    <MdEdit size={14} /> Edit
                  </button>
                  <button
                    className="btn-ghost text-xs text-red-500 hover:bg-red-50"
                    onClick={() => handleDelete(area)}
                    disabled={deletingId === area.id}
                  >
                    {deletingId === area.id
                      ? <div className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
                      : <MdDelete size={14} />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <MdLocationOn size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No areas found</p>
              <p className="text-xs text-gray-400 mt-1">Add an area to start assigning territories</p>
            </div>
          )}
        </>
      )}

      {/* Create Area Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add New Area</h3>
                <p className="text-xs text-gray-500 mt-0.5">Define a sales territory</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Area Name *</label>
                <input type="text" className="input" placeholder="e.g. Dhaka North"
                  value={newArea.name} onChange={(e) => setNewArea({ ...newArea, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Area Code</label>
                  <input type="text" className="input" placeholder="DKA-N"
                    value={newArea.code} onChange={(e) => setNewArea({ ...newArea, code: e.target.value })} />
                </div>
                <div>
                  <label className="label">District</label>
                  <input type="text" className="input" placeholder="Dhaka"
                    value={newArea.district} onChange={(e) => setNewArea({ ...newArea, district: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Division</label>
                <input type="text" className="input" placeholder="Dhaka Division"
                  value={newArea.division} onChange={(e) => setNewArea({ ...newArea, division: e.target.value })} />
              </div>
              <div>
                <label className="label">Manager</label>
                <select className="input" value={newArea.manager_id}
                  onChange={(e) => setNewArea({ ...newArea, manager_id: e.target.value })}>
                  <option value="">No manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.role === 'sales_manager' ? 'Sales Manager' : 'Area Manager'})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={!newArea.name || creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Create Area</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Area Modal */}
      {editingArea && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Edit Area</h3>
                <p className="text-xs text-gray-500 mt-0.5">Update area details</p>
              </div>
              <button onClick={() => setEditingArea(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Area Name *</label>
                <input type="text" className="input" placeholder="e.g. Dhaka North"
                  value={editingArea.name} onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Area Code</label>
                  <input type="text" className="input" placeholder="DKA-N"
                    value={editingArea.code} onChange={(e) => setEditingArea({ ...editingArea, code: e.target.value })} />
                </div>
                <div>
                  <label className="label">District</label>
                  <input type="text" className="input" placeholder="Dhaka"
                    value={editingArea.district} onChange={(e) => setEditingArea({ ...editingArea, district: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Division</label>
                <input type="text" className="input" placeholder="Dhaka Division"
                  value={editingArea.division} onChange={(e) => setEditingArea({ ...editingArea, division: e.target.value })} />
              </div>
              <div>
                <label className="label">Manager</label>
                <select className="input" value={editingArea.manager_id || ''}
                  onChange={(e) => setEditingArea({ ...editingArea, manager_id: e.target.value })}>
                  <option value="">No manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.role === 'sales_manager' ? 'Sales Manager' : 'Area Manager'})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingArea(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSaveEdit} disabled={!editingArea.name || saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <>Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
