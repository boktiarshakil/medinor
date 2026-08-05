import { useState, useEffect } from 'react'
import { formatCurrency, statusColor } from '../lib/utils'
import { MdAdd, MdSearch, MdLocationOn, MdPhone, MdMoreVert, MdStore } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'


export default function Dealers() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')

  useEffect(() => { fetchDealers() }, [])

  const fetchDealers = async () => {
    try {
      setLoading(true)
      const data = await api.getDealers()
      // Normalize field names
      const normalized = data.map(d => ({
        ...d,
        owner: d.owner_name,
        mobile: d.mobile || d.phone,
        area: d.area || d.district,
        creditLimit: d.credit_limit,
        due: d.current_due,
        status: d.status || 'active',
      }))
      setDealers(normalized)
    } catch (err) {
      console.error('Dealers fetch failed:', err)
      toast.error('Failed to load dealers')
    } finally {
      setLoading(false)
    }
  }

  const districts = ['all', ...new Set(dealers.map(d => d.district || d.area))]
  const filtered = dealers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.owner || '').toLowerCase().includes(search.toLowerCase())
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
      </>
      )}
    </div>
  )
}

