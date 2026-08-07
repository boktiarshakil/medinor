import { useState, useEffect } from 'react'
import { formatCurrency, statusColor } from '../lib/utils'
import { MdAdd, MdSearch, MdLocationOn, MdPhone, MdMoreVert, MdStore, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Dealers() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [areas, setAreas] = useState([])
  const [newDealer, setNewDealer] = useState({
    name: '',
    owner_name: '',
    email: '',
    mobile: '',
    phone: '',
    address: '',
    district: '',
    area_id: '',
    credit_limit: 50000,
  })

  useEffect(() => {
    fetchDealers()
    api.getAreas().then(setAreas).catch(() => {})
  }, [])

  const fetchDealers = async () => {
    try {
      setLoading(true)
      const data = await api.getDealers()
      const normalized = data.map(d => ({
        ...d,
        owner: d.owner_name,
        mobile: d.mobile || d.phone,
        area: d.area?.name || d.area_name || d.area,
        creditLimit: d.credit_limit,
        due: d.current_due,
        status: d.status || 'active',
      }))
      setDealers(normalized)
    } catch (err) {
      console.error('Dealers fetch failed:', err.message, err.details || '', err.hint || '')
      toast.error('Dealers: ' + (err.message || 'Failed to load'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newDealer.name.trim()) {
      toast.error('Dealer name is required')
      return
    }
    if (!newDealer.mobile.trim()) {
      toast.error('Mobile number is required')
      return
    }
    setCreating(true)
    try {
      await api.createDealer({
        name: newDealer.name,
        owner_name: newDealer.owner_name || null,
        email: newDealer.email.trim() || null,
        mobile: newDealer.mobile.trim(),
        phone: newDealer.phone || null,
        address: newDealer.address || null,
        district: newDealer.district || null,
        area_id: newDealer.area_id || null,
        credit_limit: Number(newDealer.credit_limit) || 0,
      })
      toast.success(`Dealer "${newDealer.name}" created`)
      setNewDealer({ name: '', owner_name: '', email: '', mobile: '', phone: '', address: '', district: '', area_id: '', credit_limit: 50000 })
      setShowCreate(false)
      fetchDealers()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const districts = ['all', ...new Set(dealers.map(d => d.district || d.area).filter(Boolean))]
  const filtered = dealers.filter(d => {
    const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.owner || '').toLowerCase().includes(search.toLowerCase())
    const matchDistrict = districtFilter === 'all' || (d.district || d.area) === districtFilter
    return matchSearch && matchDistrict
  })

  const totalDue = dealers.reduce((sum, d) => sum + (d.due || d.current_due || 0), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dealers</h1>
          <p className="text-sm text-gray-500">{dealers.length} dealers · Total Due: <span className="font-semibold text-red-600">{formatCurrency(totalDue)}</span></p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> Add Dealer
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search dealers..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
        >
          {districts.map(d => (
            <option key={d} value={d}>{d === 'all' ? 'All Districts' : d}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading dealers...</p>
        </div>
      ) : (
      <>
      {/* Dealers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(dealer => (
          <div key={dealer.id} className="card card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <MdStore size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{dealer.name}</h3>
                  <p className="text-xs text-gray-500">{dealer.owner}</p>
                </div>
              </div>
              <span className={statusColor(dealer.status)}>{dealer.status}</span>
            </div>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MdPhone size={13} className="text-gray-400" /> {dealer.mobile || '-'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn size={13} className="text-gray-400" /> {dealer.area}{dealer.district ? `, ${dealer.district}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <p className="text-[10px] text-gray-400">Credit</p>
                <p className="text-xs font-semibold text-gray-800">{formatCurrency(dealer.creditLimit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Due</p>
                <p className={`text-xs font-semibold ${(dealer.due || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(dealer.due)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a href="/place-order" className="btn-primary flex-1 text-xs text-center">Place Order</a>
              <button className="btn-secondary text-xs">
                <MdMoreVert size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdStore size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No dealers found</p>
        </div>
      )}
      </>
      )}

      {/* Create Dealer Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add New Dealer</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create dealer account in database</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Dealer Name *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Medicine Point"
                    value={newDealer.name}
                    onChange={(e) => setNewDealer({ ...newDealer, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Owner Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Dr. Rahim Uddin"
                    value={newDealer.owner_name}
                    onChange={(e) => setNewDealer({ ...newDealer, owner_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Mobile *</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+8801XXXXXXXXX"
                    value={newDealer.mobile}
                    onChange={(e) => setNewDealer({ ...newDealer, mobile: e.target.value })}
                  />
                </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="+8801XXXXXXXXX"
                  value={newDealer.phone}
                  onChange={(e) => setNewDealer({ ...newDealer, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="dealer@example.com"
                value={newDealer.email}
                onChange={(e) => setNewDealer({ ...newDealer, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">District</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Dhaka"
                  value={newDealer.district}
                  onChange={(e) => setNewDealer({ ...newDealer, district: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Full address"
                  value={newDealer.address}
                  onChange={(e) => setNewDealer({ ...newDealer, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Area / Territory</label>
                  <select
                    className="input"
                    value={newDealer.area_id}
                    onChange={(e) => setNewDealer({ ...newDealer, area_id: e.target.value })}
                  >
                    <option value="">Select area...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Credit Limit</label>
                  <input
                    type="number"
                    className="input"
                    value={newDealer.credit_limit}
                    onChange={(e) => setNewDealer({ ...newDealer, credit_limit: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newDealer.name || creating}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <><MdAdd size={15} /> Create Dealer</>
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
