import { useState, useEffect } from 'react'
import { formatDate, statusColor } from '../lib/utils'
import { MdCampaign, MdAdd, MdClose } from 'react-icons/md'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '', type: 'discount', discount_percent: 0, budget: 0,
    start_date: '', end_date: '', description: '', status: 'draft'
  })

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

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newCampaign.name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    setCreating(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await api.createCampaign({
        name: newCampaign.name,
        type: newCampaign.type,
        discount_percent: Number(newCampaign.discount_percent) || 0,
        budget: Number(newCampaign.budget) || null,
        start_date: newCampaign.start_date || today,
        end_date: newCampaign.end_date || today,
        description: newCampaign.description || null,
        status: newCampaign.status,
      })
      toast.success('Campaign created')
      setShowCreate(false)
      setNewCampaign({ name: '', type: 'discount', discount_percent: 0, budget: 0, start_date: '', end_date: '', description: '', status: 'draft' })
      fetchCampaigns()
    } catch (err) {
      console.error('Campaign create failed:', err)
      toast.error('Failed: ' + (err.message || 'Could not create campaign'))
    } finally {
      setCreating(false)
    }
  }

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
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
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
                <p className="font-semibold text-gray-800">{c.discount_percent ?? c.discount ?? 0}%</p>
              </div>
              <div>
                <span className="text-gray-400">Budget</span>
                <p className="font-semibold text-gray-800">৳{(c.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Period</span>
                <p className="font-semibold text-gray-800">{formatDate(c.start_date || c.start, 'dd MMM')} - {formatDate(c.end_date || c.end, 'dd MMM')}</p>
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

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">New Campaign</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create a marketing campaign</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <MdClose size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" className="input" placeholder="Campaign name" value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}>
                    {['discount', 'free_product', 'bundle', 'coupon', 'gift', 'bonus'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={newCampaign.status}
                    onChange={(e) => setNewCampaign({ ...newCampaign, status: e.target.value })}>
                    {['draft', 'active', 'paused', 'completed'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Discount %</label>
                  <input type="number" min="0" max="100" className="input" value={newCampaign.discount_percent}
                    onChange={(e) => setNewCampaign({ ...newCampaign, discount_percent: e.target.value })} />
                </div>
                <div>
                  <label className="label">Budget</label>
                  <input type="number" min="0" className="input" value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Optional description"
                  value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                  {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : <><MdAdd size={15} /> Create Campaign</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
