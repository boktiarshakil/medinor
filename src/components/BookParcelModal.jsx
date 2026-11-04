import { useState, useEffect } from 'react'
import { MdClose, MdLocalShipping } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

// Shared by Orders + COD Requests. Mirrors the old site's "Book Parcel"
// modal: same fields, same validation, same Packzy create_order payload.
export default function BookParcelModal({ open, onClose, defaults = {}, onBooked }) {
  const [form, setForm] = useState(defaults)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (open) setForm(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ])

  if (!open) return null

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleBook = async () => {
    if (!(form.invoice || '').trim()) return toast.error('Invoice / order number is required')
    if (!(form.recipient_name || '').trim()) return toast.error('Recipient name is required')
    if (!(form.recipient_phone || '').trim()) return toast.error('Recipient phone is required')
    if (!(form.recipient_address || '').trim()) return toast.error('Recipient address is required')
    setBooking(true)
    try {
      const res = await api.packzy('create_order', {
        payload: {
          invoice: String(form.invoice).slice(0, 100),
          recipient_name: String(form.recipient_name).slice(0, 100),
          recipient_phone: String(form.recipient_phone).slice(0, 40),
          recipient_address: String(form.recipient_address).slice(0, 490),
          cod_amount: Number(form.cod_amount) || 0,
          ...(form.note ? { note: String(form.note).slice(0, 480) } : {}),
        },
      })
      const data = res?.data || res || {}
      const consignment = data.consignment || data.data || data
      const result = {
        consignment_id: consignment.consignment_id ? String(consignment.consignment_id) : null,
        tracking_code: consignment.tracking_code ? String(consignment.tracking_code) : null,
        status: consignment.status || 'in_review',
      }
      if (!result.consignment_id) throw new Error('Courier returned no consignment id')
      toast.success('Parcel booked with courier')
      try {
        await onBooked?.(result)
      } catch {
        // The caller reports its own save errors (e.g. "could not save locally")
      }
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to book parcel', { duration: 8000 })
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdLocalShipping size={18} className="text-brand-500" />
            <div>
              <h3 className="text-sm font-bold text-gray-900">Book Parcel</h3>
              <p className="text-xs text-gray-500 mt-0.5">Send this order to the courier (Packzy)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Invoice / Order # *</label>
            <input className="input" value={form.invoice || ''} onChange={(e) => set('invoice', e.target.value)} />
            <p className="text-[10px] text-gray-400 mt-1">Must be unique — the courier refuses duplicate invoices.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Recipient Name *</label>
              <input className="input" value={form.recipient_name || ''} onChange={(e) => set('recipient_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Recipient Phone *</label>
              <input className="input" value={form.recipient_phone || ''} onChange={(e) => set('recipient_phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Recipient Address *</label>
            <textarea className="input" rows={2} value={form.recipient_address || ''} onChange={(e) => set('recipient_address', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">COD Amount (৳)</label>
              <input type="number" className="input" value={form.cod_amount ?? 0} onChange={(e) => set('cod_amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Note</label>
              <input className="input" placeholder="Optional note" value={form.note || ''} onChange={(e) => set('note', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={booking}>Cancel</button>
            <button onClick={handleBook} disabled={booking} className="btn-primary flex-1 disabled:opacity-50">
              {booking ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <><MdLocalShipping size={15} /> Book Parcel</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
