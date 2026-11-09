import { useState, useRef } from 'react'
import { MdSearch, MdClose, MdPerson } from 'react-icons/md'

// Searchable CRM contact picker for the order flow.
// Search by name or phone number; pick a contact and the parent
// auto-fills name / phone / address from the CRM record.
// Props:
//   contacts — array from api.getCRMContacts() ({id, name, phone, mobile, address, type, ...})
//   selected — the picked contact object, or null
//   onSelect — called with the contact, or null when the pick is cleared
//   onManual — called when the user taps "enter manually" (buyer not in CRM yet)
export default function CRMCustomerPicker({ contacts = [], selected, onSelect, onManual, disabled = false }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const q = query.trim().toLowerCase()
  const matches = !q
    ? contacts.slice(0, 8)
    : contacts.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.mobile || '').toLowerCase().includes(q)
      ).slice(0, 8)

  const handlePick = (contact) => {
    onSelect(contact)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // A contact is picked — show it as a card with a clear button.
  if (selected) {
    return (
      <div>
        <div className="flex items-start gap-2 p-2.5 bg-brand-50 border border-brand-200 rounded-lg">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
            <MdPerson size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{selected.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {selected.type ? `${selected.type} · ` : ''}{selected.phone || selected.mobile || 'No phone'}
            </p>
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
          placeholder="Search CRM by name or phone..."
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
              <p className="px-3 py-3 text-xs text-gray-500">No CRM contact matches “{query}”.</p>
            ) : (
              matches.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePick(c)}
                  className="w-full text-left px-3 py-2 hover:bg-brand-50 border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.type ? `${c.type} · ` : ''}{c.phone || c.mobile || 'No phone'}
                    {c.address ? ` · ${c.address}` : ''}
                  </p>
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); onManual && onManual() }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 border-t border-gray-100"
            >
              + Customer not in CRM? Enter details manually
            </button>
          </div>
        </>
      )}
      {!open && onManual && (
        <button
          type="button"
          onClick={onManual}
          className="text-[11px] font-medium text-brand-600 hover:text-brand-700 mt-1"
        >
          Customer not in CRM? Enter details manually
        </button>
      )}
    </div>
  )
}
