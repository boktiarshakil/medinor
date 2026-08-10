import { useState, useEffect, useRef } from 'react'
import { formatCurrency, getPriceForRole, canSeePrice } from '../lib/utils'
import {
  MdAdd, MdRemove, MdShoppingCart, MdCheckCircle, MdWarning,
  MdErrorOutline, MdInfo, MdSend, MdLocalShipping, MdAccessTime
} from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

// Stock status helper — null/undefined means no inventory record (assume available)
const getStockStatus = (stock) => {
  if (stock === null || stock === undefined) return { label: 'In Stock — ship in 1-2 days', color: 'text-emerald-600 bg-emerald-50', badge: 'badge-success', icon: MdCheckCircle }
  if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50', badge: 'badge-danger', icon: MdErrorOutline }
  if (stock <= 10) return { label: `Only ${stock} left — ${Math.ceil(stock / 5)} days wait`, color: 'text-amber-600 bg-amber-50', badge: 'badge-warning', icon: MdWarning }
  if (stock <= 25) return { label: `Low Stock — ship in 3-5 days`, color: 'text-amber-600 bg-amber-50', badge: 'badge-warning', icon: MdWarning }
  return { label: `In Stock — ship in 1-2 days`, color: 'text-emerald-600 bg-emerald-50', badge: 'badge-success', icon: MdCheckCircle }
}

export default function PlaceOrder() {
  const { user, role } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cart, setCart] = useState({})
  const [dealers, setDealers] = useState([])
  const [selectedDealerId, setSelectedDealerId] = useState('')
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const cartRef = useRef(null)
  const [cartHeight, setCartHeight] = useState(0)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getProductsWithStock()
      setProducts(data)
      if (role === 'dealer' || role === 'sales_executive') {
        setDealers(await api.getDealers().catch(() => []))
      }
    } catch (err) {
      console.error('Products fetch failed:', err)
      setError(err.message || 'Failed to load products')
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const getPrice = (product) => {
    if (!role) return product.mrp
    return getPriceForRole(product, role) || product.mrp
  }

  const addToCart = (id) => {
    const product = products.find(p => p.id === id)
    if (!product || product.stock === 0) return
    const currentQty = cart[id] || 0
    // Block if we already have all known stock. null/undefined stock = no inventory record → allow up to a sane limit.
    if (product.stock !== null && product.stock !== undefined && currentQty >= product.stock) return
    if (currentQty >= 999) return
    setCart(prev => ({ ...prev, [id]: currentQty + 1 }))
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[id] > 1) newCart[id]--
      else delete newCart[id]
      return newCart
    })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const product = products.find(p => p.id === id)
    if (!product) return null
    return { ...product, qty, total: getPrice(product) * qty, stockStatus: getStockStatus(product.stock) }
  }).filter(Boolean)

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0)
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  useEffect(() => {
    if (!cartRef.current) return
    const el = cartRef.current
    const measure = () => setCartHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [cartCount > 0])

  const stockIssues = cartItems.filter(item => {
    const status = getStockStatus(item.stock)
    return status.label !== 'In Stock — ship in 1-2 days'
  })

  const hasStockOut = cartItems.some(item => item.stock === 0)

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  const handlePlaceOrder = async () => {
    try {
      const dealerRecord = role === 'dealer'
        ? dealers.find(
            d => d.email && d.email.toLowerCase() === String(user.email || '').toLowerCase()
          )
        : dealers.find(d => d.id === selectedDealerId)

      if (role === 'dealer' && !dealerRecord) {
        toast.error('Your login is not linked to a dealer record. Contact admin.')
        return
      }
      if (role !== 'dealer' && !selectedDealerId) {
        toast.error('Select a dealer to order for')
        return
      }

      const orderData = {
        dealer_id: dealerRecord ? dealerRecord.id : null,
        sr_id: role === 'dealer' ? null : user.id,
        area_id: dealerRecord?.area_id || user.area_id || null,
        status: 'submitted',
        total_amount: cartTotal,
        net_amount: cartTotal,
      }
      const items = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.qty,
        unit_price: getPrice(item),
        total_price: getPrice(item) * item.qty,
      }))
      await api.createOrder(orderData, items)
      setOrderPlaced(true)
      setTimeout(() => {
        setOrderPlaced(false)
        setShowConfirm(false)
        setCart({})
      }, 3000)
    } catch (err) {
      console.error('Order placement failed:', err)
      toast.error('Failed to place order')
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-l-4 border-l-red-400">
        <p className="text-sm text-red-600 font-medium">{error}</p>
        <button className="btn-secondary mt-3 text-xs" onClick={fetchProducts}>Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Place Order</h1>
          <p className="text-sm text-gray-500">Check stock availability before ordering</p>
        </div>
        {cartCount > 0 && (
          <div className="relative">
            <MdShoppingCart size={24} className="text-brand-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>
        )}
      </div>

      {/* SR: select dealer to order for */}
      {role === 'sales_executive' && (
        <div className="card p-4">
          <label className="label">Ordering for Dealer *</label>
          <select
            className="input"
            value={selectedDealerId}
            onChange={(e) => setSelectedDealerId(e.target.value)}
          >
            <option value="">Select dealer...</option>
            {dealers.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.area?.name || d.area_name || d.area || 'Unassigned'}</option>
            ))}
          </select>
          <p className="text-[10px] text-gray-400 mt-1">Order will be attributed to this dealer and recorded against you.</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search products by name or category..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stock Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-semibold">
        <span className="flex items-center gap-1 text-emerald-600"><MdCheckCircle size={12} /> In Stock</span>
        <span className="flex items-center gap-1 text-amber-600"><MdWarning size={12} /> Low Stock</span>
        <span className="flex items-center gap-1 text-red-600"><MdErrorOutline size={12} /> Out of Stock</span>
        <span className="flex items-center gap-1 text-gray-500"><MdAccessTime size={12} /> Wait time shown for low stock</span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => {
          const status = getStockStatus(product.stock)
          const StatusIcon = status.icon
          const inCart = cart[product.id] || 0
          const atMaxStock = product.stock !== null && inCart >= product.stock

          return (
            <div key={product.id} className={`card p-4 flex flex-col ${product.stock === 0 ? 'opacity-70' : ''}`}>
              <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-3 relative">
                {product.image || product.image_url ? (
                  <>
                    <span className="text-4xl">📦</span>
                    <img
                      src={product.image || product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover absolute inset-0"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  </>
                ) : (
                  <span className="text-4xl">📦</span>
                )}
                <span className={`absolute top-2 right-2 ${status.badge} text-[9px] px-1.5 py-0.5 rounded-full`}>
                  {product.stock === 0 ? 'Out' : product.stock === null ? 'In stock' : `${product.stock} units`}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-xs text-gray-400 mb-1.5">{product.sku}</p>

              <div className={`flex items-center gap-1.5 p-1.5 rounded-md mb-2 ${status.color}`}>
                <StatusIcon size={13} />
                <span className="text-[10px] font-semibold">{status.label}</span>
              </div>

              <p className="text-lg font-bold text-brand-600 mb-3">{formatCurrency(getPrice(product))}</p>

              {inCart > 0 ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(product.id)} className="btn-secondary p-2" disabled={product.stock === 0}>
                    <MdRemove size={16} />
                  </button>
                  <span className="flex-1 text-center font-bold text-lg">{inCart}</span>
                  <button onClick={() => addToCart(product.id)} className="btn-secondary p-2" disabled={atMaxStock || product.stock === 0}>
                    <MdAdd size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock === 0}
                  className="btn-primary w-full mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {product.stock === 0 ? 'Out of Stock' : <><MdAdd size={16} /> Add to Cart</>}
                </button>
              )}

              {atMaxStock && product.stock !== null && product.stock > 0 && (
                <p className="text-[10px] text-amber-600 font-semibold mt-1 text-center">Max stock reached</p>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <MdShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      )}

      {/* Spacer so the fixed cart never covers the product grid */}
      <div style={{ height: cartCount > 0 ? cartHeight + 96 : 0 }} aria-hidden="true" />

      {/* Cart Summary */}
      {cartCount > 0 && (
        <div ref={cartRef} className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 card p-5 shadow-xl z-40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Cart ({cartCount} items)</h3>
            <span className="text-lg font-bold text-brand-600">{formatCurrency(cartTotal)}</span>
          </div>

          {stockIssues.length > 0 && (
            <div className="mb-3 p-2 bg-amber-50 rounded-md border border-amber-100">
              <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mb-1">
                <MdWarning size={12} /> Stock Notice
              </p>
              <div className="max-h-24 overflow-y-auto">
                {stockIssues.map(item => (
                  <p key={item.id} className="text-[10px] text-amber-600">
                    • {item.name}: {getStockStatus(item.stock).label}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex-1 truncate">
                  <span className="text-gray-700">{item.name}</span>
                  <span className={`ml-1.5 text-[9px] ${item.stock <= 10 && item.stock > 0 ? 'text-amber-600' : item.stock === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ({item.stock <= 10 && item.stock > 0 ? 'low' : item.stock === 0 ? 'out' : '✓'})
                  </span>
                </div>
                <span className="text-gray-500 mx-2">×{item.qty}</span>
                <span className="font-semibold">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={hasStockOut}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdLocalShipping size={15} /> Proceed to Confirm
          </button>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {orderPlaced ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">Order Placed!</p>
                <p className="text-xs text-gray-500 mt-1">You can track it in Order Tracker</p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Confirm Order</h3>
                  <p className="text-xs text-gray-500">Review stock status before confirming</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Stock Status</p>
                    {cartItems.map(item => {
                      const status = getStockStatus(item.stock)
                      const StatusIcon = status.icon
                      return (
                        <div key={item.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <StatusIcon size={13} className={status.color.split(' ')[0]} />
                            <span className="text-xs text-gray-700 truncate">{item.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">×{item.qty}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="p-3 bg-brand-50 rounded-lg flex items-center gap-2">
                    <MdLocalShipping size={16} className="text-brand-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-brand-800">
                        Estimated Delivery: {stockIssues.length > 0 ? '5-7 business days' : '1-2 business days'}
                      </p>
                      <p className="text-[10px] text-brand-600">
                        {stockIssues.length > 0
                          ? 'Some items have low stock — slight delay expected'
                          : 'All items in stock — fast dispatch'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-lg font-bold text-brand-700">{formatCurrency(cartTotal)}</span>
                  </div>

                  {stockIssues.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <MdInfo size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700">
                        Some items have low stock. Order will be fulfilled as items become available.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Back</button>
                    <button onClick={handlePlaceOrder} className="btn-primary flex-1">
                      <MdSend size={15} /> Confirm Order
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
