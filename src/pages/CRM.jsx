import { useState } from 'react'
import { formatDate } from '../lib/utils'
import { MdSearch, MdAdd, MdLocalHospital, MdPerson, MdBusiness, MdScience, MdStore } from 'react-icons/md'

const CONTACTS = [
  { id: '1', name: 'Dr. Rahim Uddin', type: 'doctor', specialty: 'Endocrinologist', phone: '+880 1712-345678', org: 'Square Hospital', area: 'Panthapath', lastVisit: '2025-01-10' },
  { id: '2', name: 'Square Hospital', type: 'hospital', phone: '+880 2-8144400', org: null, area: 'Panthapath', lastVisit: '2025-01-12' },
  { id: '3', name: 'Lazz Pharma', type: 'pharmacy', phone: '+880 1812-987654', org: null, area: 'New Market', lastVisit: '2025-01-08' },
  { id: '4', name: 'Dr. Fatima Begum', type: 'doctor', specialty: 'Cardiologist', phone: '+880 1912-567890', org: 'Labaid Hospital', area: 'Dhanmondi', lastVisit: '2025-01-05' },
  { id: '5', name: 'Popular Diagnostic', type: 'diagnostic', phone: '+880 2-9123456', org: null, area: 'Mirpur', lastVisit: '2025-01-03' },
]

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
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const types = ['all', ...new Set(CONTACTS.map(c => c.type))]
  const filtered = CONTACTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || c.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500">{CONTACTS.length} contacts</p>
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_COLORS[contact.type]}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{contact.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{contact.type}{contact.specialty ? ` · ${contact.specialty}` : ''}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                {contact.org && <p>📍 {contact.org}</p>}
                <p>📞 {contact.phone}</p>
                <p>🗓 Last visit: {formatDate(contact.lastVisit)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
