import { useState, useRef } from 'react'
import { MdSearch, MdClose, MdStore } from 'react-icons/md'

// Searchable dealer picker — the same search style as the CRM customer picker.
// Search by dealer name or phone number; pick a dealer and the parent uses it.
// Props:
//   dealers — array from api.getDealers() ({id, name, phone, mobile, contact_number, address, ...})
//   selected — the picked dealer object, or null
//   onSelect — called with the dealer, or null when the pick is cleared
export default function DealerPicker({ dealers = [], selected, onSelect, disabled = false }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const q = query.trim().toLowerCase()
  const phoneOf = (d) => d.phone || d.mobile || d.contact_number || ''
  const matches = !q
    ? dealers.slice(0, 8)
    : dealers.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        phoneOf(d).toLowerCase().includes(q) ||
        (d.address || '').toLowerCase().includes(q)
      ).slice(0, 8)

  const handlePick = (dealer) => {
    onSelect(dealer)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // A dealer is picked — show it as a card with a clear button.
  if (selected) {
    return (
      <div>
        <div className="flex items-start gap-2 p-2.5 bg-brand-50 border border-brand-200 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
            <MdStore size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{selected.name}</p>
            <p className="text-xs text-gray-500 truncate">{phoneOf(selected) || 'No phone'}</p>
            {selected.address && (
              <p className="text-xs text-gray-500 truncate">{selected.address}</p>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Clear selection"
            >
              <MdClose size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          className="input pl-10"
          placeholder="Search dealer by name or phone..."
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {matches.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500">No dealer matches “{query}”.</p>
            ) : (
              matches.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handlePick(d)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">
                    {phoneOf(d) || 'No phone'}
                    {d.address ? ` · ${d.address}` : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
