import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { MdSearch, MdShield, MdVerified, MdLocalShipping, MdPhone, MdEmail, MdArrowForward } from 'react-icons/md'

const BRAND = '#ff551f'

const CATEGORY_LABELS = {
  'General': 'Medical Devices',
  'glucose': 'Blood Glucose',
  'bp': 'Blood Pressure',
  'lancet': 'Lancets & Accessories',
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProducts()
      .then(data => setProducts((data || []).filter(p => p.status === 'active')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

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
              <span className="font-logo text-lg leading-none text-white select-none">mms</span>
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
            <span className="font-logo text-4xl leading-none text-brand-500 select-none">mms</span>
          </div>
          <h1 className="font-brandname text-4xl md:text-5xl font-bold text-white uppercase tracking-wide">MMS Prime Ltd</h1>
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
                Partner Login
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(product => (
                  <div key={product.id} className="card card-hover overflow-hidden">
                    {product.image_url ? (
                      <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                        <span className="font-logo text-3xl text-brand-500 select-none">mms</span>
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
                        <button
                          className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-0.5"
                          onClick={() => navigate('/login')}
                        >
                          Order <MdArrowForward size={13} />
                        </button>
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
              <span className="font-logo text-2xl leading-none text-white select-none">mms</span>
            </div>
            <h2 className="font-brandname text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide">About MMS Prime</h2>
            <p className="text-sm text-gray-500 uppercase font-tagline mt-1 italic">Delivering Value Every Day</p>
            <p className="text-sm text-gray-600 leading-relaxed mt-5">
              MMS Prime Ltd is a growing distribution company serving retail partners, dealers, and
              end customers with a carefully selected catalog. We believe in value beyond the product —
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
            <h3 className="text-sm font-bold text-gray-900 mb-5">Why partner with us</h3>
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

      {/* CTA / Contact */}
      <section id="contact" className="bg-brand-500 py-14">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="font-logo text-3xl text-white select-none">mms</span>
          <h2 className="font-brandname text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mt-3">Delivering Value Every Day</h2>
          <p className="text-white/80 text-sm mt-3 max-w-xl mx-auto">
            Become a partner or browse our catalog. Our team is ready to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 text-white">
            <div className="flex items-center gap-2 text-sm">
              <MdPhone size={16} /> +880 1XXX-XXXXXX
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MdEmail size={16} /> info@mmsprime.com
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
              <span className="font-logo text-sm leading-none text-white select-none">mms</span>
            </div>
            <span className="font-brandname text-sm font-bold text-white uppercase tracking-wide">MMS Prime Ltd</span>
          </div>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} MMS Prime Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}