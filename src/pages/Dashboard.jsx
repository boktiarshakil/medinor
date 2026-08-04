import { useAuth } from '../context/AuthContext'
import SuperAdminDashboard from './dashboards/SuperAdminDashboard'
import SalesManagerDashboard from './dashboards/SalesManagerDashboard'
import AreaManagerDashboard from './dashboards/AreaManagerDashboard'
import SalesExecDashboard from './dashboards/SalesExecDashboard'
import DealerDashboard from './dashboards/DealerDashboard'
import WarehouseDashboard from './dashboards/WarehouseDashboard'

const DASHBOARD_MAP = {
  super_admin: SuperAdminDashboard,
  admin: SuperAdminDashboard,
  sales_manager: SalesManagerDashboard,
  area_manager: AreaManagerDashboard,
  sales_executive: SalesExecDashboard,
  dealer: DealerDashboard,
  warehouse: WarehouseDashboard,
}

export default function Dashboard() {
  const { user } = useAuth()
  const DashboardComponent = DASHBOARD_MAP[user?.role] || SalesExecDashboard
  return <DashboardComponent />
}
