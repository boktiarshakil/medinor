import { useState, useEffect } from 'react'
import { formatCurrency, formatDate, statusColor, statusLabel } from '../lib/utils'
import { MdAdd, MdSearch, MdFilterList, MdVisibility, MdShoppingCart, MdRefresh } from 'react-icons/md'
import { supabase } from '../lib/supabase'
import { demoApi, isDemo } from '../lib/demo'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const statuses = ['all', 'draft', 'submitted', 'approved', 'packed', 'dispatched', 'delivered', 'completed']

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      // Demo mode — use mock data
      if (isDemo()) {
        const data = await demoApi.getOrders()
        setOrders(data)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          net_amount,
          created_at,
          dealers ( id, name ),
          sr:user_profiles!orders_sr_id_fkey ( id, full_name ),
          area:areas ( id, name ),
          order_items ( id )
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped = (data || []).map(order => ({
        id: order.id,
        number: order.order_number,
        dealer: order.dealers?.name || 'Unknown',
        sr: order.sr?.full_name || 'Unassigned',
        amount: order.net_amount || order.total_amount || 0,
        items: order.order_items?.length || 0,
        status: order.status,
        date: order.created_at,
        area: order.area?.name || '',
      }))

      setOrders(mapped)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filtered = orders.filter(o => {
    const matchSearch = o.number.toLowerCase().includes(search.toLowerCase()) || o.dealer.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders · {formatCurrency(orders.reduce((s, o) => s + o.amount, 0))} total value</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={fetchOrders} disabled={loading}>
            <MdRefresh size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary">
            <MdAdd size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card p-2 flex gap-1 overflow-x-auto">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {s === 'all' ? `All (${orders.length})` : `${statusLabel(s)} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by order # or dealer..."
          className="input pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="card p-6 text-center border-l-4 border-l-red-400">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button className="btn-secondary mt-3 text-xs" onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Dealer</th>
                <th>SR</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className="font-mono text-xs font-semibold text-brand-600">{order.number}</td>
                  <td className="font-medium">{order.dealer}</td>
                  <td className="text-gray-500">{order.sr}</td>
                  <td className="text-gray-500">{order.items}</td>
                  <td className="font-semibold">{formatCurrency(order.amount)}</td>
                  <td><span className={statusColor(order.status)}>{statusLabel(order.status)}</span></td>
                  <td className="text-gray-500">{formatDate(order.date)}</td>
                  <td>
                    <button className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                      <MdVisibility size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  )
}