import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'

// Pages
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Dealers from './pages/Dealers'
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
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Admin / Super Admin */}
        <Route path="/products" element={<ProtectedRoute roles={['super_admin','admin']}><Products /></ProtectedRoute>} />
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
        <Route path="/my-orders" element={<ProtectedRoute roles={['sales_executive','dealer']}><Orders /></ProtectedRoute>} />
        <Route path="/my-dealers" element={<ProtectedRoute roles={['sales_executive']}><Dealers /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute roles={['sales_executive']}><Invoices /></ProtectedRoute>} />

        {/* Dealer */}
        <Route path="/place-order" element={<ProtectedRoute roles={['dealer']}><PlaceOrder /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={['dealer']}><Invoices /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
