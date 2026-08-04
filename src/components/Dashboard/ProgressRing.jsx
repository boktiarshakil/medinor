export default function ProgressRing({ percent, size = 80, stroke = 8, color = '#188038', label }) {
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference

  const getColor = () => {
    if (percent >= 80) return '#22c55e'
    if (percent >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color === 'auto' ? getColor() : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-sm font-bold text-gray-800">{percent}%</span>
      </span>
      {label && <span className="text-[10px] text-gray-500 font-medium mt-1">{label}</span>}
    </div>
  )
}
