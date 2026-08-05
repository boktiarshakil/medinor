import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdAssignmentReturn } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Returns() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReturns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getReturns()
      setReturns(data)
    } catch (err) {
      console.error('Returns fetch failed:', err)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReturns() }, [])

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading returns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Returns</h1>
        <p className="text-sm text-gray-500">{returns.length} return requests</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Return #</th>
              <th>Dealer</th>
              <th>Reason</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id}>
                <td className="font-mono text-xs font-semibold text-brand-600">{r.return_number || r.number || r.id}</td>
                <td className="font-medium">{r.dealer?.name || r.dealer_name || '-'}</td>
                <td className="capitalize text-gray-600">{(r.reason || '').replace(/_/g, ' ')}</td>
                <td className="font-semibold">{formatCurrency(r.amount || 0)}</td>
                <td><span className={statusColor(r.status)}>{statusLabel(r.status)}</span></td>
                <td className="text-gray-500">{formatDate(r.created_at || r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {returns.length === 0 && (
        <div className="card p-12 text-center">
          <MdAssignmentReturn size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No return requests</p>
        </div>
      )}
    </div>
  )
}
