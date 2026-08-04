import { useState } from 'react'
import { MdLocationOn, MdMyLocation, MdRefresh, MdPeople, MdCheckCircle, MdCancel } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'

const MOCK_STAFF = [
  { id: 1, name: 'Rahim Uddin', role: 'TSO', status: 'online', location: 'Dhanmondi 27, Dhaka', lat: 23.7465, lng: 90.3762, lastUpdate: '2 min ago', orders: 3, visits: 5, battery: 78 },
  { id: 2, name: 'Karim Ahmed', role: 'ASM', status: 'online', location: 'New Market, Dhaka', lat: 23.7300, lng: 90.3850, lastUpdate: '5 min ago', orders: 2, visits: 4, battery: 65 },
  { id: 3, name: 'Sajid Hasan', role: 'TSO', status: 'offline', location: 'Last: Mirpur 10', lat: 23.8062, lng: 90.3650, lastUpdate: '2 hours ago', orders: 0, visits: 0, battery: 12 },
  { id: 4, name: 'Nusrat Jahan', role: 'TSO', status: 'online', location: 'Uttara Sector 7', lat: 23.8728, lng: 90.3984, lastUpdate: '1 min ago', orders: 4, visits: 6, battery: 92 },
  { id: 5, name: 'Tanvir Rahman', role: 'TSO', status: 'online', location: 'Mirpur 11', lat: 23.8150, lng: 90.3650, lastUpdate: '8 min ago', orders: 1, visits: 3, battery: 45 },
  { id: 6, name: 'Faruk Hossain', role: 'TSO', status: 'offline', location: 'Last: Mohammadpur', lat: 23.7530, lng: 90.3620, lastUpdate: '3 hours ago', orders: 0, visits: 0, battery: 0 },
]

export default function GPSTracking() {
  const [staff] = useState(MOCK_STAFF)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [filter, setFilter] = useState('all') // all, online, offline

  const filteredStaff = filter === 'all' ? staff : staff.filter(s => s.status === filter)
  const onlineCount = staff.filter(s => s.status === 'online').length

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
          <button className="btn-secondary text-xs">
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
                <p className="font-bold text-gray-900">{selectedStaff.battery}%</p>
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
