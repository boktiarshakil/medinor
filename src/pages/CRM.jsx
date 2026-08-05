import { useState, useEffect } from 'react'
import { formatDate } from '../lib/utils'
import { MdSearch, MdAdd, MdLocalHospital, MdPerson, MdBusiness, MdScience, MdStore } from 'react-icons/md'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchContacts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getCRMContacts()
      setContacts(data)
    } catch (err) {
      console.error('CRM fetch failed:', err)
      setError(err.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContacts() }, [])

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
        <button className="btn-primary">
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
                {contact.org && <p>📍 {contact.org}</p>}
                {contact.phone && <p>📞 {contact.phone}</p>}
                {contact.last_visit && <p>🗓 Last visit: {formatDate(contact.last_visit)}</p>}
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
    </div>
  )
}
