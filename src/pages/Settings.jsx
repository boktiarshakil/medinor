import { useAuth } from '../context/AuthContext'
import { MdSettings, MdPeople, MdSecurity, MdNotifications, MdPalette } from 'react-icons/md'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdPeople size={16} className="text-brand-500" /> User Management
          </h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Manage Users & Roles</button>
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Area Assignments</button>
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Dealer-SR Mapping</button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdSecurity size={16} className="text-brand-500" /> Security
          </h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Change Password</button>
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Two-Factor Auth</button>
            <button className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Audit Logs</button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdNotifications size={16} className="text-brand-500" /> Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">New Order Alerts</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payment Received</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Low Stock Warnings</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-500 rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Target Achievement</span>
              <input type="checkbox" className="w-4 h-4 text-brand-500 rounded" />
            </label>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdPalette size={16} className="text-brand-500" /> Preferences
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Currency</label>
              <select className="input"><option>BDT (৳)</option></select>
            </div>
            <div>
              <label className="label">Date Format</label>
              <select className="input"><option>DD MMM YYYY</option></select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input"><option>English</option><option>বাংলা</option></select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
