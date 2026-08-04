import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/utils'
import { MdMenu, MdNotifications, MdSearch } from 'react-icons/md'
import { useState } from 'react'

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

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
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className={`${searchOpen ? 'w-48 md:w-64' : 'w-0'} overflow-hidden transition-all duration-200`}>
          <input
            type="text"
            placeholder="Search..."
            className="input py-1.5 text-sm w-full"
            autoFocus={searchOpen}
          />
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <MdSearch size={20} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <MdNotifications size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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
