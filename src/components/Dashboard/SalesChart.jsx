import Chart from 'react-apexcharts'

const MOCK_DATA = {
  series: [{
    name: 'Sales',
    data: [42000, 38000, 55000, 49000, 63000, 58000, 72000, 68000, 85000, 79000, 92000, 88000]
  }],
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
}

export default function SalesChart({ series = MOCK_DATA.series, categories = MOCK_DATA.categories }) {
  const options = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      fontFamily: 'Inter, sans-serif',
    },
    series,
    xaxis: { categories },
    colors: ['#188038'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val) => `৳${val.toLocaleString()}` }
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: '11px', colors: '#94a3b8' } }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#94a3b8' },
        formatter: (val) => `${(val / 1000).toFixed(0)}K`
      }
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly revenue trend</p>
        </div>
        <div className="flex gap-1">
          <button className="px-3 py-1 text-[10px] font-semibold bg-brand-50 text-brand-600 rounded-md">12M</button>
          <button className="px-3 py-1 text-[10px] font-semibold text-gray-400 hover:bg-gray-50 rounded-md">6M</button>
          <button className="px-3 py-1 text-[10px] font-semibold text-gray-400 hover:bg-gray-50 rounded-md">30D</button>
        </div>
      </div>
      <Chart options={options} series={series} type="area" height={260} />
    </div>
  )
}
