// ============================================================
// Image upload service (imgbb)
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
