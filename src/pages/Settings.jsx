import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { isPushSupported, initPush, disablePush } from '../lib/push'
import { MdSettings, MdPeople, MdNotifications, MdPalette, MdCheck, MdChevronRight, MdNotificationsActive, MdNotificationsOff, MdSmartphone } from 'react-icons/md'
import toast from 'react-hot-toast'

const DEFAULT_PREFS = {
  newOrderAlerts: true,
  paymentReceived: true,
  lowStockWarnings: true,
  targetAchievement: false,
}

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(`settings_${user?.id}`)
      return stored ? JSON.parse(stored) : DEFAULT_PREFS
    } catch {
      return DEFAULT_PREFS
    }
  })
  const [saved, setSaved] = useState(false)
  const [pushState, setPushState] = useState('checking')
  const [busy, setBusy] = useState(false)

  const checkPush = useCallback(() => {
    if (!isPushSupported()) {
      setPushState('unsupported')
      return
    }
    if (Notification.permission === 'granted') setPushState('enabled')
    else if (Notification.permission === 'denied') setPushState('denied')
    else setPushState('off')
  }, [])

  useEffect(() => {
    checkPush()
  }, [checkPush])

  const handleEnablePush = async () => {
    setBusy(true)
    try {
      const result = await initPush(user)
      if (result?.enabled) {
        setPushState('enabled')
        toast.success('Push notifications enabled')
      } else {
        checkPush()
        toast.error(result?.reason === 'denied' ? 'Permission blocked in browser settings' : 'Could not enable push notifications')
      }
    } catch (err) {
      toast.error('Failed: ' + err.message)
      checkPush()
    } finally {
      setBusy(false)
    }
  }

  const handleDisablePush = async () => {
    setBusy(true)
    try {
      await disablePush(user)
      setPushState('off')
      toast.success('Push notifications disabled')
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      localStorage.setItem(`settings_${user?.id}`, JSON.stringify(prefs))
      if (user?.id) {
        await api.updateUser(user.id, { updated_at: new Date().toISOString() }).catch(() => {})
      }
      setSaved(true)
      toast.success('Preferences saved')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const navItems = [
    { label: 'Manage Users & Roles', path: '/users', icon: MdPeople, roles: ['super_admin', 'admin'] },
    { label: 'Area Assignments', path: '/areas', icon: MdPeople, roles: ['super_admin', 'admin'] },
    { label: 'Dealer-SR Mapping', path: '/dealers', icon: MdPeople, roles: ['super_admin', 'admin', 'sales_manager', 'area_manager'] },
  ]

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdSettings size={16} className="text-brand-500" /> Quick Actions
          </h3>
          <div className="space-y-1">
            {visibleNav.map((item, i) => {
              const Icon = item.icon
              return (
                <a
                  key={i}
                  href={item.path}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} className="text-gray-400" />
                    {item.label}
                  </span>
                  <MdChevronRight size={16} className="text-gray-300" />
                </a>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdNotifications size={16} className="text-brand-500" /> Notifications
          </h3>
          <div className="space-y-3">
            {[
              { key: 'newOrderAlerts', label: 'New Order Alerts' },
              { key: 'paymentReceived', label: 'Payment Received' },
              { key: 'lowStockWarnings', label: 'Low Stock Warnings' },
              { key: 'targetAchievement', label: 'Target Achievement' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700">{item.label}</span>
                <button
                  type="button"
                  onClick={() => togglePref(item.key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${prefs[item.key] ? 'bg-brand-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full mt-4 text-xs disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : saved ? (
              <span className="flex items-center justify-center gap-1"><MdCheck size={14} /> Saved</span>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>

        {/* Push Notifications */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdSmartphone size={16} className="text-brand-500" /> Push Notifications
          </h3>
          <div className="space-y-3">
            {pushState === 'checking' && (
              <p className="text-sm text-gray-500">Checking browser support…</p>
            )}
            {pushState === 'unsupported' && (
              <p className="text-sm text-gray-500">
                Browser or device does not support web push notifications.
              </p>
            )}
            {pushState === 'denied' && (
              <p className="text-sm text-amber-600">
                Notifications are blocked in your browser. Enable them in the site permissions.
              </p>
            )}
            {pushState === 'enabled' && (
              <p className="text-sm text-emerald-600 inline-flex items-center gap-1.5">
                <MdNotificationsActive size={16} /> Receiving browser notifications
              </p>
            )}
            {pushState === 'off' && (
              <p className="text-sm text-gray-500">Browser notifications are turned off.</p>
            )}
            <div className="pt-1">
              {pushState === 'enabled' ? (
                <button onClick={handleDisablePush} disabled={busy} className="btn-secondary w-full text-xs disabled:opacity-50">
                  <MdNotificationsOff size={14} /> Disable Push Notifications
                </button>
              ) : (
                <button onClick={handleEnablePush} disabled={busy || !['off'].includes(pushState)} className="btn-primary w-full text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                  {busy ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : pushState === 'denied' ? (
                    'Permission Blocked'
                  ) : pushState === 'unsupported' ? (
                    'Not Supported'
                  ) : (
                    <><MdNotificationsActive size={14} /> Enable Push Notifications</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdPalette size={16} className="text-brand-500" /> Preferences
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Currency</label>
              <select className="input"><option>BDT (৳)</option></select>
            </div>
            <div>
              <label className="label">Date Format</label>
              <select className="input"><option>DD MMM YYYY</option></select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input"><option>English</option><option>বাংলা</option></select>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdPeople size={16} className="text-brand-500" /> Account
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-800">{user?.full_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{user?.email || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Role</span>
              <span className="badge-info text-[9px]">{user?.role || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Status</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${user?.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {user?.is_active !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
