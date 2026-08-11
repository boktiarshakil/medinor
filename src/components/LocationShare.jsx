import { useState, useEffect } from 'react'
import { MdMyLocation, MdLocationOff, MdRefresh } from 'react-icons/md'
import { locationSharing } from '../lib/geo'
import { useAuth } from '../context/AuthContext'

export default function LocationShare() {
  const { user } = useAuth()
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id && locationSharing.wasActive(user.id)) {
      toggle(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const toggle = (force) => {
    const shouldShare = typeof force === 'boolean' ? force : !sharing
    if (shouldShare) {
      locationSharing
        .start(user.id, { onError: setError })
        .then(({ ok }) => {
          if (ok) {
            setSharing(true)
            setError(null)
          }
        })
    } else {
      locationSharing.stop()
      setSharing(false)
      setError(null)
    }
  }

  const refreshNow = () => {
    if (!sharing) return
    toggle(true)
  }

  return (
    <div className={`rounded-xl border p-3 ${sharing ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            sharing ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>
            {sharing ? <MdMyLocation size={16} /> : <MdLocationOff size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">
              {sharing ? 'Sharing live location' : 'Live location sharing'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {sharing ? 'Updating your position every ~20 seconds' : 'Let your manager see where you are'}
            </p>
          </div>
        </div>
        <button
          onClick={() => toggle()}
          className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            sharing ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
          aria-pressed={sharing}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            sharing ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {sharing && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </p>
          <button onClick={refreshNow} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <MdRefresh size={11} /> Update now
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[10px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}