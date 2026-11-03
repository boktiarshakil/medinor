import { supabase } from './supabase'

// ============================================================
// Image upload services: ImgBB (payment slips) and the website
// itself (product photos, via /api/upload-image.php)
// ============================================================

const IMGBB_API_KEY = '31c88cd7ccdb5aab5559f6438b59709d'

export async function uploadToImgBB(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  })
  const result = await res.json()
  if (!result.success) throw new Error(result.error?.message || 'Upload failed')
  return result.data.url
}

// ============================================================
// Website-hosted product photos (NOT ImgBB).
// POSTs the file to /api/upload-image.php on this same site, which
// stores it under /uploads/products/ and returns its website path.
// The caller's Supabase login session is sent along so the endpoint
// can refuse unsigned-in uploads; the Products page itself is
// admin-only in the app.
// ============================================================
export async function uploadToWebsite(file) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be signed in to upload photos')
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch('/api/upload-image.php', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const result = await res.json().catch(() => ({}))
  if (!res.ok || !result.url) throw new Error(result.error || 'Upload failed')
  return result.url
}

// ============================================================
// Payment methods
// Payments may only be made via these channels; every payment
// requires an uploaded slip / screenshot as proof.
// ============================================================

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'rtgs', label: 'RTGS' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nogod', label: 'Nogod' },
]

const LEGACY_METHOD_LABELS = {
  bank: 'Bank Transfer',
  nagad: 'Nogod',
  rocket: 'Rocket',
  card: 'Card',
  other: 'Other',
}

export function paymentMethodLabel(method) {
  if (!method) return '-'
  const match = PAYMENT_METHODS.find(m => m.value === method)
  if (match) return match.label
  return LEGACY_METHOD_LABELS[method] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ')
}
