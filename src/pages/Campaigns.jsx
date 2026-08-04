import { formatDate, statusColor } from '../lib/utils'
import { MdCampaign, MdAdd } from 'react-icons/md'

const CAMPAIGNS = [
  { id: '1', name: 'New Year BP Monitor Bundle', type: 'bundle', start: '2025-01-01', end: '2025-01-31', discount: 10, budget: 50000, status: 'active' },
  { id: '2', name: 'Glucose Meter + Strikes Combo', type: 'discount', start: '2025-01-15', end: '2025-02-15', discount: 15, budget: 30000, status: 'active' },
  { id: '3', name: 'Free Gloves on 10k+ Order', type: 'free_product', start: '2025-02-01', end: '2025-02-28', discount: 0, budget: 20000, status: 'draft' },
  { id: '4', name: 'Q1 Dealer Incentive', type: 'coupon', start: '2025-01-01', end: '2025-03-31', discount: 5, budget: 100000, status: 'completed' },
]

export default function Campaigns() {
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
        {CAMPAIGNS.map(c => (
          <div key={c.id} className="card card-hover p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <MdCampaign size={20} className="text-brand-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{c.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className={statusColor(c.status)}>{c.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Discount</span>
                <p className="font-semibold text-gray-800">{c.discount}%</p>
              </div>
              <div>
                <span className="text-gray-400">Budget</span>
                <p className="font-semibold text-gray-800">৳{c.budget.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-400">Period</span>
                <p className="font-semibold text-gray-800">{formatDate(c.start, 'dd MMM')} - {formatDate(c.end, 'dd MMM')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
