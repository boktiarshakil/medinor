import { useState, useEffect } from 'react'
import { formatDate } from '../lib/utils'
import { MdSearch, MdAdd, MdLocalHospital, MdPerson, MdBusiness, MdScience, MdStore, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

const TYPE_ICONS = {
  doctor: MdPerson,
  hospital: MdLocalHospital,
  pharmacy: MdStore,
  diagnostic: MdScience,
  clinic: MdBusiness,
  other: MdBusiness,
}

const TYPE_COLORS = {
  doctor: 'bg-blue-50 text-blue-600',
  hospital: 'bg-red-50 text-red-600',
  pharmacy: 'bg-emerald-50 text-emerald-600',
  diagnostic: 'bg-purple-50 text-purple-600',
  clinic: 'bg-amber-50 text-amber-600',
  other: 'bg-gray-100 text-gray-600',
}

export default function CRM() {
  const [contacts, setContacts] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '', type: 'doctor', phone: '', specialty: '', address: '', organization: ''
  })

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)
    try {
      const [data, visitData] = await Promise.all([
        api.getCRMContacts(),
        api.getCRMVisits().catch(() => []),
      ])
      setContacts(data)
      setVisits(visitData || [])
    } catch (err) {
      console.error('CRM fetch failed:', err)
      setError(err.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContacts() }, [])

  const lastVisitMap = {}
  visits.forEach(v => {
    if (v.contact_id && !lastVisitMap[v.contact_id]) lastVisitMap[v.contact_id] = v.visit_date
  })

  const handleCreate = async () => {
    if (!newContact.name.trim()) {
      toast.error('Name is required')
      return
    }
    setCreating(true)
    try {
      await api.createCRMContact({
        name: newContact.name,
        type: newContact.type,
        phone: newContact.phone || null,
        specialty: newContact.specialty || null,
        address: newContact.address || null,
        notes: newContact.organization || null,
      })
      toast.success(`Contact "${newContact.name}" added`)
      setNewContact({ name: '', type: 'doctor', phone: '', specialty: '', address: '', organization: '' })
      setShowCreate(false)
      fetchContacts()
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const types = ['all', ...new Set(contacts.map(c => c.type || 'other'))]
  const filtered = contacts.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || (c.type || 'other') === typeFilter
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading contacts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button className="btn-secondary mt-3 text-xs" onClick={fetchContacts}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500">{contacts.length} contacts</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <MdAdd size={16} /> Add Contact
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search contacts..." className="input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-full sm:w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(contact => {
          const Icon = TYPE_ICONS[contact.type] || MdBusiness
          return (
            <div key={contact.id} className="card card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLORS[contact.type || 'other']}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{contact.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{contact.type}{contact.specialty ? ` · ${contact.specialty}` : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                {contact.notes && <p>📍 {contact.notes}</p>}
                {contact.phone && <p>📞 {contact.phone}</p>}
                {lastVisitMap[contact.id] && <p>🗓 Last visit: {formatDate(lastVisitMap[contact.id])}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdPerson size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No contacts found</p>
        </div>
      )}

      {/* Create Contact Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Add New Contact</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add to CRM database</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" className="input" placeholder="e.g. Dr. Rahim Uddin"
                  value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={newContact.type} onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}>
                  <option value="doctor">Doctor</option>
                  <option value="hospital">Hospital</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="clinic">Clinic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="+8801XXXXXXXXX"
                  value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Specialty</label>
                <input type="text" className="input" placeholder="e.g. Cardiology"
                  value={newContact.specialty} onChange={(e) => setNewContact({ ...newContact, specialty: e.target.value })} />
              </div>
              <div>
                <label className="label">Organization</label>
                <input type="text" className="input" placeholder="Hospital / Clinic name"
                  value={newContact.organization} onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })} />
              </div>
              <div>
                <label className="label">Address</label>
                <input type="text" className="input" placeholder="Full address"
                  value={newContact.address} onChange={(e) => setNewContact({ ...newContact, address: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={!newContact.name || creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Add Contact</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
