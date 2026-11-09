import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MdDashboard, MdShoppingCart, MdStore, MdReceipt, MdAssessment, MdPeople
} from 'react-icons/md'

const MOBILE_NAV = {
  super_admin: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  admin: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  sales_manager: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  area_manager: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/dealers', icon: MdStore, label: 'Dealers' },
    { path: '/reports', icon: MdAssessment, label: 'Reports' },
  ],
  sales_executive: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/my-orders', icon: MdShoppingCart, label: 'Orders' },
    { path: '/my-dealers', icon: MdStore, label: 'Dealers' },
    { path: '/collections', icon: MdReceipt, label: 'Collect' },
    { path: '/crm', icon: MdPeople, label: 'CRM' },
  ],
  dealer: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/place-order', icon: MdShoppingCart, label: 'Order' },
    { path: '/my-orders', icon: MdReceipt, label: 'History' },
    { path: '/payments', icon: MdAssessment, label: 'Payments' },
  ],
  warehouse: [
    { path: '/dashboard', icon: MdDashboard, label: 'Home' },
    { path: '/inventory', icon: MdShoppingCart, label: 'Stock' },
    { path: '/orders', icon: MdReceipt, label: 'Orders' },
  ],
}

export default function MobileBottomNav() {
  const { user } = useAuth()
  const items = MOBILE_NAV[user?.role] || MOBILE_NAV.sales_executive

  return (
    <nav className="no-print mobile-bottom-nav flex items-center justify-around lg:hidden">
      {items.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-gray-400'
              }`
            }
          >
            <Icon size={20} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
