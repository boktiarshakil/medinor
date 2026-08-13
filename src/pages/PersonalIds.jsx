import { useState, useEffect } from 'react'
import { formatDate, generatePersonalId } from '../lib/utils'
import { api } from '../lib/api'
import { MdContentCopy, MdAdd, MdSearch, MdBadge, MdCheckCircle, MdPerson, MdStore, MdRefresh, MdPersonAdd } from 'react-icons/md'
import toast from 'react-hot-toast'

export default function PersonalIds() {
  const [ids, setIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newId, setNewId] = useState({
    entity_name: '',
    entity_type: 'sr',
    area: '',
    create_account: false,
    email: '',
    phone: '',
    password: '',
  })
  const [copied, setCopied] = useState(null)
  const [areas, setAreas] = useState([])
  const [previewCode, setPreviewCode] = useState('')

  useEffect(() => {
    setPreviewCode(generatePersonalId(newId.entity_type))
  }, [newId.entity_type])

  const fetchIds = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try dedicated personal_ids table first
      const { data: personalIds, error: personalError } = await api.getPersonalIds()
      if (!personalError && personalIds && personalIds.length > 0) {
        setIds(personalIds)
        return
      }

      // Fallback: derive from dealers + user_profiles
      const [dealers, users] = await Promise.all([
        api.getDealers(),
        api.getUsers(),
      ])

      const dealerRows = (dealers || []).map(d => ({
        id: `dealer-${d.id}`,
        code: d.personal_id_code || generatePersonalId('dealer'),
        entity_type: 'dealer',
        entity_name: d.name,
        role: 'dealer',
        area: d.area?.name || d.area_name || d.territory || 'Unassigned',
        created_at: d.created_at || new Date().toISOString(),
        is_active: d.is_active !== false,
        total_orders: d.total_orders || 0,
        total_collected: d.total_collected || 0,
      }))

      const srRows = (users || [])
        .filter(u => u.role === 'sales_executive' || u.role === 'area_manager' || u.role === 'sales_manager')
        .map(u => ({
          id: `sr-${u.id}`,
          code: u.personal_id_code || generatePersonalId('sr'),
          entity_type: 'sr',
          entity_name: u.full_name || u.email,
          role: u.role,
          area: u.area?.name || u.area_name || u.area_id || 'Unassigned',
          created_at: u.created_at || new Date().toISOString(),
          is_active: u.is_active !== false,
          total_orders: u.total_orders || 0,
          total_collected: u.total_collected || 0,
        }))

      setIds([...dealerRows, ...srRows])
    } catch (err) {
      console.error('Failed to fetch personal IDs:', err)
      setError(err.message || 'Failed to load personal IDs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIds()
    api.getAreas().then(setAreas).catch(() => {})
  }, [])

  const filtered = ids.filter(item => {
    const matchSearch = (item.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.entity_name || '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || item.entity_type === typeFilter
    return matchSearch && matchType
  })

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleCreate = async () => {
    if (!newId.entity_name.trim()) {
      toast.error('Name is required')
      return
    }
    setCreating(true)
      try {
        const code = previewCode || generatePersonalId(newId.entity_type)

        // Persist to personal_ids table
        try {
          const areaName = areas.find(a => a.id === newId.area)?.name || newId.area || 'Unassigned'
          await api.createPersonalId({
            code,
            entity_type: newId.entity_type,
            entity_name: newId.entity_name,
            area: areaName,
            is_active: true,
          })
        } catch (dbErr) {
          console.warn('Could not save to personal_ids table:', dbErr)
          // Continue — table may not exist yet
        }

      // Optionally create user account
      if (newId.create_account && newId.email) {
        try {
          await api.createUser({
            email: newId.email,
            full_name: newId.entity_name,
            phone: newId.phone || '',
            role: newId.entity_type === 'dealer' ? 'dealer' : 'sales_executive',
            area_id: newId.area || null,
            password: newId.password || 'Mediron@2025',
          })
          toast.success(`Account created for ${newId.entity_name}`)
        } catch (userErr) {
          toast.error(`ID created but account failed: ${userErr.message}`)
        }
      } else {
        toast.success(`ID generated: ${code}`)
      }

      // Refresh list
      fetchIds()
      setNewId({ entity_name: '', entity_type: 'sr', area: '', create_account: false, email: '', phone: '', password: '' })
      setShowCreate(false)
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (id) => {
    const item = ids.find(i => i.id === id)
    if (!item) return
    const newActive = !item.is_active
    setIds(ids.map(i => i.id === id ? { ...i, is_active: newActive } : i))
    try {
      await api.updatePersonalId(id, { is_active: newActive })
    } catch (err) {
      setIds(ids.map(i => i.id === id ? { ...i, is_active: item.is_active } : i))
      toast.error('Failed to update status')
    }
  }

  const totalActive = ids.filter(i => i.is_active).length
  const totalSRs = ids.filter(i => i.entity_type === 'sr').length
  const totalDealers = ids.filter(i => i.entity_type === 'dealer').length

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Personal IDs</h1>
            <p className="text-sm text-gray-500">Unique codes for order attribution & price isolation</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading personal IDs…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personal IDs</h1>
          <p className="text-sm text-gray-500">Unique codes for order attribution & price isolation</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <MdAdd size={16} /> Generate ID
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card p-4 bg-red-50 border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-red-800">Failed to load IDs</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={fetchIds}
              className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
            >
              <MdRefresh size={14} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="card p-4 bg-amber-50 border-amber-100">
        <div className="flex items-start gap-3">
          <MdBadge size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-1">Why Personal IDs?</p>
            <ul className="text-[11px] text-amber-700 space-y-0.5">
              <li>• Each SR/dealer gets a <strong>unique code</strong> for order tracking</li>
              <li>• SR uses code to place orders — system auto-applies <strong>their price tier</strong></li>
              <li>• Dealer uses code to access app — sees <strong>only their data</strong></li>
              <li>• Invoice fully paid triggers <strong>auto-settlement</strong> after delivery</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
          <p className="text-[10px] text-gray-400 uppercase">Active IDs</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalSRs}</p>
          <p className="text-[10px] text-gray-400 uppercase">SR Codes</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalDealers}</p>
          <p className="text-[10px] text-gray-400 uppercase">Dealer Codes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by code or name..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-40"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="sr">SR Only</option>
          <option value="dealer">Dealer Only</option>
        </select>
      </div>

      {/* IDs List */}
      <div className="space-y-3">
        {filtered.map(item => (
          <div key={item.id} className={`card p-4 ${!item.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.entity_type === 'sr' ? 'bg-blue-50' : 'bg-purple-50'
                }`}>
                  {item.entity_type === 'sr'
                    ? <MdPerson size={20} className="text-blue-600" />
                    : <MdStore size={20} className="text-purple-600" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{item.entity_name}</h3>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                      item.entity_type === 'sr'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {item.entity_type === 'sr' ? 'SR' : 'Dealer'}
                    </span>
                    {!item.is_active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.area}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Code Display */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <code className="text-sm font-mono font-bold text-gray-800">{item.code}</code>
                  <button
                    onClick={() => copyToClipboard(item.code)}
                    className="text-gray-400 hover:text-brand-600 transition-colors"
                    title="Copy code"
                  >
                    {copied === item.code
                      ? <MdCheckCircle size={14} className="text-emerald-500" />
                      : <MdContentCopy size={14} />
                    }
                  </button>
                </div>

                {/* Actions */}
                <button
                  onClick={() => toggleActive(item.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                    item.is_active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {item.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
              <span>Orders: <strong className="text-gray-700">{item.total_orders}</strong></span>
              <span>Collected: <strong className="text-gray-700">৳{(item.total_collected || 0).toLocaleString()}</strong></span>
              <span>Created: {formatDate(item.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State — when no IDs at all */}
      {!loading && !error && ids.length === 0 && (
        <div className="card p-12 text-center">
          <MdBadge size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">No personal IDs generated yet</p>
          <p className="text-xs text-gray-400 mb-4">Generate unique codes for SRs and dealers to enable order attribution</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <MdAdd size={15} /> Generate First ID
          </button>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && ids.length > 0 && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdBadge size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No IDs found matching your search</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Generate Personal ID</h3>
              <p className="text-xs text-gray-500 mt-0.5">Create unique code for SR or dealer</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Entity Type</label>
                <select
                  className="input"
                  value={newId.entity_type}
                  onChange={(e) => setNewId({ ...newId, entity_type: e.target.value })}
                >
                  <option value="sr">Sales Representative (SR)</option>
                  <option value="dealer">Dealer / Distributor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Rahim Uddin"
                  value={newId.entity_name}
                  onChange={(e) => setNewId({ ...newId, entity_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Area / Territory</label>
                <select
                  className="input"
                  value={newId.area}
                  onChange={(e) => setNewId({ ...newId, area: e.target.value })}
                >
                  <option value="">Select area...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Preview Code</p>
                <code className="text-sm font-mono font-bold text-brand-600">
                  {previewCode}
                </code>
              </div>

              {/* Create Account Toggle */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newId.create_account}
                    onChange={(e) => setNewId({ ...newId, create_account: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                      <MdPersonAdd size={14} /> Also create user account
                    </span>
                    <span className="text-[10px] text-blue-600">User can sign in to the app</span>
                  </div>
                </label>

                {newId.create_account && (
                  <div className="mt-3 space-y-3 pl-6">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Email *</label>
                      <input
                        type="email"
                        className="input"
                        placeholder="user@kgsmgroup.com"
                        value={newId.email}
                        onChange={(e) => setNewId({ ...newId, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                        <input
                          type="tel"
                          className="input"
                          placeholder="+8801XXXXXXXXX"
                          value={newId.phone}
                          onChange={(e) => setNewId({ ...newId, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Password</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Mediron@2025"
                          value={newId.password}
                          onChange={(e) => setNewId({ ...newId, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newId.entity_name || creating || (newId.create_account && !newId.email)}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><MdAdd size={15} /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
