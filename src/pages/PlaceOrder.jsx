import { useState } from 'react'
import { formatCurrency } from '../lib/utils'
import { MdAdd, MdRemove, MdShoppingCart } from 'react-icons/md'

const PRODUCTS = [
  { id: '1', name: 'Mediron Excellent Blood Glucose Meter', sku: 'MED-GLU-001', dealerPrice: 700, stock: 70, image: '🩸' },
  { id: '2', name: 'Mediron Blood Glucose Test Strip (50 pcs)', sku: 'MED-TST-050', dealerPrice: 550, stock: 20, image: '🧪' },
  { id: '3', name: 'Mediron Blood Lancets Twist Type 31G (100 pcs)', sku: 'MED-LAN-100', dealerPrice: 180, stock: 80, image: '💉' },
  { id: '4', name: 'Mediron Examination Gloves (Large)', sku: 'MED-GLV-L', dealerPrice: 320, stock: 100, image: '🧤' },
  { id: '5', name: 'Mediron Automatic BP Monitor (MEDI 589)', sku: 'MED-BP-589', dealerPrice: 1300, stock: 45, image: '🩺' },
  { id: '6', name: 'Mediron Advance BP Monitor (MEDI 447)', sku: 'MED-BP-447', dealerPrice: 1500, stock: 35, image: '🩺' },
  { id: '7', name: 'Mediron Prime BP Monitor (MEDI 712)', sku: 'MED-BP-712', dealerPrice: 1650, stock: 30, image: '🩺' },
]

export default function PlaceOrder() {
  const [cart, setCart] = useState({})
  const [search, setSearch] = useState('')

  const addToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[id] > 1) newCart[id]--
      else delete newCart[id]
      return newCart
    })
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    ...PRODUCTS.find(p => p.id === id),
    qty,
    total: PRODUCTS.find(p => p.id === id).dealerPrice * qty
  }))

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0)
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Place Order</h1>
          <p className="text-sm text-gray-500">Select products to order</p>
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

      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="card p-4 flex flex-col">
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-4xl mb-3">
              {product.image}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{product.sku} · Stock: {product.stock}</p>
            <p className="text-lg font-bold text-brand-600 mb-3">{formatCurrency(product.dealerPrice)}</p>

            {cart[product.id] ? (
              <div className="flex items-center gap-2">
                <button onClick={() => removeFromCart(product.id)} className="btn-secondary p-2">
                  <MdRemove size={16} />
                </button>
                <span className="flex-1 text-center font-bold text-lg">{cart[product.id]}</span>
                <button onClick={() => addToCart(product.id)} className="btn-secondary p-2">
                  <MdAdd size={16} />
                </button>
              </div>
            ) : (
              <button onClick={() => addToCart(product.id)} className="btn-primary w-full mt-auto">
                <MdAdd size={16} /> Add to Cart
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 card p-5 shadow-xl z-40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Cart ({cartCount} items)</h3>
            <span className="text-lg font-bold text-brand-600">{formatCurrency(cartTotal)}</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-700 flex-1 truncate">{item.name}</span>
                <span className="text-gray-500 mx-2">×{item.qty}</span>
                <span className="font-semibold">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full">Submit Order</button>
        </div>
      )}
    </div>
  )
}
