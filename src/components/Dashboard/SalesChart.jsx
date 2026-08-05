import { useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import { api } from '../../lib/api'
import { startOfMonth, format, subMonths } from 'date-fns'

export default function SalesChart() {
  const [seriesData, setSeriesData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const orders = await api.getOrders()
        // Group by month for last 12 months
        const monthlyTotals = {}
        for (let i = 11; i >= 0; i--) {
          const m = startOfMonth(subMonths(new Date(), i))
          monthlyTotals[format(m, 'MMM')] = 0
        }
        orders.forEach(o => {
          if (o.created_at && o.status !== 'cancelled') {
            const m = format(startOfMonth(new Date(o.created_at)), 'MMM')
            if (m in monthlyTotals) {
              monthlyTotals[m] += (o.total_amount || o.amount || 0)
            }
          }
        })
        const categories = Object.keys(monthlyTotals)
        const data = Object.values(monthlyTotals)
        setSeriesData([{ name: 'Sales', data }])
        setCategories(categories)
      } catch (err) {
        console.error('SalesChart fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [])

  const [categories, setCategories] = useState([])

  if (loading) {
    return (
      <div className="card p-5 flex items-center justify-center h-[320px]">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!seriesData) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
        <p className="text-xs text-gray-500 mt-4">Unable to load chart data</p>
      </div>
    )
  }

  const options = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      sparkline: { enabled: false },
      fontFamily: 'Inter, sans-serif',
    },
    series: seriesData,
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
      </div>
      <Chart options={options} series={seriesData} type="area" height={260} />
    </div>
  )
}
