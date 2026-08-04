import { useState } from 'react'
import { formatCurrency, statusColor } from '../lib/utils'
import { MdAdd, MdSearch, MdLocationOn, MdPhone, MdMoreVert, MdStore } from 'react-icons/md'

const DEALERS = [
  { id: '1', name: 'Medicine Point', owner: 'Dr. Rahim Uddin', mobile: '+880 1712-345678', district: 'Dhaka', area: 'Dhanmondi', creditLimit: 50000, due: 12300, status: 'active', sr: 'Rahim Uddin', lastOrder: '2025-01-10' },
  { id: '2', name: 'Lazz Pharma', owner: 'Mr. Karim', mobile: '+880 1812-987654', district: 'Dhaka', area: 'New Market', creditLimit: 75000, due: 8750, status: 'active', sr: 'Karim Ahmed', lastOrder: '2025-01-08' },
  { id: '3', name: 'HealthCare Ltd', owner: 'Ms. Fatima', mobile: '+880 1912-567890', district: 'Dhaka', area: 'Elephant Road', creditLimit: 30000, due: 0, status: 'active', sr: 'Sajid Hasan', lastOrder: '2025-01-05' },
  { id: '4', name: 'Central Pharmacy', owner: 'Mr. Hasan', mobile: '+880 1612-345123', district: 'Dhaka', area: 'Nilkhet', creditLimit: 40000, due: 8750, status: 'active', sr: 'Nusrat Jahan', lastOrder: '2025-01-03' },
  { id: '5', name: 'Square Hospital Pharmacy', owner: 'Mr. Alam', mobile: '+880 1512-789456', district: 'Dhaka', area: 'Panthapath', creditLimit: 100000, due: 22000, status: 'active', sr: 'Tanvir Rahman', lastOrder: '2025-01-12' },
  { id: '6', name: 'Chittagong Medical', owner: 'Dr. Roy', mobile: '+880 1812-222333', district: 'Chattogram', area: 'GEC', creditLimit: 60000, due: 35000, status: 'active', sr: 'Faruk Hossain', lastOrder: '2025-01-09' },
  { id: '7', name: 'Rajshahi Health Plus', owner: 'Mr. Islam', mobile: '+880 1712-444555', district: 'Rajshahi', area: 'Shaheb Bazar', creditLimit: 25000, due: 15000, status: 'inactive', sr: 'Rahim Uddin', lastOrder: '2024-12-20' },
]

export default function Dealers() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')

  const districts = ['all', ...new Set(DEALERS.map(d => d.district))]
  const filtered = DEALERS.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.owner.toLowerCase().includes(search.toLowerCase())
    const matchDistrict = districtFilter === 'all' || d.district === districtFilter
    return matchSearch && matchDistrict
  })

  const totalDue = DEALERS.reduce((sum, d) => sum + d.due, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dealers</h1>
          <p className="text-sm text-gray-500">{DEALERS.length} dealers · Total Due: <span className="font-semibold text-red-600">{formatCurrency(totalDue)}</span></p>
        </div>
        <button className="btn-primary">
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
                <MdPhone size={13} className="text-gray-400" /> {dealer.mobile}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MdLocationOn size={13} className="text-gray-400" /> {dealer.area}, {dealer.district}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <p className="text-[10px] text-gray-400">Credit</p>
                <p className="text-xs font-semibold text-gray-800">{formatCurrency(dealer.creditLimit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Due</p>
                <p className={`text-xs font-semibold ${dealer.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(dealer.due)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">SR</p>
                <p className="text-xs font-semibold text-gray-800">{dealer.sr}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn-primary flex-1 text-xs">Place Order</button>
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
    </div>
  )
}
