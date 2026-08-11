import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdLocationOn, MdMyLocation, MdRefresh, MdCheckCircle, MdCancel, MdStore } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

// Roles shown on the live map (sales roles + dealers who share location)
const TRACKED_ROLES = ['sales_executive', 'area_manager', 'sales_manager', 'admin', 'super_admin', 'dealer']

// Consider online if last GPS record within 30 minutes
const ONLINE_THRESHOLD_MS = 30 * 60 * 1000

// Dhaka fallback center
const DEFAULT_CENTER = [23.8103, 90.4125]

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

function buildIcon(s, isDealer) {
  const online = s.status === 'online'
  const color = isDealer ? '#3b82f6' : online ? '#10b981' : '#9ca3af'
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:34px;height:34px;">
        <div style="width:34px;height:34px;border-radius:9999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff;">${s.name.charAt(0).toUpperCase()}</div>
        ${online || isDealer
          ? `<div style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:9999px;background:${online ? '#34d399' : '#60a5fa'};border:2px solid #fff;"><div style="width:100%;height:100%;border-radius:9999px;animation:gpspulse 1.6s ease-out infinite;"></div></div>`
          : ''}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

export default function GPSTracking() {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all') // all, online, offline
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)

  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerLayer = useRef(null)
  const tileLayer = useRef(null)
  const tileErrorCount = useRef(0)
  const [layerMode, setLayerMode] = useState('map') // map | satellite

  const fetchStaffData = async () => {
    setLoading(true)
    setError(null)
    try {
      const allUsers = await api.getUsers()
      const tracked = allUsers.filter(u =>
        TRACKED_ROLES.includes(u.role) || String(u.role || '').toLowerCase().includes('sales')
      )

      const withLocation = await Promise.all(
        tracked.map(async (user) => {
          try {
            const gpsHistory = await api.getGPSHistory(user.id)
            const latest = gpsHistory?.[0]
            if (latest) {
              const lastSeen = new Date(latest.recorded_at).getTime()
              const isOnline = Date.now() - lastSeen < ONLINE_THRESHOLD_MS
              const lat = Number(latest.latitude ?? latest.lat)
              const lng = Number(latest.longitude ?? latest.lng)
              return {
                id: user.id,
                name: user.full_name || user.email || 'Unknown',
                role: user.role || 'N/A',
                isDealer: user.role === 'dealer',
                status: lat && lng && isOnline ? 'online' : lat && lng ? 'offline' : 'no-location',
                lat: lat || null,
                lng: lng || null,
                lastUpdate: timeAgo(latest.recorded_at),
              }
            }
            return {
              id: user.id,
              name: user.full_name || user.email || 'Unknown',
              role: user.role || 'N/A',
              isDealer: user.role === 'dealer',
              status: 'no-location',
              lat: null,
              lng: null,
              lastUpdate: 'Never',
            }
          } catch {
            return {
              id: user.id,
              name: user.full_name || user.email || 'Unknown',
              role: user.role || 'N/A',
              isDealer: user.role === 'dealer',
              status: 'no-location',
              lat: null,
              lng: null,
              lastUpdate: 'Error',
            }
          }
        })
      )

      setUsers(withLocation)
      setLastSync(new Date())
    } catch (err) {
      console.error('Failed to fetch staff data:', err)
      setError(err.message || 'Failed to load staff data')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch + 60s poll fallback + realtime updates
  useEffect(() => {
    fetchStaffData()
    const poll = setInterval(() => fetchStaffData(), 60000)

    const channel = supabase
      .channel('gps-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gps_tracking' },
        () => fetchStaffData()
      )
      .subscribe()

    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [])

  const PRIMARY_OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  const FALLBACK_CARTO = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  const SATELLITE_ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

  const tileModeRef = useRef('map') // map | satellite
  const mapProviderRef = useRef('osm') // when in map mode: osm | carto
  const switchLayerRef = useRef(null)
  const userMovedRef = useRef(false)

  // Init map once the map container is actually rendered (after the first
  // data load completes and the loading branch is no longer shown).
  const showMap = !(loading && users.length === 0)

  useEffect(() => {
    if (!showMap || mapInstance.current) return
    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    })
    markerLayer.current = L.layerGroup().addTo(map)
    mapInstance.current = map
    map.on('dragstart zoomstart', () => { userMovedRef.current = true })

    const swap = () => {
      if (tileLayer.current) map.removeLayer(tileLayer.current)
      let url
      if (tileModeRef.current === 'satellite') {
        url = SATELLITE_ESRI
      } else {
        url = mapProviderRef.current === 'carto' ? FALLBACK_CARTO : PRIMARY_OSM
      }
      tileLayer.current = L.tileLayer(url, { maxZoom: 19, crossOrigin: true })
        .on('tileerror', () => {
          if (tileModeRef.current !== 'map' || mapProviderRef.current === 'carto') return
          tileErrorCount.current += 1
          // Primary OSM tiles blocked? auto-swap to the Carto map tiles.
          if (tileErrorCount.current >= 3) {
            tileErrorCount.current = 0
            mapProviderRef.current = 'carto'
            swap()
          }
        })
        .addTo(map)
    }
    swap()

    switchLayerRef.current = (mode) => {
      tileModeRef.current = mode
      if (mode === 'map') mapProviderRef.current = 'osm' // retry OSM on manual switch
      tileErrorCount.current = 0
      swap()
    }

    return () => {
      map.remove()
      mapInstance.current = null
      markerLayer.current = null
      tileLayer.current = null
      tileErrorCount.current = 0
      tileModeRef.current = 'map'
      mapProviderRef.current = 'osm'
      switchLayerRef.current = null
    }
  }, [showMap])

  const switchLayer = (mode) => {
    setLayerMode(mode)
    switchLayerRef.current && switchLayerRef.current(mode)
  }

  // Render markers when data changes (re-run once the map initializes)
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !markerLayer.current) return
    markerLayer.current.clearLayers()

    const located = users.filter(u => u.lat && u.lng)
    located.forEach((u) => {
      L.marker([u.lat, u.lng], {
        icon: buildIcon(u, u.isDealer),
        title: u.name,
      })
        .addTo(markerLayer.current)
        .bindPopup(`
          <div style="min-width:160px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <div style="width:28px;height:28px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;background:${u.status === 'online' ? '#10b981' : u.isDealer ? '#3b82f6' : '#9ca3af'};">${u.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight:700;font-size:12px;color:#111827;">${u.name}</div>
                <div style="font-size:10px;color:#6b7280;">${u.role}</div>
              </div>
            </div>
            <div style="font-size:10px;color:#374151;line-height:1.6;">
              <div><b>Status:</b> ${u.status === 'online' ? 'Online' : u.isDealer ? 'Dealer' : 'Offline'}</div>
              <div><b>Last seen:</b> ${u.lastUpdate}</div>
              <div><b>Coords:</b> ${u.lat.toFixed(5)}, ${u.lng.toFixed(5)}</div>
            </div>
          </div>
        `)
    })

    if (located.length > 0 && !userMovedRef.current) {
      map.fitBounds(L.latLngBounds(located.map(u => [u.lat, u.lng])), { padding: [40, 40], maxZoom: 15 })
    } else if (located.length === 0) {
      map.setView(DEFAULT_CENTER, 12)
    }
  }, [users, showMap])

  const filteredUsers = filter === 'all'
    ? users
    : users.filter(u => filter === 'online'
        ? u.status === 'online'
        : u.status === 'offline' || u.status === 'no-location')
  const onlineCount = users.filter(u => u.status === 'online').length
  const locatedCount = users.filter(u => u.lat && u.lng).length

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading staff location data…</p>
      </div>
    )
  }

  if (error && users.length === 0) {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdMyLocation className="text-brand-600" size={22} />
            Live GPS Tracking
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Real-time map of field sales team &amp; dealers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">{onlineCount} Online</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
          <button onClick={fetchStaffData} className="btn-secondary text-xs">
            <MdRefresh size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {[
          { key: 'all', label: `All (${users.length})` },
          { key: 'online', label: `Online (${onlineCount})` },
          { key: 'offline', label: `Offline (${users.length - onlineCount})` },
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
        {/* Real Map */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden relative">
            <div ref={mapRef} className="h-[440px] w-full" />
            <div className="absolute top-3 right-3 z-[1000] flex gap-1 p-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
              {[
                { key: 'map', label: 'Map' },
                { key: 'satellite', label: 'Satellite' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => switchLayer(m.key)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                    layerMode === m.key ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full inline-block" /> Offline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" /> Dealer
            </span>
            <span className="ml-auto">{locatedCount} with a location fix</span>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredUsers.map(u => (
            <button
              key={u.id}
              onClick={() => setSelectedId(u.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedId === u.id
                  ? 'border-brand-300 bg-brand-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    u.status === 'online' ? 'bg-emerald-500' : u.isDealer ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  {u.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900">{u.name}</p>
                  <p className="text-[10px] text-gray-400">{u.isDealer && <MdStore size={10} className="inline -mt-0.5" />} {u.role}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                    <HiLocationMarker size={10} />
                    <span className="truncate">{u.lat && u.lng ? `${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}` : 'No location data'}</span>
                  </p>
                </div>
                <span className={`badge ${u.status === 'online' ? 'badge-success' : u.isDealer ? 'badge-info' : u.status === 'no-location' ? 'badge-gray' : 'badge-gray'}`}>
                  {u.status === 'online' ? 'Online' : u.isDealer ? 'Dealer' : u.status === 'no-location' ? 'No data' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-500">
                  <MdLocationOn size={10} className="inline" /> {u.lastUpdate}
                </span>
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs text-gray-500">No matching users</p>
            </div>
          )}
        </div>
      </div>

      {/* How to enable */}
      <div className="card p-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-0">
        <div className="flex items-start gap-3">
          <MdLocationOn size={20} className="text-brand-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900">How staff appear on the map</p>
            <p className="text-xs text-gray-500 mt-1">
              Field team and dealers turn on <b>“Live location sharing”</b> from their dashboard. Their position is then
              streamed roughly every 20 seconds and shows here instantly over OpenStreetMap. Anyone with no recent GPS
              record within 30 minutes is marked offline.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}