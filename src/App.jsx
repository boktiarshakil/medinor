import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Dealers from './pages/Dealers'
import Areas from './pages/Areas'
import Orders from './pages/Orders'
import Invoices from './pages/Invoices'
import Inventory from './pages/Inventory'
import Returns from './pages/Returns'
import CRM from './pages/CRM'
import Reports from './pages/Reports'
import Campaigns from './pages/Campaigns'
import Support from './pages/Support'
import Settings from './pages/Settings'
import PlaceOrder from './pages/PlaceOrder'

// New feature pages
import Announcements from './pages/announcements/Announcements'
import Messages from './pages/messages/Messages'
import OrderTracker from './pages/orders/OrderTracker'
import GPSTracking from './pages/gps/GPSTracking'
import Warranty from './pages/warranty/Warranty'
import OrgChartPage from './components/OrgChart/OrgHierarchy'
import Settlements from './pages/Settlements'
import PersonalIds from './pages/PersonalIds'
import CODRequests from './pages/CODRequests'
import UserManagement from './pages/UserManagement'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin / Super Admin */}
        <Route path="/products" element={<ProtectedRoute roles={['super_admin','admin']}><Products /></ProtectedRoute>} />
        <Route path="/areas" element={<ProtectedRoute roles={['super_admin','admin']}><Areas /></ProtectedRoute>} />
        <Route path="/dealers" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive']}><Dealers /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','warehouse']}><Orders /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><Invoices /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={['super_admin','admin','warehouse']}><Inventory /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><Returns /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive']}><CRM /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager']}><Reports /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><Campaigns /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><Support /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['super_admin','admin']}><Settings /></ProtectedRoute>} />

        {/* Sales Executive */}
        <Route path="/my-orders" element={<ProtectedRoute roles={['sales_executive','dealer']}><OrderTracker /></ProtectedRoute>} />
        <Route path="/my-dealers" element={<ProtectedRoute roles={['sales_executive']}><Dealers /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute roles={['sales_executive']}><Invoices /></ProtectedRoute>} />

        {/* Dealer / SR order placement */}
        <Route path="/place-order" element={<ProtectedRoute roles={['dealer','sales_executive']}><PlaceOrder /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={['dealer']}><Invoices /></ProtectedRoute>} />

        {/* Feature pages — role-based access */}
        <Route path="/announcements" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive','warehouse','dealer']}><Announcements /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive','warehouse']}><Messages /></ProtectedRoute>} />
        <Route path="/order-tracker" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive','warehouse','dealer']}><OrderTracker /></ProtectedRoute>} />
        <Route path="/gps-tracking" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager']}><GPSTracking /></ProtectedRoute>} />
        <Route path="/warranty" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager','sales_executive','warehouse','dealer']}><Warranty /></ProtectedRoute>} />
        <Route path="/org-chart" element={<ProtectedRoute roles={['super_admin','admin','sales_manager','area_manager']}><OrgChartPage /></ProtectedRoute>} />

        {/* Price isolation & settlement — admin only */}
        <Route path="/settlements" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><Settlements /></ProtectedRoute>} />
        <Route path="/cod-requests" element={<ProtectedRoute roles={['super_admin','admin','sales_manager']}><CODRequests /></ProtectedRoute>} />
        <Route path="/personal-ids" element={<ProtectedRoute roles={['super_admin','admin']}><PersonalIds /></ProtectedRoute>} />

        {/* User management — super_admin only */}
        <Route path="/users" element={<ProtectedRoute roles={['super_admin','admin']}><UserManagement /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
