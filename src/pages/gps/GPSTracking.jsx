import { useState, useEffect } from 'react'
import { MdLocationOn, MdMyLocation, MdRefresh, MdPeople, MdCheckCircle, MdCancel } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'
import { api } from '../../lib/api'

// Sales roles eligible for GPS tracking
const SALES_ROLES = ['TSO', 'ASM', 'SR', 'Sales Rep', 'Territory Sales Officer', 'Area Sales Manager']

// Consider online if last GPS record within 30 minutes
const ONLINE_THRESHOLD_MS = 30 * 60 * 1000

function timeAgo(dateString) {
  if (!dateString) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return `${days} days ago`
}

export default function GPSTracking() {
  const [staff, setStaff] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [filter, setFilter] = useState('all') // all, online, offline
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStaffData = async () => {
    setLoading(true)
    setError(null)
    try {
      const users = await api.getUsers()
      // Filter for sales roles only
      const salesUsers = users.filter(u =>
        SALES_ROLES.includes(u.role) || u.role?.toLowerCase().includes('sales')
      )

      // Fetch latest GPS record for each user
      const staffWithLocation = await Promise.all(
        salesUsers.map(async (user) => {
          try {
            const gpsHistory = await api.getGPSHistory(user.id)
            const latest = gpsHistory?.[0]

            if (latest) {
              const lastSeen = new Date(latest.recorded_at).getTime()
              const isOnline = Date.now() - lastSeen < ONLINE_THRESHOLD_MS
              return {
                id: user.id,
                name: user.full_name || user.email || 'Unknown',
                role: user.role || 'N/A',
                status: isOnline ? 'online' : 'offline',
                location: latest.lat && latest.lng
                  ? `${latest.lat.toFixed(4)}, ${latest.lng.toFixed(4)}`
                  : 'Unknown',
                lat: latest.lat,
                lng: latest.lng,
                lastUpdate: timeAgo(latest.recorded_at),
                orders: '—',
                visits: '—',
                battery: latest.battery_pct ?? '—',
              }
            }

            // User exists but has no GPS data
            return {
              id: user.id,
              name: user.full_name || user.email || 'Unknown',
              role: user.role || 'N/A',
              status: 'offline',
              location: 'No location data',
              lat: null,
              lng: null,
              lastUpdate: 'Never',
              orders: '—',
              visits: '—',
              battery: '—',
            }
          } catch {
            return {
              id: user.id,
              name: user.full_name || user.email || 'Unknown',
              role: user.role || 'N/A',
              status: 'offline',
              location: 'Unknown',
              lat: null,
              lng: null,
              lastUpdate: 'Error',
              orders: '—',
              visits: '—',
              battery: '—',
            }
          }
        })
      )

      setStaff(staffWithLocation)
    } catch (err) {
      console.error('Failed to fetch staff data:', err)
      setError(err.message || 'Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffData()
  }, [])

  const filteredStaff = filter === 'all' ? staff : staff.filter(s => s.status === filter)
  const onlineCount = staff.filter(s => s.status === 'online').length

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading staff location data…</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <MdCancel className="text-red-500" size={28} />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">Failed to load GPS data</p>
        <p className="text-xs text-gray-500 mb-4 max-w-xs text-center">{error}</p>
        <button onClick={fetchStaffData} className="btn-primary text-xs flex items-center gap-1.5">
          <MdRefresh size={14} /> Retry
        </button>
      </div>
    )
  }

  // Empty state
  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <MdLocationOn className="text-gray-400" size={28} />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">No GPS data available</p>
        <p className="text-xs text-gray-500 max-w-sm text-center">
          Staff location tracking will appear here once team members start sharing location.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdMyLocation className="text-brand-600" size={22} />
            Live GPS Tracking
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Monitor field sales team location</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">{onlineCount} Online</span>
          </div>
          <button onClick={fetchStaffData} className="btn-secondary text-xs">
            <MdRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[
          { key: 'all', label: `All (${staff.length})` },
          { key: 'online', label: `Online (${onlineCount})` },
          { key: 'offline', label: `Offline (${staff.length - onlineCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Placeholder */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            {/* Map area */}
            <div className="relative h-[400px] bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-50 flex items-center justify-center">
              {/* Mock map with dots */}
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <path d="M50,200 Q100,100 200,150 T350,200" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                  <path d="M80,300 Q150,250 250,280 T380,320" fill="none" stroke="#94a3b8" strokeWidth="1"/>
                  <path d="M30,100 Q100,80 180,120" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                  <path d="M200,300 Q280,320 350,300" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                </svg>
              </div>
              {/* Staff pins */}
              {filteredStaff.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(s)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                    selectedStaff?.id === s.id ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                  }`}
                  style={{
                    left: `${20 + (i * 12) % 60}%`,
                    top: `${25 + (i * 17) % 50}%`,
                  }}
                >
                  <div className={`relative ${s.status === 'online' ? '' : 'opacity-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                      s.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    {s.status === 'online' && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-[10px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-gray-600">Online</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full" />
                  <span className="text-gray-600">Offline</span>
                </div>
              </div>
              {/* Dhaka label */}
              <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-semibold text-gray-600">
                Dhaka, Bangladesh
              </div>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredStaff.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStaff(s)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedStaff?.id === s.id
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    s.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}>
                    {s.name.charAt(0)}
                  </div>
                  {s.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.role}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                    <HiLocationMarker size={10} />
                    <span className="truncate">{s.location}</span>
                  </p>
                </div>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-500">
                  <MdLocationOn size={10} className="inline" /> {s.lastUpdate}
                </span>
                <span className="text-[10px] text-gray-500">{s.orders} orders</span>
                <span className="text-[10px] text-gray-500">{s.visits} visits</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Staff Detail */}
      {selectedStaff && (
        <div className="card p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                selectedStaff.status === 'online' ? 'bg-emerald-500' : 'bg-gray-400'
              }`}>
                {selectedStaff.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedStaff.name}</p>
                <p className="text-xs text-gray-500">{selectedStaff.role} · {selectedStaff.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="font-bold text-gray-900">{selectedStaff.orders}</p>
                <p className="text-[10px] text-gray-400">Orders</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{selectedStaff.visits}</p>
                <p className="text-[10px] text-gray-400">Visits</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">
                  {typeof selectedStaff.battery === 'number' ? `${selectedStaff.battery}%` : selectedStaff.battery}
                </p>
                <p className="text-[10px] text-gray-400">Battery</p>
              </div>
              <span className={`badge ${selectedStaff.status === 'online' ? 'badge-success' : 'badge-gray'}`}>
                {selectedStaff.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
