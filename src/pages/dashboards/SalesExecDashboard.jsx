import { useState } from 'react'
import { formatCurrency, formatDate } from '../../lib/utils'
import { MdLocationOn, MdShoppingCart, MdReceipt, MdCheckCircle, MdMyLocation, MdRefresh } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'

const TODAY_STATS = {
  visitsDone: 3,
  visitsTotal: 8,
  orders: 2,
  collections: 1,
  targetPercent: 65,
}

const DEALERS_TODAY = [
  { id: '1', name: 'Medicine Point', distance: '0.8 km', address: 'Dhanmondi 27', status: 'completed', lastOrder: '2025-01-10', due: 5400, creditLimit: 50000 },
  { id: '2', name: 'Lazz Pharma', distance: '1.2 km', address: 'New Market', status: 'pending', lastOrder: '2025-01-08', due: 12300, creditLimit: 75000 },
  { id: '3', name: 'HealthCare Ltd', distance: '2.1 km', address: 'Elephant Road', status: 'pending', lastOrder: '2025-01-05', due: 0, creditLimit: 30000 },
  { id: '4', name: 'Central Pharmacy', distance: '2.5 km', address: 'Nilkhet', status: 'pending', lastOrder: null, due: 8750, creditLimit: 40000 },
  { id: '5', name: 'Square Hospital', distance: '3.0 km', address: 'Panthapath', status: 'not_visited', lastOrder: '2025-01-12', due: 22000, creditLimit: 100000 },
]

export default function SalesExecDashboard() {
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  const handleCheckIn = () => {
    setCheckingIn(true)
    setTimeout(() => {
      setCheckedIn(true)
      setCheckingIn(false)
    }, 1500)
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">
      {/* Today at a Glance */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Today at a Glance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-600">{TODAY_STATS.visitsDone}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Visits Done</p>
            <p className="text-[10px] text-gray-400">of {TODAY_STATS.visitsTotal}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{TODAY_STATS.orders}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Orders Taken</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{TODAY_STATS.collections}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Collections</p>
          </div>
        </div>
      </div>

      {/* Check In Button */}
      <div className="card p-5">
        {!checkedIn ? (
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="btn-primary w-full py-4 text-base relative overflow-hidden"
          >
            {checkingIn ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Getting location...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <MdMyLocation size={20} />
                Check In for Today
              </div>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3 text-emerald-600">
            <MdCheckCircle size={24} />
            <div>
              <p className="text-sm font-semibold">Checked In</p>
              <p className="text-xs text-gray-500">8:45 AM · Dhanmondi Office</p>
            </div>
          </div>
        )}
      </div>

      {/* Target Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Monthly Target</h3>
          <span className="text-lg font-bold text-brand-600">{TODAY_STATS.targetPercent}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${TODAY_STATS.targetPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>৳ 195,000 achieved</span>
          <span>৳ 300,000 target</span>
        </div>
      </div>

      {/* Today's Route */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Today's Route</h3>
          <span className="badge-info text-[10px]">{DEALERS_TODAY.length} dealers</span>
        </div>
        <div className="divide-y divide-gray-50">
          {DEALERS_TODAY.map(dealer => (
            <div key={dealer.id} className="p-4 flex items-center gap-3">
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                dealer.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                dealer.status === 'pending' ? 'bg-amber-50 text-amber-500' :
                'bg-gray-100 text-gray-400'
              }`}>
                {dealer.status === 'completed' ? <MdCheckCircle size={16} /> :
                 <MdLocationOn size={16} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{dealer.name}</p>
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                    <HiLocationMarker size={10} /> {dealer.distance}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">{dealer.address}</p>
                <div className="flex items-center gap-3 mt-1">
                  {dealer.due > 0 && (
                    <span className="text-[10px] text-red-500 font-medium">Due: {formatCurrency(dealer.due)}</span>
                  )}
                  {dealer.lastOrder && (
                    <span className="text-[10px] text-gray-400">Last: {formatDate(dealer.lastOrder)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {dealer.status !== 'completed' && (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button className="p-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100" title="New Order">
                    <MdShoppingCart size={16} />
                  </button>
                  <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Collect Payment">
                    <MdReceipt size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <MdShoppingCart size={20} className="text-brand-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">New Order</span>
        </button>
        <button className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <MdReceipt size={20} className="text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Collection</span>
        </button>
      </div>
    </div>
  )
}
