import { useState, useEffect } from 'react'
import { formatDate, statusColor } from '../lib/utils'
import { MdCampaign, MdAdd } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getCampaigns()
      setCampaigns(data)
    } catch (err) {
      console.error('Campaigns fetch failed:', err)
      setError(err.message || 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading campaigns...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button className="btn-secondary mt-3 text-xs" onClick={fetchCampaigns}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500">Marketing campaigns and promotions</p>
        </div>
        <button className="btn-primary">
          <MdAdd size={16} /> New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map(c => (
          <div key={c.id} className="card card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <MdCampaign size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{(c.type || '').replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className={statusColor(c.status)}>{c.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Discount</span>
                <p className="font-semibold text-gray-800">{c.discount || 0}%</p>
              </div>
              <div>
                <span className="text-gray-400">Budget</span>
                <p className="font-semibold text-gray-800">৳{(c.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Period</span>
                <p className="font-semibold text-gray-800">{formatDate(c.start, 'dd MMM')} - {formatDate(c.end, 'dd MMM')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="card p-12 text-center">
          <MdCampaign size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No campaigns yet</p>
        </div>
      )}
    </div>
  )
}
