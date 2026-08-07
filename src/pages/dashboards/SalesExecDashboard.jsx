import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, todayRange, thisMonthRange } from '../../lib/utils'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { MdLocationOn, MdShoppingCart, MdReceipt, MdCheckCircle, MdMyLocation, MdRefresh } from 'react-icons/md'
import { HiLocationMarker } from 'react-icons/hi'

export default function SalesExecDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [ordersData, dealersData] = await Promise.all([
          api.getOrders().catch(() => []),
          api.getDealers().catch(() => []),
        ])
        setOrders(ordersData)
        setDealers(dealersData)
        if (user?.id) {
          api.getTodayAttendance(user.id)
            .then(att => { if (att?.check_in) setCheckedIn(true) })
            .catch(() => {})
        }
      } catch (err) {
        console.error('SalesExec dashboard fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user?.id])

  const { start: todayStart, end: todayEnd } = todayRange()
  const { start: monthStart, end: monthEnd } = thisMonthRange()
  const todayStartISO = todayStart.toISOString()
  const todayEndISO = todayEnd.toISOString()
  const monthStartISO = monthStart.toISOString()

  // Filter orders for current SR
  const myOrders = orders.filter(o => o.sr_id === user?.id || o.created_by === user?.id)
  const todayOrders = myOrders.filter(o => o.created_at >= todayStartISO && o.created_at <= todayEndISO && o.status !== 'cancelled')
  const monthOrders = myOrders.filter(o => o.created_at >= monthStartISO && o.status !== 'cancelled')

  const visitsDone = todayOrders.length
  const ordersTaken = todayOrders.length
  const collections = todayOrders.filter(o => o.status === 'paid' || o.payment_collected).reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const monthTarget = 300000 // Default target
  const monthAchieved = monthOrders.reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)
  const targetPercent = Math.min(Math.round((monthAchieved / monthTarget) * 100), 100)

  const handleCheckIn = () => {
    setCheckingIn(true)
    const persist = (lat = null, lng = null) => {
      api.checkIn(user.id, { lat, lng })
        .then(() => { setCheckedIn(true) })
        .catch(err => {
          console.error('Check-in failed:', err)
          setCheckedIn(true)
        })
        .finally(() => setCheckingIn(false))
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => persist(pos.coords.latitude, pos.coords.longitude),
        () => persist(),
        { timeout: 8000 }
      )
    } else {
      persist()
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto lg:max-w-none">
      {/* Today at a Glance */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Today at a Glance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-brand-600">{visitsDone}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Visits Done</p>
            <p className="text-[10px] text-gray-400">of {dealers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">{ordersTaken}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">Orders Taken</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{collections}</p>
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
              <p className="text-xs text-gray-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        )}
      </div>

      {/* Target Progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Monthly Target</h3>
          <span className="text-lg font-bold text-brand-600">{targetPercent}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${targetPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400">
          <span>{formatCurrency(monthAchieved)} achieved</span>
          <span>{formatCurrency(monthTarget)} target</span>
        </div>
      </div>

      {/* Assigned Dealers */}
      <div className="card">
        <div className="p-5 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">My Dealers</h3>
          <span className="badge-info text-[10px]">{dealers.length} dealers</span>
        </div>
        {dealers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-500">No dealers assigned</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dealers.slice(0, 10).map(dealer => {
              const dealerOrders = orders.filter(o => o.dealer_id === dealer.id || o.dealer?.name === dealer.name)
              const lastOrder = dealerOrders[0]
              const due = dealerOrders
                .filter(o => o.status !== 'paid' && o.status !== 'delivered' && o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.total_amount || o.amount || 0), 0)

              return (
                <div key={dealer.id} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-400">
                    <MdLocationOn size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{dealer.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{dealer.address || dealer.area?.name || dealer.area_name || ''}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {due > 0 && (
                        <span className="text-[10px] text-red-500 font-medium">Due: {formatCurrency(due)}</span>
                      )}
                      {lastOrder?.created_at && (
                        <span className="text-[10px] text-gray-400">Last: {formatDate(lastOrder.created_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/place-order" className="card p-4 flex flex-col items-center gap-2 card-hover">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <MdShoppingCart size={20} className="text-brand-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">New Order</span>
        </a>
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
