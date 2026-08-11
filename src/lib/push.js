// ============================================================
// Web push notifications
// ============================================================

import { api } from './api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch (err) {
    console.error('Service worker registration failed:', err)
    return null
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

// Ask the browser for permission ("Allow notifications?" prompt).
export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.requestPermission()
}

// Get the PushManager subscription (creating it if needed).
export async function subscribeToPush(registration) {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY not set — push disabled')
    return null
  }
  let sub = await registration.pushManager.getSubscription()
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  return sub
}

// Prompt (if needed) and persist this device's subscription for the user.
export async function initPush(user) {
  if (!user?.id || !isPushSupported()) return { enabled: false, reason: 'unsupported' }
  if (Notification.permission === 'denied') return { enabled: false, reason: 'denied' }

  // This is where the real browser permission prompt appears.
  let granted = Notification.permission === 'granted'
  if (!granted) {
    try {
      granted = (await Notification.requestPermission()) === 'granted'
    } catch {
      return { enabled: false, reason: 'denied' }
    }
  }
  if (!granted) return { enabled: false, reason: 'denied' }

  const registration = await registerServiceWorker()
  if (!registration) return { enabled: false, reason: 'noregistration' }

  try {
    const sub = await subscribeToPush(registration)
    if (sub) {
      await api.savePushSubscription({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
      })
    }
    return { enabled: true, subscription: sub }
  } catch (err) {
    console.error('Web push subscribe failed:', err)
    return { enabled: false, reason: 'error' }
  }
}

// Remove this device's subscription.
export async function disablePush(user) {
  if (!user?.id || !isPushSupported()) return
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!registration) return
    const sub = await registration.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe().catch(() => {})
      await api.deletePushSubscription(user.id, sub.endpoint).catch(() => {})
    }
  } catch (err) {
    console.error('Web push unsubscribe failed:', err)
  }
}