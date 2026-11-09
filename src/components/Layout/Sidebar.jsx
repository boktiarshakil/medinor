import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdDashboard, MdInventory2, MdShoppingCart, MdReceipt,
  MdPeople, MdAssessment, MdLocalShipping, MdAssignmentReturn,
  MdCampaign, MdSupportAgent, MdSettings, MdClose, MdStore,
  MdChat, MdMyLocation, MdQrCode, MdAccountTree, MdBadge, MdAccountBalance,
  MdLocationOn, MdShoppingBag, MdLogout
} from 'react-icons/md'

const NAV_ITEMS = {
  super_admin: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/products', icon: MdInventory2, label: 'Products' },
    { path: '/areas', icon: MdLocationOn, label: 'Areas' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/invoices', icon: MdReceipt, label: 'Invoices' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/inventory', icon: MdLocalShipping, label: 'Inventory' },
    { path: '/returns', icon: MdAssignmentReturn, label: 'Returns' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
    { path: '/gps-tracking', icon: MdMyLocation, label: 'GPS Tracking' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/org-chart', icon: MdAccountTree, label: 'Org Chart' },
    { path: '/settlements', icon: MdAccountBalance, label: 'Settlements' },
    { path: '/cod-requests', icon: MdShoppingBag, label: 'COD Requests' },
    { path: '/courier', icon: MdLocalShipping, label: 'Courier' },
    { path: '/personal-ids', icon: MdBadge, label: 'Personal IDs' },
    { path: '/users', icon: MdPeople, label: 'User Management' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/campaigns', icon: MdCampaign, label: 'Campaigns' },
    { path: '/support', icon: MdSupportAgent, label: 'Support' },
    { path: '/settings', icon: MdSettings, label: 'Settings' },
  ],
  admin: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/products', icon: MdInventory2, label: 'Products' },
    { path: '/areas', icon: MdLocationOn, label: 'Areas' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/invoices', icon: MdReceipt, label: 'Invoices' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/inventory', icon: MdLocalShipping, label: 'Inventory' },
    { path: '/returns', icon: MdAssignmentReturn, label: 'Returns' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
    { path: '/gps-tracking', icon: MdMyLocation, label: 'GPS Tracking' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/org-chart', icon: MdAccountTree, label: 'Org Chart' },
    { path: '/settlements', icon: MdAccountBalance, label: 'Settlements' },
    { path: '/cod-requests', icon: MdShoppingBag, label: 'COD Requests' },
    { path: '/courier', icon: MdLocalShipping, label: 'Courier' },
    { path: '/personal-ids', icon: MdBadge, label: 'Personal IDs' },
    { path: '/users', icon: MdPeople, label: 'User Management' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/campaigns', icon: MdCampaign, label: 'Campaigns' },
    { path: '/support', icon: MdSupportAgent, label: 'Support' },
    { path: '/settings', icon: MdSettings, label: 'Settings' },
  ],
  sales_manager: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/gps-tracking', icon: MdMyLocation, label: 'GPS Tracking' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/org-chart', icon: MdAccountTree, label: 'Org Chart' },
    { path: '/settlements', icon: MdAccountBalance, label: 'Settlements' },
    { path: '/cod-requests', icon: MdShoppingBag, label: 'COD Requests' },
    { path: '/courier', icon: MdLocalShipping, label: 'Courier' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  area_manager: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/gps-tracking', icon: MdMyLocation, label: 'GPS Tracking' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/org-chart', icon: MdAccountTree, label: 'Org Chart' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
  ],
  sales_executive: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/my-orders', icon: MdShoppingCart, label: 'My Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/my-dealers', icon: MdStore, label: 'My Dealers' },
    { path: '/collections', icon: MdReceipt, label: 'Collections' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  dealer: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/place-order', icon: MdShoppingCart, label: 'Place Order' },
    { path: '/my-orders', icon: MdReceipt, label: 'My Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
    { path: '/payments', icon: MdAssessment, label: 'Payments' },
  ],
  warehouse: [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/inventory', icon: MdInventory2, label: 'Inventory' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/order-tracker', icon: MdLocalShipping, label: 'Order Tracker' },
    { path: '/announcements', icon: MdCampaign, label: 'Announcements' },
    { path: '/messages', icon: MdChat, label: 'Messages' },
    { path: '/warranty', icon: MdQrCode, label: 'Warranty' },
  ],
}

export default function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const items = NAV_ITEMS[user?.role] || NAV_ITEMS.sales_executive

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="no-print fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`
        no-print fixed top-0 left-0 app-sidebar w-64 bg-white border-r border-gray-100 z-50 flex flex-col
        transform transition-transform duration-200 ease-out
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="font-logo text-base leading-none text-white select-none tracking-[-0.09em]">mms.</span>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900">MMS Prime</span>
              <span className="text-[10px] text-gray-400 block -mt-0.5">Delivering Value Every Day</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1 min-h-0">
          {items.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
          <button
            onClick={signOut}
            className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <MdLogout size={19} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
