import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import toast from 'react-hot-toast'
import {
  MdSearch, MdShield, MdVerified, MdLocalShipping, MdPhone, MdEmail, MdArrowForward,
  MdAdd, MdRemove, MdCheckCircle, MdShoppingCart, MdCall, MdVisibility, MdFlag,
  MdClose, MdChevronLeft, MdChevronRight, MdDownload
} from 'react-icons/md'

const BRAND = '#ff551f'

const CATEGORY_LABELS = {
  'General': 'Medical Devices',
  'glucose': 'Blood Glucose',
  'bp': 'Blood Pressure',
  'lancet': 'Lancets & Accessories',
}

const MANAGEMENT = [
  { name: 'Ahsan Abdullah', role: 'Chairman', initials: 'AA' },
  { name: 'Monoauar Hossain Moinul', role: 'Managing Director', initials: 'MM' },
  { name: 'Michael Chowdhury', role: 'Executive Director', initials: 'MC' },
  { name: 'Md Saidur Rahman', role: 'Operations Director', initials: 'SR' },
  { name: 'Ikramul Islam Chowdhury', role: 'Director Admin', initials: 'IC' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [selectedImg, setSelectedImg] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checkout, setCheckout] = useState({ name: '', phone: '', address: '', notes: '' })
  const [certIndex, setCertIndex] = useState(null)

  useEffect(() => {
    api.getProducts()
      .then(data => setProducts((data || []).filter(p => p.status === 'active')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const addToCart = (id) => {
    const product = products.find(p => p.id === id)
    if (!product) return
    const currentQty = cart[id] || 0
    if (currentQty >= 99) return
    setCart(prev => ({ ...prev, [id]: currentQty + 1 }))
  }

  const removeFromCart = (id) => {
    setCart(prev => {
      const next = { ...prev }
      if (next[id] > 1) next[id] -= 1
      else delete next[id]
      return next
    })
  }

  const cartEntries = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find(p => p.id === id)
      if (!product) return null
      return {
        id, qty, product,
        unit_price: Number(product.mrp) || 0,
        total: (Number(product.mrp) || 0) * qty,
      }
    })
    .filter(Boolean)
  const cartTotal = cartEntries.reduce((sum, item) => sum + item.total, 0)
  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  const handleSubmitCod = async () => {
    if (!checkout.name.trim()) {
      toast.error('Enter your full name')
      return
    }
    const phoneClean = checkout.phone.replace(/\s+/g, '')
    if (!/^(?:\+?\d{10,15})$/.test(phoneClean)) {
      toast.error('Enter a valid phone number')
      return
    }
    setSubmitting(true)
    try {
      await api.createCodOrder({
        customer_name: checkout.name.trim(),
        phone: phoneClean,
        address: checkout.address.trim() || null,
        notes: checkout.notes.trim() || null,
        items: cartEntries.map(it => ({
          product_id: it.id,
          name: it.product.name,
          quantity: it.qty,
          unit_price: it.unit_price,
        })),
        total_amount: cartTotal,
      })
      setOrderPlaced(true)
      setCart({})
    } catch (err) {
      console.error('COD order failed:', err)
      toast.error(err.message || 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  const categories = ['all', ...new Set(products.map(p => p.category))]
  const filtered = products.filter(p => {
    const matchSearch = !search || (p.name || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || p.category === category
    return matchSearch && matchCat
  })

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-logo text-lg leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <div>
              <span className="font-brandname text-sm font-bold text-gray-900 uppercase tracking-wide">MMS Prime</span>
              <span className="block text-[10px] text-gray-400 -mt-0.5">Delivering Value Every Day</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
            <button onClick={() => scrollTo('home')} className="hover:text-brand-500">Home</button>
            <button onClick={() => scrollTo('products')} className="hover:text-brand-500">Products</button>
            <button onClick={() => scrollTo('about')} className="hover:text-brand-500">About</button>
            <button onClick={() => scrollTo('management')} className="hover:text-brand-500">Team</button>
            <button onClick={() => navigate('/company-profile')} className="hover:text-brand-500">Company Profile</button>
            <button onClick={() => scrollTo('contact')} className="hover:text-brand-500">Contact</button>
          </nav>
          {user ? (
            <button className="btn-primary text-sm" onClick={() => navigate('/dashboard')}>
              Dashboard <MdArrowForward size={15} />
            </button>
          ) : (
            <button className="btn-primary text-sm" onClick={() => navigate('/login')}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative bg-brand-500 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-6 shadow-xl shadow-brand-900/20">
            <span className="font-logo text-5xl leading-none text-brand-500 select-none tracking-[-0.09em]">mms.</span>
          </div>
          <h1 className="font-brandname text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">MMS Prime</h1>
          <p className="font-tagline text-xl md:text-2xl text-white italic mt-3 uppercase">Delivering Value Every Day</p>
          <p className="max-w-2xl mx-auto text-white/85 mt-5 text-sm md:text-base leading-relaxed">
            A trusted multi-category distribution company bringing quality products to businesses
            and families — backed by reliable supply, fair pricing, and service you can count on.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <button
              className="bg-white text-brand-600 font-semibold rounded-xl px-7 py-3 text-sm hover:opacity-95 transition-opacity shadow-lg flex items-center gap-2"
              onClick={() => scrollTo('products')}
            >
              Explore Our Products
            </button>
            {!user && (
              <button
                className="bg-brand-600/40 hover:bg-brand-600/50 border border-white/30 text-white font-semibold rounded-xl px-7 py-3 text-sm transition-colors"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white/10" />
      </section>

      {/* Features strip */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0"><MdShield size={20} className="text-brand-500" /></div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Genuine Products</h3>
            <p className="text-xs text-gray-500 mt-0.5">Authentic, quality-assured stock from trusted manufacturers.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0"><MdVerified size={20} className="text-brand-500" /></div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Fair Pricing</h3>
            <p className="text-xs text-gray-500 mt-0.5">Competitive trade, dealer and retail price structures.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0"><MdLocalShipping size={20} className="text-brand-500" /></div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Reliable Supply</h3>
            <p className="text-xs text-gray-500 mt-0.5">Dependable distribution network across the region.</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-surface-50 border-t border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Our Products</h2>
            <p className="text-sm text-gray-500 mt-2">Browse our full catalog</p>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input sm:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : (CATEGORY_LABELS[c] || c)}</option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="card p-12 text-center">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Loading products...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filtered.map(product => (
                  <div key={product.id} className="card card-hover overflow-hidden">
                    {(product.image_url || product.images?.length) ? (
                      <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                        <img src={product.images?.length ? (product.images[selectedImg[product.id] || 0] || product.images[0]) : product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                        <span className="font-logo text-3xl text-brand-500 select-none tracking-[-0.09em]">mms.</span>
                      </div>
                    )}
                    {product.images?.length > 1 && (
                      <div className="flex gap-1.5 px-3 pt-2">
                        {product.images.map((u, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedImg(prev => ({ ...prev, [product.id]: i }))}
                            className={`w-10 h-10 rounded-md overflow-hidden border-2 ${(selectedImg[product.id] || 0) === i ? 'border-brand-500' : 'border-transparent'}`}
                          >
                            <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-[10px] font-mono text-gray-400 mb-1">{product.sku}</p>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div>
                          <span className="text-[10px] text-gray-400">MRP</span>
                          <p className="font-semibold text-brand-600">{formatCurrency(product.mrp)}</p>
                        </div>
                        {cart[product.id] > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100"
                              onClick={() => removeFromCart(product.id)}
                              aria-label="Remove one"
                            >
                              <MdRemove size={14} />
                            </button>
                            <span className="text-sm font-bold text-gray-900 w-4 text-center">{cart[product.id]}</span>
                            <button
                              className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100"
                              onClick={() => addToCart(product.id)}
                              aria-label="Add one"
                            >
                              <MdAdd size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
                            onClick={() => addToCart(product.id)}
                          >
                            <MdAdd size={13} /> Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="card p-12 text-center">
                  <p className="text-sm text-gray-500">No products found</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* About / Company showcase */}
      <section id="about" className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-5 shadow-lg shadow-brand-500/20">
              <span className="font-logo text-[32px] leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">About MMS Prime</h2>
            <p className="text-sm text-gray-500 uppercase font-tagline mt-1 italic">Delivering Value Every Day</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-5">
              MMS Prime is a professionally managed healthcare, medical equipment, and cosmetic
              distribution company serving people, healthcare professionals, institutions, and
              businesses across Bangladesh. We believe in value beyond the product —
              honest pricing, steady supply, and dependable service on every delivery.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-brand-500">{products.filter(p => p.status === 'active').length || 0}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Products</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-brand-500">{categories.length > 1 ? categories.length - 1 : 0}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Categories</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-brand-500">100%</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Genuine</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-5">Why work with us</h3>
            <div className="space-y-4">
              {[
                { icon: <MdVerified size={18} />, title: 'Multi-category catalog', desc: 'A wide range of products for diverse business needs.' },
                { icon: <MdShield size={18} />, title: 'Trusted & genuine stock', desc: 'Quality-assured products sourced from reputable manufacturers.' },
                { icon: <MdLocalShipping size={18} />, title: 'Consistent availability', desc: 'Reliable stock levels to keep your shelves full.' },
                { icon: <MdPhone size={18} />, title: 'Dedicated support', desc: 'A responsive team ready to help at every step.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start card p-4">
                  <div className="w-9 h-9 bg-brand-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Profile teaser */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Company Profile</h2>
          <p className="text-sm text-gray-600 leading-relaxed mt-4 max-w-3xl mx-auto">
            MMS Prime is a Bangladesh-based importer, distributor, and market-development company
            specializing in healthcare products, medical equipment, and cosmetic products — and the
            nationwide distributor and marketer of MEDIRON® medical equipment.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">5</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">DGDA-registered categories</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">3 Yrs</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Warranty on BP monitors &amp; nebulizer</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">Lifetime</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Warranty on glucose meter</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-2xl font-bold text-brand-500">Nationwide</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">Distribution across Bangladesh</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <button className="btn-primary" onClick={() => navigate('/company-profile')}>
            View Full Company Profile
          </button>
          <a href="/company-profile.pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Download Profile (PDF)
          </a>
        </div>
      </section>

      {/* Vision & Mission */}
      <section id="vision" className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Purpose That Guides Us</h2>
            <p className="text-sm text-gray-500 mt-2">Building a trusted healthcare distribution platform for Bangladesh</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <MdVisibility size={22} className="text-brand-500" />
              </div>
              <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">Our Vision</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1">A trusted national platform</h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                To build a trusted and professionally managed healthcare, medical equipment, and
                cosmetic distribution platform in Bangladesh by making quality products more
                accessible to people, healthcare professionals, institutions, and businesses.
              </p>
            </div>
            <div className="card p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <MdFlag size={22} className="text-brand-500" />
              </div>
              <p className="text-[11px] font-bold text-brand-500 uppercase tracking-widest">Our Mission</p>
              <h3 className="text-lg font-bold text-gray-900 mt-1">Import. Distribute. Serve.</h3>
              <p className="text-sm text-gray-600 leading-relaxed mt-3">
                To import, distribute, and market reliable healthcare, medical equipment, and
                cosmetic products through professional service, responsible business practices,
                integrated sales channels, and a strong nationwide network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Management */}
      <section id="management" className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Our Management</h2>
          <p className="text-sm text-gray-500 mt-2">Leadership committed to professional service and responsible growth</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MANAGEMENT.map(person => (
            <div key={person.name} className="card card-hover p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-brand-500 text-white flex items-center justify-center font-brandname text-lg font-bold tracking-wide shadow-lg shadow-brand-500/20">
                {person.initials}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mt-4 leading-snug">{person.name}</h3>
              <p className="text-[11px] font-medium text-brand-500 uppercase tracking-wide mt-1">{person.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section id="certifications" className="bg-surface-50 border-y border-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">Certifications &amp; Registrations</h2>
            <p className="text-sm text-gray-500 mt-2">DGDA registered medical devices — quality you can verify</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setCertIndex(n)} className="card card-hover overflow-hidden group text-left">
                <div className="aspect-[3/4] bg-gray-50 overflow-hidden">
                  <img src={`/certificates/cert-${n}-thumb.jpg`} alt={`Certificate ${n}`} className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform" loading="lazy" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-700">Certificate {n}</span>
                  <MdVisibility size={14} className="text-brand-500" />
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/certificates/mediron-certificates.pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-flex text-sm">
              <MdDownload size={16} /> Download all certificates (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* Certificate lightbox */}
      {certIndex !== null && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4" onClick={() => setCertIndex(null)}>
          <div className="relative w-full max-w-3xl max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white">Certificate {certIndex} of 5</p>
              <div className="flex items-center gap-2">
                <a href="/certificates/mediron-certificates.pdf" download className="text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 flex items-center gap-1">
                  <MdDownload size={14} /> PDF
                </a>
                <button type="button" aria-label="Close" onClick={() => setCertIndex(null)} className="p-1.5 text-white bg-white/15 hover:bg-white/25 rounded-lg">
                  <MdClose size={18} />
                </button>
              </div>
            </div>
            <div className="relative">
              <img src={`/certificates/cert-${certIndex}.jpg`} alt={`Certificate ${certIndex}`} className="w-full max-h-[82vh] object-contain rounded-lg bg-white" />
              <button type="button" aria-label="Previous certificate" onClick={() => setCertIndex((certIndex - 1 + 5) % 5 || 5)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-black/50 hover:bg-black/70 rounded-lg">
                <MdChevronLeft size={22} />
              </button>
              <button type="button" aria-label="Next certificate" onClick={() => setCertIndex((certIndex % 5) + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-black/50 hover:bg-black/70 rounded-lg">
                <MdChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA / Contact */}
      <section id="contact" className="bg-brand-500 py-14">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="font-logo text-3xl text-white select-none tracking-[-0.09em]">mms.</span>
          <h2 className="font-brandname text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mt-3">Delivering Value Every Day</h2>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Become a dealer or browse our catalog. Our team is ready to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 text-white">
            <div className="flex items-center gap-2 text-sm">
              <MdPhone size={16} /> +880 1790-606057
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MdPhone size={16} /> +880 1818-276424
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MdEmail size={16} /> mmsprimebd@gmail.com
            </div>
          </div>
          {!user && (
            <button
              className="bg-white text-brand-600 font-semibold rounded-xl px-8 py-3 text-sm mt-8 hover:opacity-95 transition-opacity shadow-lg"
              onClick={() => navigate('/login')}
            >
              Login to Your Account
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-logo text-base leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <span className="font-brandname text-sm font-bold text-white uppercase tracking-wide">MMS Prime</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} MMS Prime. All rights reserved.</p>
        </div>
      </footer>

      {/* Public cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-xl mx-auto card p-3 sm:p-4 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <MdShoppingCart size={18} className="text-brand-600 flex-shrink-0" />
              <span className="text-xs text-gray-600 truncate">{cartCount} item{cartCount > 1 ? 's' : ''} · {formatCurrency(cartTotal)}</span>
            </div>
            <button
              className="btn-primary text-xs px-4 py-2.5"
              onClick={() => {
                setOrderPlaced(false)
                setShowCheckout(true)
              }}
            >
              Checkout (COD)
            </button>
          </div>
        </div>
      )}

      {/* Spacer so the footer is not hidden behind the fixed cart bar */}
      {cartCount > 0 && <div className="h-20" />}

      {/* COD Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            {orderPlaced ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={28} className="text-emerald-500" />
                </div>
                <p className="text-base font-bold text-gray-900">Request Received!</p>
                <p className="text-xs text-gray-500 mt-1.5">
                  We will call you at <strong>{checkout.phone}</strong> to confirm delivery. Pay in cash when your order arrives.
                </p>
                <button
                  className="btn-primary w-full mt-6"
                  onClick={() => {
                    setShowCheckout(false)
                    setCheckout({ name: '', phone: '', address: '', notes: '' })
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl sm:rounded-xl">
                  <h3 className="text-sm font-bold text-gray-900">Cash on Delivery Checkout</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Pay in cash when your order arrives</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2.5">
                    {cartEntries.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 flex-1 truncate mr-2">{item.product.name}</span>
                        <span className="text-gray-400 mx-1">×{item.qty}</span>
                        <span className="font-semibold">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-900">Total (Payable on delivery)</span>
                    <span className="text-base font-bold text-brand-600">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Your name"
                      value={checkout.name}
                      onChange={(e) => setCheckout({ ...checkout, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="01XXXXXXXXX"
                      value={checkout.phone}
                      onChange={(e) => setCheckout({ ...checkout, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Delivery Address</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Area, city, district"
                      value={checkout.address}
                      onChange={(e) => setCheckout({ ...checkout, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Notes (optional)</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Anything we should know"
                      value={checkout.notes}
                      onChange={(e) => setCheckout({ ...checkout, notes: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="btn-secondary flex-1" onClick={() => setShowCheckout(false)}>Back</button>
                    <button className="btn-primary flex-1" onClick={handleSubmitCod} disabled={submitting}>
                      {submitting ? 'Placing...' : 'Place COD Request'}
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