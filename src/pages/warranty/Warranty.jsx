import { useState, useEffect } from 'react'
import {
  MdQrCode, MdPhone, MdSms, MdSearch, MdCheckCircle, MdPending, MdVerified,
  MdPerson, MdInventory, MdAdd, MdLocalPhone, MdLocationOn, MdHistory,
  MdCall, MdMessage, MdClose, MdRefresh
} from 'react-icons/md'
import { formatDate, formatCurrency } from '../../lib/utils'
import { api } from '../../lib/api'

const normalizeWarranty = (w) => ({
  id: w.id,
  code: w.code || w.warranty_code || '',
  product: w.product || w.product_name || 'Unknown Product',
  customer: w.customer || w.name || w.full_name || 'Unknown',
  phone: w.phone || w.mobile || '',
  address: w.address || '',
  purchaseDate: w.purchase_date || w.purchaseDate || w.created_at,
  warrantyTill: w.warranty_till || w.warranty_end || '',
  status: w.status || (w.warranty_till && new Date(w.warranty_till) > new Date() ? 'active' : ''),
  registeredVia: w.registered_via || w.source || '',
  stickerNo: w.sticker_no || w.sticker || w.code || '',
})

export default function Warranty() {
  const [warranties, setWarranties] = useState([])
  const [missedCalls, setMissedCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [activeTab, setActiveTab] = useState('search')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [phoneResult, setPhoneResult] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: '', phone: '', address: '', product: '', stickerNo: ''
  })
  const [regSuccess, setRegSuccess] = useState(false)
  const [products, setProducts] = useState([])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      let warrantyData = []
      // Try warranties table first, fall back to crm_contacts
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data, error: err } = await supabase
          .from('warranties')
          .select('*')
          .order('created_at', { ascending: false })
        if (!err && data) {
          warrantyData = data
        } else {
          throw err
        }
      } catch {
        // Fallback to crm_contacts
        try {
          const contacts = await api.getCRMContacts()
          warrantyData = contacts.map(normalizeWarranty)
        } catch {
          warrantyData = []
        }
      }
      setWarranties(warrantyData.map(normalizeWarranty))

      // Try missed_calls table
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data, error: err } = await supabase
          .from('missed_calls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        if (!err && data) {
          setMissedCalls(data.map(mc => ({
            id: mc.id,
            phone: mc.phone || mc.caller_number || '',
            time: mc.created_at || mc.call_time || mc.time || new Date().toISOString(),
            duration: mc.duration || 0,
            handled: mc.handled || mc.is_handled || false
          })))
        } else {
          setMissedCalls([])
        }
      } catch {
        setMissedCalls([])
      }
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    api.getProducts().then(setProducts).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchCode.trim().toLowerCase()
    if (!q) return
    const found = warranties.find(w =>
      w.code?.toLowerCase() === q ||
      w.stickerNo?.toLowerCase() === q ||
      w.warranty_code?.toLowerCase() === q
    )
    setSearchResult(found || { notFound: true })
  }

  const handlePhoneSearch = (e) => {
    e.preventDefault()
    const cleanPhone = phoneSearch.trim()
    if (!cleanPhone) return
    const matches = warranties.filter(w =>
      w.phone && (w.phone.includes(cleanPhone) || cleanPhone.includes(w.phone.slice(-8)))
    )
    setPhoneResult(matches.length > 0 ? { found: true, matches } : { found: false })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!registerForm.name || !registerForm.phone || !registerForm.address) return

    const newWarranty = {
      code: registerForm.stickerNo || `STK-${Date.now()}`,
      product: registerForm.product || 'Unknown Product',
      customer: registerForm.name,
      phone: registerForm.phone,
      address: registerForm.address,
      purchase_date: new Date().toISOString(),
      warranty_till: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      registered_via: 'Manual',
      sticker_no: registerForm.stickerNo || `STK-${Date.now()}`,
    }

    // Try to persist to database
    try {
      // Try warranties table first
      try {
        const { supabase } = await import('../../lib/supabase')
        const { data, error: dbErr } = await supabase
          .from('warranties')
          .insert(newWarranty)
          .select()
          .single()
        if (!dbErr && data) {
          setWarranties(prev => [normalizeWarranty(data), ...prev])
          setRegSuccess(true)
          setTimeout(() => {
            setShowRegister(false)
            setRegSuccess(false)
            setRegisterForm({ name: '', phone: '', address: '', product: '', stickerNo: '' })
          }, 2000)
          return
        }
      } catch {
        // warranties table may not exist
      }

      // Fallback: save to crm_contacts
      try {
        await api.createCRMContact({
          name: registerForm.name,
          type: 'other',
          phone: registerForm.phone,
          address: registerForm.address,
          notes: registerForm.product,
          specialty: `Warranty: ${newWarranty.code}`,
        })
      } catch {
        // crm insert failed — still show locally
      }

      // Add to local state regardless
      setWarranties(prev => [{
        id: `local-${Date.now()}`,
        ...newWarranty,
        purchaseDate: newWarranty.purchase_date,
        warrantyTill: newWarranty.warranty_till,
        registeredVia: newWarranty.registered_via,
        stickerNo: newWarranty.sticker_no,
      }, ...prev])
    } catch (err) {
      console.error('Register error:', err)
    }

    setRegSuccess(true)
    setTimeout(() => {
      setShowRegister(false)
      setRegSuccess(false)
      setRegisterForm({ name: '', phone: '', address: '', product: '', stickerNo: '' })
    }, 2000)
  }

  const handleMissedCallAction = async (call) => {
    try {
      await api.updateMissedCall(call.id, { handled: true })
      setMissedCalls(prev => prev.map(c => c.id === call.id ? { ...c, handled: true } : c))
    } catch (err) {
      console.error('Failed to mark missed call handled:', err)
      toast.error('Could not mark this lead as handled')
    }
    setShowRegister(true)
    setRegisterForm(prev => ({ ...prev, phone: call.phone }))
  }

  const pendingMissedCalls = missedCalls.filter(c => !c.handled)
  const missedCallLeadsPanel = pendingMissedCalls.length > 0 && (
    <div className="card p-4 border-l-4 border-l-amber-400">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <MdPhone className="text-amber-500" size={18} />
          Missed Call Leads
          <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {pendingMissedCalls.length}
          </span>
        </h3>
      </div>
      <div className="space-y-2">
        {pendingMissedCalls.map(call => (
          <div key={call.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                <MdLocalPhone size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{call.phone}</p>
                <p className="text-[10px] text-gray-500">Missed at {formatDate(call.time, 'hh:mm a')} · Needs registration</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleMissedCallAction(call)}
                className="px-2.5 py-1.5 bg-brand-500 text-white text-[10px] font-bold rounded-md hover:bg-brand-600"
              >
                Register Now
              </button>
              <a
                href={`tel:${call.phone}`}
                className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200"
                title="Call back"
              >
                <MdCall size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Loading state
  if (loading) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MdQrCode className="text-brand-600" size={22} />
              Warranty & Customer System
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Missed call leads · Product verification · Customer database</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading warranty data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MdQrCode className="text-brand-600" size={22} />
              Warranty & Customer System
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Missed call leads · Product verification · Customer database</p>
          </div>
        </div>
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MdPending size={28} className="text-red-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Failed to load data</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary text-xs">
            <MdRefresh size={15} /> Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state — no warranties registered yet
  if (warranties.length === 0) {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MdQrCode className="text-brand-600" size={22} />
              Warranty & Customer System
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Missed call leads · Product verification · Customer database</p>
          </div>
          <button onClick={() => setShowRegister(true)} className="btn-primary text-xs">
            <MdAdd size={15} /> Register Customer
          </button>
        </div>
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MdPerson size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">No customers registered yet</p>
          <p className="text-xs text-gray-500 mb-4">Register your first customer to get started.</p>
          <button onClick={() => setShowRegister(true)} className="btn-primary text-xs">
            <MdAdd size={15} /> Register First Customer
          </button>
        </div>

        {/* Missed Call Leads */}
        {missedCallLeadsPanel}

        {/* Registration Modal */}
        {showRegister && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
                <h3 className="text-sm font-bold text-gray-900">
                  {registerForm.phone ? 'Register Missed Call Lead' : 'Register New Customer'}
                </h3>
                <button onClick={() => setShowRegister(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <MdClose size={18} />
                </button>
              </div>

              {regSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MdCheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Customer Registered!</p>
                  <p className="text-xs text-gray-500 mt-1">Warranty sticker will be assigned</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="p-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Customer Name *</label>
                    <input
                      className="input"
                      placeholder="Full name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Phone Number *</label>
                    <input
                      className="input"
                      placeholder="+8801XXXXXXXXX"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Address *</label>
                    <input
                      className="input"
                      placeholder="Full address"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Product Purchased</label>
                    <select
                      className="input"
                      value={registerForm.product}
                      onChange={(e) => setRegisterForm({ ...registerForm, product: e.target.value })}
                    >
                      <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    {products.length === 0 && (
                      <>
                        <option>Mediron Excellent Blood Glucose Meter</option>
                        <option>Mediron Prime BP Monitor (MEDI 712)</option>
                        <option>Mediron Automatic BP Monitor (MEDI 589)</option>
                        <option>Mediron Advance BP Monitor (MEDI 447)</option>
                        <option>Mediron Blood Glucose Test Strip (50 pcs)</option>
                        <option>Mediron Blood Glucose Test Strip (25 pcs)</option>
                      </>
                    )}
                  </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Sticker Number</label>
                    <input
                      className="input font-mono"
                      placeholder="STK-2024-XXXX"
                      value={registerForm.stickerNo}
                      onChange={(e) => setRegisterForm({ ...registerForm, stickerNo: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      <MdAdd size={15} /> Register
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MdQrCode className="text-brand-600" size={22} />
            Warranty & Customer System
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Missed call leads · Product verification · Customer database</p>
        </div>
        <button onClick={() => setShowRegister(true)} className="btn-primary text-xs">
          <MdAdd size={15} /> Register Customer
        </button>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: MdQrCode, label: 'QR Scan', desc: 'Scan sticker', color: 'bg-brand-50 text-brand-600' },
          { icon: MdSms, label: 'SMS', desc: 'Send code', color: 'bg-emerald-50 text-emerald-600' },
          { icon: MdPhone, label: 'Missed Call', desc: 'Auto lead', color: 'bg-amber-50 text-amber-600' },
          { icon: MdPhone, label: 'Phone Call', desc: 'Manual support', color: 'bg-blue-50 text-blue-600' },
        ].map((ch, i) => {
          const Icon = ch.icon
          return (
            <div key={i} className={`p-3 rounded-lg ${ch.color} text-center`}>
              <Icon size={20} className="mx-auto" />
              <p className="text-xs font-bold mt-1">{ch.label}</p>
              <p className="text-[10px] opacity-70">{ch.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Missed Call Leads */}
      {missedCallLeadsPanel}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'search', label: 'Verify Product', icon: MdSearch },
          { key: 'database', label: 'Customer DB', icon: MdPerson },
          { key: 'history', label: 'Purchase History', icon: MdHistory },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Verify Product */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Verify Product Warranty</h3>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Enter product code (e.g. MED-GLU-001-2024-0001)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                <MdSearch size={16} /> Verify
              </button>
            </form>
          </div>

          {searchResult && (
            <div className={`card p-5 border-l-4 ${
              searchResult.notFound ? 'border-l-red-500' :
              searchResult.status === 'active' ? 'border-l-emerald-500' : 'border-l-gray-400'
            }`}>
              {searchResult.notFound ? (
                <div className="flex items-center gap-3 text-red-600">
                  <MdPending size={20} />
                  <div>
                    <p className="text-sm font-bold">Product Not Found</p>
                    <p className="text-xs text-gray-500">This code is not in our database. May be counterfeit.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {searchResult.status === 'active' ? (
                      <MdVerified size={20} className="text-emerald-500" />
                    ) : (
                      <MdPending size={20} className="text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-gray-900">{searchResult.product}</p>
                      <p className="text-xs text-gray-500">Code: {searchResult.code}</p>
                    </div>
                    <span className={`badge ml-auto ${searchResult.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                      {searchResult.status === 'active' ? 'Genuine' : 'Expired'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Customer</p>
                      <p className="text-xs font-semibold text-gray-800">{searchResult.customer}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Phone</p>
                      <p className="text-xs font-semibold text-gray-800">{searchResult.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Sticker No</p>
                      <p className="text-xs font-semibold text-gray-800 font-mono">{searchResult.stickerNo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Warranty Till</p>
                      <p className="text-xs font-semibold text-gray-800">{formatDate(searchResult.warrantyTill)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Registered via: {searchResult.registeredVia} · Address: {searchResult.address}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Database - Phone Searchable */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Search Customer by Phone</h3>
            <form onSubmit={handlePhoneSearch} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Enter phone number..."
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary">
                <MdSearch size={16} /> Search
              </button>
            </form>
          </div>

          {phoneResult && (
            phoneResult.found ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">{phoneResult.matches.length} record(s) found</p>
                {phoneResult.matches.map(w => (
                  <div key={w.id} className="card p-4 border-l-4 border-l-brand-400">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          w.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <MdPerson size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{w.customer}</p>
                          <p className="text-xs text-gray-500">{w.phone}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1"><MdLocationOn size={11} />{w.address}</p>
                        </div>
                      </div>
                      <span className={`badge text-[9px] ${w.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                        {w.status}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Product</p>
                        <p className="text-xs font-semibold text-gray-800">{w.product}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Sticker</p>
                        <p className="text-xs font-mono font-semibold text-gray-800">{w.stickerNo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Purchased</p>
                        <p className="text-xs font-semibold text-gray-800">{formatDate(w.purchaseDate)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Warranty Till</p>
                        <p className="text-xs font-semibold text-gray-800">{formatDate(w.warrantyTill)}</p>
                      </div>
                    </div>
                    {/* Multi-platform reach */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1.5">
                      <a href={`tel:${w.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-semibold hover:bg-emerald-100">
                        <MdCall size={12} /> Call
                      </a>
                      <a href={`https://wa.me/${w.phone?.replace('+','')}`} target="_blank" className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 text-green-600 rounded-md text-[10px] font-semibold hover:bg-green-100">
                        <MdMessage size={12} /> WhatsApp
                      </a>
                      <a href={`sms:${w.phone}`} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-semibold hover:bg-blue-100">
                        <MdMessage size={12} /> SMS
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-5 text-center">
                <MdPending size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No customer found with this number</p>
                <button
                  onClick={() => { setShowRegister(true); setPhoneSearch('') }}
                  className="btn-primary text-xs mt-3"
                >
                  <MdAdd size={14} /> Register New Customer
                </button>
              </div>
            )
          )}

          {/* All customers list */}
          {!phoneResult && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">{warranties.length} registered customers</p>
              </div>
              <div className="divide-y divide-gray-50">
                {warranties.map(w => (
                  <div key={w.id} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      w.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <MdPerson size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900">{w.customer}</p>
                      <p className="text-[10px] text-gray-500 truncate">{w.product}</p>
                      <p className="text-[10px] text-gray-400">{w.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`badge text-[9px] ${w.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                        {w.status}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">Till {formatDate(w.warrantyTill)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchase History Tab */}
      {activeTab === 'history' && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Customer Purchase History</h3>
          <p className="text-xs text-gray-500 mb-4">Search phone to see full purchase + warranty history</p>
          <div className="space-y-4">
            {warranties.map(w => (
              <div key={w.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <MdPerson size={16} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{w.customer}</p>
                    <p className="text-[10px] text-gray-500">{w.phone} · {w.address}</p>
                  </div>
                </div>
                <div className="bg-white rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-800">{w.product}</p>
                    <span className={`badge text-[9px] ${w.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                      {w.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <p className="text-gray-400">Purchased</p>
                      <p className="font-semibold text-gray-700">{formatDate(w.purchaseDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Warranty</p>
                      <p className="font-semibold text-gray-700">{formatDate(w.warrantyTill)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Via</p>
                      <p className="font-semibold text-gray-700">{w.registeredVia}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-sm font-bold text-gray-900">
                {registerForm.phone ? 'Register Missed Call Lead' : 'Register New Customer'}
              </h3>
              <button onClick={() => setShowRegister(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={18} />
              </button>
            </div>

            {regSuccess ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">Customer Registered!</p>
                <p className="text-xs text-gray-500 mt-1">Warranty sticker will be assigned</p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Customer Name *</label>
                  <input
                    className="input"
                    placeholder="Full name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Phone Number *</label>
                  <input
                    className="input"
                    placeholder="+8801XXXXXXXXX"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Address *</label>
                  <input
                    className="input"
                    placeholder="Full address"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Product Purchased</label>
                  <select
                    className="input"
                    value={registerForm.product}
                    onChange={(e) => setRegisterForm({ ...registerForm, product: e.target.value })}
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    {products.length === 0 && (
                      <>
                        <option>Mediron Excellent Blood Glucose Meter</option>
                        <option>Mediron Prime BP Monitor (MEDI 712)</option>
                        <option>Mediron Automatic BP Monitor (MEDI 589)</option>
                        <option>Mediron Advance BP Monitor (MEDI 447)</option>
                        <option>Mediron Blood Glucose Test Strip (50 pcs)</option>
                        <option>Mediron Blood Glucose Test Strip (25 pcs)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Sticker Number</label>
                  <input
                    className="input font-mono"
                    placeholder="STK-2024-XXXX"
                    value={registerForm.stickerNo}
                    onChange={(e) => setRegisterForm({ ...registerForm, stickerNo: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowRegister(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    <MdAdd size={15} /> Register
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
