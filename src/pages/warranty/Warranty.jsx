import { useState } from 'react'
import { MdQrCode, MdPhone, MdSms, MdSearch, MdCheckCircle, MdPending, MdVerified, MdPerson, MdInventory } from 'react-icons/md'
import { HiOutlinePhoneMissedCall } from 'react-icons/hi'
import { formatDate } from '../../lib/utils'

const MOCK_WARRANTY = [
  { id: 1, code: 'MED-GLU-001-2024-0001', product: 'Mediron Excellent Blood Glucose Meter', customer: 'Mr. Aminul Islam', phone: '+8801711000001', purchaseDate: '2025-06-15', warrantyTill: '2026-06-15', status: 'active', registeredVia: 'SMS' },
  { id: 2, code: 'MED-BP-712-2024-0045', product: 'Mediron Prime BP Monitor (MEDI 712)', customer: 'Square Hospital', phone: '+8801711000002', purchaseDate: '2025-05-20', warrantyTill: '2027-05-20', status: 'active', registeredVia: 'QR Scan' },
  { id: 3, code: 'MED-BP-589-2024-0023', product: 'Mediron Automatic BP Monitor (MEDI 589)', customer: 'Dr. Fatima Begum', phone: '+8801711000003', purchaseDate: '2024-12-01', warrantyTill: '2026-12-01', status: 'active', registeredVia: 'Missed Call' },
  { id: 4, code: 'MED-GLU-001-2023-0099', product: 'Mediron Excellent Blood Glucose Meter', customer: 'Labaid Diagnostic', phone: '+8801711000004', purchaseDate: '2024-01-10', warrantyTill: '2025-01-10', status: 'expired', registeredVia: 'Phone Call' },
  { id: 5, code: 'MED-TST-050-2024-0078', product: 'Mediron Blood Glucose Test Strip (50 pcs)', customer: 'Central Pharmacy', phone: '+8801711000005', purchaseDate: '2025-07-01', warrantyTill: '2026-01-01', status: 'active', registeredVia: 'SMS' },
]

export default function Warranty() {
  const [searchCode, setSearchCode] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [activeTab, setActiveTab] = useState('search')

  const handleSearch = (e) => {
    e.preventDefault()
    const found = MOCK_WARRANTY.find(w => w.code.toLowerCase() === searchCode.toLowerCase())
    setSearchResult(found || { notFound: true })
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MdQrCode className="text-brand-600" size={22} />
          Warranty & Product Verification
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">QR code, SMS, missed call, phone call support</p>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: MdQrCode, label: 'QR Scan', desc: 'Scan sticker', color: 'bg-brand-50 text-brand-600' },
          { icon: MdSms, label: 'SMS', desc: 'Send code', color: 'bg-emerald-50 text-emerald-600' },
          { icon: HiOutlinePhoneMissedCall, label: 'Missed Call', desc: 'Auto register', color: 'bg-amber-50 text-amber-600' },
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'search', label: 'Verify Product', icon: MdSearch },
          { key: 'database', label: 'Customer Database', icon: MdPerson },
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

      {/* Search / Verify */}
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

          {/* Search Result */}
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
                      <p className="text-[10px] text-gray-400 uppercase">Purchase Date</p>
                      <p className="text-xs font-semibold text-gray-800">{formatDate(searchResult.purchaseDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Warranty Till</p>
                      <p className="text-xs font-semibold text-gray-800">{formatDate(searchResult.warrantyTill)}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">Registered via: {searchResult.registeredVia}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Database */}
      {activeTab === 'database' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs text-gray-500">{MOCK_WARRANTY.length} registered customers</p>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_WARRANTY.map(w => (
              <div key={w.id} className="p-4 flex items-center gap-3">
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
  )
}
