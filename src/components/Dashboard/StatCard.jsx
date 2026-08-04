import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'

export default function StatCard({ label, value, icon: Icon, trend, trendValue, color = 'brand' }) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="stat-card card-hover">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend === 'up' ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}
