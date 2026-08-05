import { useState, useEffect } from 'react'
import { formatCurrency, statusColor, filterProductByRole, getPriceForRole, canSeePrice } from '../lib/utils'
import { MdAdd, MdSearch, MdEdit, MdDelete, MdFilterList, MdInventory2, MdLock } from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { isDemo } from '../lib/demo'

// Demo fallback
const DEMO_PRODUCTS = [
  { id: '1', name: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', category: 'Glucose Monitoring', purchase_price: 550, trade_price: 650, dealer_price: 700, mrp: 750, stock: 70, status: 'active', image: '🩸' },
  { id: '2', name: 'Mediron Blood Glucose Test Strip (25 pcs)', sku: 'MED-TST-025', category: 'Consumable', purchase_price: 220, trade_price: 280, dealer_price: 300, mrp: 350, stock: 150, status: 'active', image: '🧪' },
  { id: '3', name: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', category: 'Consumable', purchase_price: 400, trade_price: 500, dealer_price: 550, mrp: 600, stock: 20, status: 'active', image: '🧪' },
  { id: '4', name: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', category: 'Consumable', purchase_price: 120, trade_price: 160, dealer_price: 180, mrp: 200, stock: 80, status: 'active', image: '💉' },
  { id: '5', name: 'Mediron Examination Gloves (Large)', sku: 'MED-GLV-L', category: 'Disposable', purchase_price: 240, trade_price: 300, dealer_price: 320, mrp: 350, stock: 100, status: 'active', image: '🧤' },
  { id: '6', name: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', category: 'BP Monitor', purchase_price: 950, trade_price: 1200, dealer_price: 1300, mrp: 1500, stock: 45, status: 'active', image: '🩺' },
  { id: '7', name: 'Mediron Advance BP Monitor (MEDI 447)', sku: 'MED-BP-447', category: 'BP Monitor', purchase_price: 1100, trade_price: 1400, dealer_price: 1500, mrp: 1800, stock: 35, status: 'active', image: '🩺' },
  { id: '8', name: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', category: 'BP Monitor', purchase_price: 1200, trade_price: 1500, dealer_price: 1650, mrp: 2000, stock: 30, status: 'active', image: '🩺' },
]

export default function Products() {
  const { user, role } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getProducts()
      // Normalize field names for demo compatibility
      const normalized = data.map(p => ({
        ...p,
        purchase: p.purchase_price,
        trade: p.trade_price,
        dealer: p.dealer_price,
      }))
      setProducts(normalized)
    } catch (err) {
      console.error('Products fetch failed:', err)
      // Fallback to demo data
      setProducts(DEMO_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Mediron product catalog ({products.length} items)</p>
        </div>
        <button className="btn-primary">
          <MdAdd size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search products..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading products...</p>
        </div>
      ) : (
      <>
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="card card-hover overflow-hidden">
            {/* Image placeholder */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-5xl">
              {product.image}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                <span className={statusColor(product.status)}>{product.status}</span>
              </div>

              <p className="text-[10px] font-mono text-gray-400 mb-3">{product.sku}</p>

              {/* Price display based on role — PRICE ISOLATION */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                {/* MRP always visible */}
                <div>
                  <span className="text-gray-400">MRP</span>
                  <p className="font-semibold text-gray-800">{formatCurrency(product.mrp)}</p>
                </div>

                {/* Dealer price — only for dealer role and above */}
                {canSeePrice(role, 'dealer_price') && (
                  <div>
                    <span className="text-gray-400">Dealer Price</span>
                    <p className="font-semibold text-brand-600">{formatCurrency(product.dealer)}</p>
                  </div>
                )}

                {/* Trade price — for managers and SR */}
                {canSeePrice(role, 'trade_price') && (
                  <div>
                    <span className="text-gray-400">Trade Price</span>
                    <p className="font-medium text-gray-600">{formatCurrency(product.trade)}</p>
                  </div>
                )}

                {/* Purchase price — admin only */}
                {canSeePrice(role, 'purchase_price') && (
                  <div>
                    <span className="text-gray-400 flex items-center gap-0.5">Cost <MdLock size={9} /></span>
                    <p className="font-medium text-red-600">{formatCurrency(product.purchase)}</p>
                  </div>
                )}

                <div>
                  <span className="text-gray-400">Stock</span>
                  <p className={`font-semibold ${product.stock < 50 ? 'text-amber-600' : 'text-gray-800'}`}>{product.stock} pcs</p>
                </div>
              </div>

              {/* Role-based price access indicator */}
              {role === 'sales_executive' && (
                <div className="text-[9px] text-gray-400 bg-gray-50 rounded px-2 py-1 mb-2 flex items-center gap-1">
                  <MdLock size={9} /> You see trade price. Dealer price hidden.
                </div>
              )}
              {role === 'dealer' && (
                <div className="text-[9px] text-gray-400 bg-gray-50 rounded px-2 py-1 mb-2 flex items-center gap-1">
                  <MdLock size={9} /> You see your dealer price + MRP only.
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button className="btn-ghost flex-1 text-xs">
                  <MdEdit size={14} /> Edit
                </button>
                <button className="btn-ghost text-xs text-red-500 hover:bg-red-50">
                  <MdDelete size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdInventory2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      )}
      </>
      )}
    </div>
  )
}
