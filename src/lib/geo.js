import { api } from './api'

// Singleton that manages browser geolocation reporting into gps_tracking.
// One live location share per browser tab; survives page navigation within
// the SPA. Polls ~every 20s with high accuracy and throttles writes so we
// don't spam the table while the user is standing still.

const MIN_REPORT_INTERVAL_MS = 15000
const POLL_INTERVAL_MS = 20000
const LOCATION_KEY = 'mediron_gps_sharing'

let timer = null
let activeUserId = null
let lastReportAt = 0

function storageKey(userId) {
  return `${LOCATION_KEY}_${userId}`
}

export const locationSharing = {
  isActive: () => Boolean(activeUserId),

  async start(userId, { onError } = {}) {
    if (!navigator.geolocation) {
      onError && onError('Geolocation is not supported by this browser.')
      return { ok: false, reason: 'unsupported' }
    }
    if (activeUserId === userId) return { ok: true }

    this.stop()
    activeUserId = userId
    try {
      localStorage.setItem(storageKey(userId), '1')
    } catch (_) { /* ignore */ }

    const report = () => {
      if (activeUserId !== userId) return
      const now = Date.now()
      if (now - lastReportAt < MIN_REPORT_INTERVAL_MS) return
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (activeUserId !== userId) return
          lastReportAt = Date.now()
          try {
            await api.saveLocation(userId, {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            })
          } catch (err) {
            console.error('Location upload failed:', err)
            onError && onError('Could not upload your location.')
          }
        },
        (err) => {
          console.error('Geolocation error:', err)
          onError && onError(err.code === 1
            ? 'Location permission denied — allow access to share live location.'
            : 'Location unavailable — turn on GPS and retry.')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      )
    }

    report()
    timer = setInterval(report, POLL_INTERVAL_MS)
    return { ok: true }
  },

  stop() {
    activeUserId = null
    lastReportAt = 0
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  },

  wasActive(userId) {
    try {
      return localStorage.getItem(storageKey(userId)) === '1'
    } catch (_) {
      return false
    }
  },
}