import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/utils'
import { MdMenu, MdNotifications, MdSearch, MdClose } from 'react-icons/md'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  // Load notifications on mount + poll
  const loadNotifications = async () => {
    if (!user?.id) return
    try {
      setNotifLoading(true)
      const data = await api.getNotifications(user.id)
      setNotifications(data)
      // The badge must reflect ALL unread rows, not just the 20 newest shown
      // in the dropdown, so query the true count separately.
      api.getUnreadNotificationCount(user.id)
        .then(setUnreadCount)
        .catch(() => {})
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()

    // Keep the 60s poll as a fallback in case the realtime socket drops.
    const timer = setInterval(loadNotifications, 60000)

    // Real-time updates for the notification bell.
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload
          setNotifications(prev => {
            let next = prev
            if (eventType === 'INSERT') {
              next = [newRow, ...prev.filter(n => n.id !== newRow.id)]
            } else if (eventType === 'UPDATE') {
              next = prev.map(n => (n.id === newRow.id ? { ...n, ...newRow } : n))
            } else if (eventType === 'DELETE') {
              next = prev.filter(n => n.id !== oldRow?.id)
            }
            return next.slice(0, 50)
          })
          api.getUnreadNotificationCount(user.id)
            .then(setUnreadCount)
            .catch(() => {})
        }
      )
      .subscribe()

    return () => {
      clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
        setSearchResults(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search across products, dealers, orders, invoices
  useEffect(() => {
    if (!searchOpen || !query.trim()) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const q = query.trim().toLowerCase()
        const [products, dealers, orders, invoices] = await Promise.all([
          api.getProducts().catch(() => []),
          api.getDealers().catch(() => []),
          api.getOrders().catch(() => []),
          api.getInvoices().catch(() => []),
        ])
        const result = {
          products: products
            .filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
            .slice(0, 5),
          dealers: dealers
            .filter(d => d.name?.toLowerCase().includes(q) || d.mobile?.includes(q))
            .slice(0, 5),
          orders: orders
            .filter(o => String(o.order_number || o.order_no || '').toLowerCase().includes(q))
            .slice(0, 5),
          invoices: invoices
            .filter(i => String(i.invoice_number || '').toLowerCase().includes(q))
            .slice(0, 5),
        }
        setSearchResults(result)
      } catch (err) {
        console.error('Search failed:', err)
        setSearchResults(null)
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, searchOpen])

  const goTo = (path) => {
    const q = encodeURIComponent(query.trim())
    setSearchOpen(false)
    setSearchResults(null)
    setQuery('')
    navigate(q ? `${path}?q=${q}` : path)
  }

  const handleNotifClick = async (n) => {
    if (!n.is_read) {
      try {
        await api.markNotificationRead(n.id)
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
        setUnreadCount(c => Math.max(0, c - 1))
      } catch (err) {
        console.error('Failed to mark read:', err)
      }
    }
    setNotifOpen(false)
    const path = {
      order: '/orders',
      invoice: '/invoices',
      return: '/returns',
      announcement: '/announcements',
      order_comment: '/order-tracker',
      message: '/messages',
      direct_message: '/messages',
    }[n.reference_type] || '/dashboard'
    navigate(path)
  }

  const searchCount = searchResults
    ? searchResults.products.length + searchResults.dealers.length + searchResults.orders.length + searchResults.invoices.length
    : 0

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <MdMenu size={22} />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400 font-medium">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <p className="text-sm font-semibold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2" ref={searchRef}>
        {/* Search */}
        <div className={`${searchOpen ? 'w-48 md:w-72' : 'w-0'} overflow-hidden transition-all duration-200`}>
          <input
            type="text"
            placeholder="Search products, dealers, orders..."
            className="input py-1.5 text-sm w-full"
            autoFocus={searchOpen}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchOpen(false)
                setSearchResults(null)
              }
            }}
          />
        </div>
        <button
          onClick={() => {
            setSearchOpen(!searchOpen)
            if (searchOpen) setQuery('')
          }}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {searchOpen ? <MdClose size={20} /> : <MdSearch size={20} />}
        </button>

        {/* Search results dropdown */}
        {searchOpen && searchResults && (
          <div className="absolute top-14 right-24 lg:right-28 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
            {searchLoading ? (
              <p className="text-xs text-gray-400 p-2">Searching...</p>
            ) : searchCount === 0 ? (
              <p className="text-xs text-gray-400 p-2">No results for "{query}"</p>
            ) : (
              <div className="space-y-2">
                {searchResults.products.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Products</p>
                    {searchResults.products.map(p => (
                      <button key={p.id} onClick={() => goTo('/products')} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50">
                        <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.sku}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.dealers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Dealers</p>
                    {searchResults.dealers.map(d => (
                      <button key={d.id} onClick={() => goTo('/dealers')} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50">
                        <p className="text-xs font-medium text-gray-800 truncate">{d.name}</p>
                        <p className="text-[10px] text-gray-400">{d.mobile}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.orders.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Orders</p>
                    {searchResults.orders.map(o => (
                      <button key={o.id} onClick={() => goTo('/orders')} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50">
                        <p className="text-xs font-medium text-gray-800 truncate">{o.order_number || o.order_no}</p>
                        <p className="text-[10px] text-gray-400">{o.dealer?.name || '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.invoices.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase px-2 mb-1">Invoices</p>
                    {searchResults.invoices.map(i => (
                      <button key={i.id} onClick={() => goTo('/invoices')} className="w-full text-left px-2 py-1.5 rounded-md hover:bg-gray-50">
                        <p className="text-xs font-medium text-gray-800 truncate">{i.invoice_number}</p>
                        <p className="text-[10px] text-gray-400">{i.dealer?.name || '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <MdNotifications size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
                {unreadCount > 1 && (
                  <span className="text-[8px] text-white font-bold px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute top-11 right-0 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white">
                <p className="text-sm font-bold text-gray-900">Notifications</p>
                <button
                  onClick={async () => {
                    try {
                      await Promise.all(notifications.filter(n => !n.is_read).map(n => api.markNotificationRead(n.id)))
                      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
                      setUnreadCount(0)
                    } catch (err) {
                      console.error('Failed to mark all read:', err)
                    }
                  }}
                  className="text-[10px] text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Mark all read
                </button>
              </div>
              {notifLoading && notifications.length === 0 ? (
                <p className="text-xs text-gray-400 p-4">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center">No notifications yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${n.is_read ? '' : 'bg-brand-50/50'}`}
                    >
                      <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-gray-400 mt-1">
                        {formatDate(n.created_at, 'dd MMM, hh:mm a')}
                        {!n.is_read && <span className="ml-2 text-brand-600 font-bold">New</span>}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
          <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
