import { useState, useEffect } from 'react'
import {
  MdLocalShipping, MdRefresh, MdCheckCircle, MdErrorOutline,
  MdSearch, MdAccountBalance, MdReceipt, MdAssignmentReturn,
} from 'react-icons/md'
import { formatCurrency } from '../lib/utils'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

// Restored from the old site: the Packzy delivery-partner dashboard.
// Talks to the Supabase "packzy" edge function (server-side API key);
// the frontend never sees courier credentials.
const listFrom = (res, keys) => {
  if (Array.isArray(res)) return res
  const d = res?.data ?? res ?? {}
  if (Array.isArray(d)) return d
  for (const k of keys) {
    if (Array.isArray(d[k])) return d[k]
  }
  return []
}

const pickData = (res) => (res && typeof res === 'object' ? (res.data ?? res) : {})

export default function Courier() {
  const [conn, setConn] = useState('checking')
  const [balance, setBalance] = useState(null)
  const [payouts, setPayouts] = useState([])
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [returns, setReturns] = useState([])
  const [fraudPhone, setFraudPhone] = useState('')
  const [fraud, setFraud] = useState(null)
  const [fraudLoading, setFraudLoading] = useState(false)

  const checkPing = async () => {
    try {
      const res = await api.packzy('ping')
      setConn(res != null && res.ok ? 'ok' : 'down')
    } catch (err) {
      setConn('down')
      toast.error(err.message || 'Courier unreachable')
    }
  }

  const loadBalance = async () => {
    setBalanceLoading(true)
    try {
      const res = await api.packzy('balance')
      const d = pickData(res)
      const value = d.balance ?? d.current_balance ?? d.amount ?? (typeof d === 'number' ? d : null)
      setBalance(value)
      setPayouts(listFrom(res, ['payouts', 'recent_payouts']))
    } catch (err) {
      toast.error(err.message || 'Failed to load balance')
    } finally {
      setBalanceLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const res = await api.packzy('payments')
      setPayments(listFrom(res, ['payments']).slice(0, 10))
    } catch {
      // Payments section stays empty; balance + fraud check still work
    }
  }

  const loadReturns = async () => {
    try {
      const res = await api.packzy('get_return_requests')
      setReturns(listFrom(res, ['return_requests', 'returns']).slice(0, 10))
    } catch {
      // Returns section stays empty
    }
  }

  const refreshAll = () => {
    checkPing()
    loadBalance()
  }

  useEffect(() => {
    checkPing()
    loadBalance()
    loadPayments()
    loadReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runFraudCheck = async () => {
    if (!fraudPhone.trim()) return toast.error('Enter a phone number')
    setFraudLoading(true)
    try {
      const res = await api.packzy('fraud_check', { phone: fraudPhone.trim() })
      setFraud(pickData(res))
    } catch (err) {
      toast.error(err.message || 'Failed to run fraud check')
    } finally {
      setFraudLoading(false)
    }
  }

  const fraudStats = fraud ? [
    ['Total Parcels', fraud.total_parcels ?? fraud.total],
    ['Delivered', fraud.total_delivered ?? fraud.delivered],
    ['Cancelled/Returned', fraud.total_cancelled ?? fraud.cancelled ?? fraud.total_return],
    ['Success Rate', fraud.success_rate != null ? `${fraud.success_rate}%` : undefined],
  ] : []

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Courier</h1>
          <p className="text-sm text-gray-500 mt-1">Packzy delivery partner — balance, lookups and payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          {conn === 'ok' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 ring-1 ring-emerald-100 rounded-lg px-3 py-2">
              <MdCheckCircle size={14} /> Connected
            </span>
          )}
          {conn === 'down' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 ring-1 ring-red-100 rounded-lg px-3 py-2">
              <MdErrorOutline size={14} /> Unreachable
            </span>
          )}
          <button className="btn-secondary" onClick={refreshAll} disabled={balanceLoading}>
            <MdRefresh size={16} className={balanceLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Balance */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdAccountBalance size={16} className="text-brand-500" /> Current Balance
          </h3>
          {balanceLoading ? (
            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          ) : (
            <div>
              <p className="text-3xl font-bold text-gray-900">{balance != null ? formatCurrency(balance) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">What the courier currently owes you.</p>
              {payouts.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <MdReceipt size={12} /> Recent Payouts
                  </p>
                  <div className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                    {payouts.map((p, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-xs">
                        <span className="text-gray-500">{p.date || p.created_at || `#${p.id || i + 1}`}</span>
                        <span className="font-semibold text-gray-800">{formatCurrency(p.amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fraud check */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdSearch size={16} className="text-brand-500" /> Customer Fraud Check
          </h3>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="01XXXXXXXXX"
              value={fraudPhone}
              onChange={(e) => setFraudPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runFraudCheck()}
            />
            <button className="btn-primary" onClick={runFraudCheck} disabled={fraudLoading}>
              {fraudLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><MdSearch size={15} /> Check</>
              )}
            </button>
          </div>
          {fraud && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {fraudStats.map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MdReceipt size={16} className="text-brand-500" /> Recent Payments
        </h3>
        {payments.length === 0 ? (
          <p className="text-xs text-gray-400">No payments returned by the courier.</p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {payments.map((p, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{p.date || p.created_at || `#${p.id || i + 1}`}</span>
                <span className="text-gray-600">{p.status || p.delivery_status || ''}</span>
                <span className="font-semibold text-gray-800">{formatCurrency(p.amount || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return requests */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MdAssignmentReturn size={16} className="text-brand-500" /> Return Requests
        </h3>
        {returns.length === 0 ? (
          <p className="text-xs text-gray-400">No return requests returned by the courier.</p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {returns.map((r, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <span className="text-gray-700">CN {r.consignment_id || r.invoice || r.id || i + 1}</span>
                <span className="text-gray-600">{r.status || r.delivery_status || ''}</span>
                <span className="text-gray-400">{r.date || r.created_at || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400 flex items-center gap-1">
        <MdLocalShipping size={12} /> Bookings from Orders and COD Requests save the consignment, tracking code and status back to the order.
      </p>
    </div>
  )
}
