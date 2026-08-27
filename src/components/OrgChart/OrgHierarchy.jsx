import { useState, useEffect } from 'react'
import { MdExpandMore, MdExpandLess, MdPerson, MdStore, MdBusiness, MdWarning } from 'react-icons/md'
import { HiUserGroup } from 'react-icons/hi'
import { api } from '../../lib/api'

const ROLE_COLORS = {
  super_admin: 'bg-purple-600',
  admin: 'bg-purple-500',
  sales_manager: 'bg-indigo-600',
  area_manager: 'bg-teal-500',
  sales_executive: 'bg-emerald-500',
  dealer: 'bg-amber-500',
}

const GROUP_COLOR = 'bg-slate-500'

function OrgNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0

  const getIcon = (role) => {
    if (role === 'dealer') return <MdStore size={16} />
    if (role === 'area' || role === 'group') return <HiUserGroup size={16} />
    if (['super_admin', 'admin', 'sales_manager'].includes(role)) return <MdBusiness size={16} />
    return <MdPerson size={16} />
  }

  return (
    <div className="relative">
      {/* Node */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold ${node.color} shadow-sm`}>
        <span className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
          {getIcon(node.role)}
        </span>
        <span className="whitespace-nowrap">{node.name}</span>
        {node.meta && <span className="text-[9px] font-normal bg-white/20 rounded px-1.5 py-0.5">{node.meta}</span>}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 w-5 h-5 bg-white/20 rounded flex items-center justify-center hover:bg-white/30"
          >
            {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-6 mt-1 pl-4 border-l-2 border-gray-200 space-y-1">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrgHierarchy() {
  const [tree, setTree] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const build = async () => {
      try {
        const [users, areas, dealers] = await Promise.all([
          api.getUsers(),
          api.getAreas().catch(() => []),
          api.getDealers().catch(() => []),
        ])
        const active = (users || []).filter(u => u.is_active !== false)
        const management = active.filter(u => ['super_admin', 'admin', 'sales_manager'].includes(u.role))
        const areaManagers = active.filter(u => u.role === 'area_manager')
        const srs = active.filter(u => u.role === 'sales_executive')
        const dealerList = dealers || []

        const areaMap = {}
        ;(areas || []).forEach(a => { areaMap[a.id] = a })

        // Top management node (real people)
        const managementChildren = management.map(u => ({
          id: `u-${u.id}`,
          name: u.full_name || u.email || 'Unknown',
          role: u.role,
          color: ROLE_COLORS[u.role] || GROUP_COLOR,
          meta: u.role.replace('_', ' '),
        }))

        // One area branch per real area that has anyone assigned
        const areaBranches = (areas || [])
          .filter(a => {
            const mgr = areaManagers.find(u => u.area_id === a.id)
            const areaSRs = srs.filter(u => u.area_id === a.id)
            const areaDealers = dealerList.filter(d => d.area_id === a.id)
            return mgr || areaSRs.length > 0 || areaDealers.length > 0
          })
          .map(a => {
            const mgr = areaManagers.find(u => u.area_id === a.id)
            const areaSRs = srs.filter(u => u.area_id === a.id)

            // Dealers grouped under their assigned SR, otherwise under the area
            const srChildren = areaSRs.map(sr => {
              const srDealers = dealerList.filter(d => d.assigned_sr_id === sr.id)
              return {
                id: `u-${sr.id}`,
                name: sr.full_name || sr.email || 'Unknown',
                role: 'sales_executive',
                color: ROLE_COLORS.sales_executive,
                meta: srDealers.length ? `${srDealers.length} dealers` : 'SR',
                children: srDealers.map(d => ({
                  id: `d-${d.id}`,
                  name: d.name,
                  role: 'dealer',
                  color: ROLE_COLORS.dealer,
                })),
              }
            })

            const unassignedDealers = dealerList.filter(d => d.area_id === a.id && !d.assigned_sr_id)
            if (unassignedDealers.length > 0) {
              srChildren.push({
                id: `area-unassigned-${a.id}`,
                name: 'Unassigned Dealers',
                role: 'group',
                color: GROUP_COLOR,
                children: unassignedDealers.map(d => ({
                  id: `d-${d.id}`,
                  name: d.name,
                  role: 'dealer',
                  color: ROLE_COLORS.dealer,
                })),
              })
            }

            const children = []
            if (mgr) {
              children.push({
                id: `u-${mgr.id}`,
                name: mgr.full_name || mgr.email || 'Unknown',
                role: 'area_manager',
                color: ROLE_COLORS.area_manager,
                meta: 'Area Manager',
                children: srChildren.length > 0 ? srChildren : undefined,
              })
            }
            if (!mgr && srChildren.length > 0) {
              children.push(...srChildren)
            }

            return {
              id: `a-${a.id}`,
              name: a.name || a.code || 'Area',
              role: 'area',
              color: GROUP_COLOR,
              meta: `${children.length} reports`,
              children,
            }
          })

        // Dealers with no area and no SR
        const orphanDealers = dealerList.filter(d => !d.area_id && !d.assigned_sr_id)
        const orphanBranch = orphanDealers.length > 0 ? [{
          id: 'orphan-dealers',
          name: 'Unassigned Dealers',
          role: 'group',
          color: GROUP_COLOR,
          children: orphanDealers.map(d => ({
            id: `d-${d.id}`,
            name: d.name,
            role: 'dealer',
            color: ROLE_COLORS.dealer,
          })),
        }] : []

        setTree({
          id: 'root',
          name: 'MMS Prime',
          role: 'group',
          color: 'bg-slate-700',
          meta: `${active.length} active users`,
          children: [
            { id: 'mgmt', name: 'Management', role: 'group', color: 'bg-purple-700', children: managementChildren },
            ...areaBranches,
            ...orphanBranch,
          ],
        })
      } catch (err) {
        console.error('OrgHierarchy build failed:', err)
        setError(err.message || 'Failed to load organization data')
      }
    }
    build()
  }, [])

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Organizational Hierarchy</h3>
          <p className="text-xs text-gray-400 mt-0.5">Built live from users, areas &amp; dealer assignments</p>
        </div>
        {tree && <span className="badge-info text-[10px]">Live</span>}
      </div>
      {error ? (
        <div className="p-6 text-center">
          <MdWarning size={28} className="mx-auto text-amber-500 mb-2" />
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      ) : tree ? (
        <div className="overflow-x-auto pb-4">
          <OrgNode node={tree} />
        </div>
      ) : (
        <div className="p-10 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-3">Loading organization data...</p>
        </div>
      )}
      {/* Legend */}
      {tree && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { color: 'bg-purple-600', label: 'Management' },
              { color: 'bg-teal-500', label: 'Area Manager' },
              { color: 'bg-emerald-500', label: 'Sales Executive' },
              { color: 'bg-amber-500', label: 'Dealer' },
              { color: 'bg-slate-500', label: 'Group' },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                <span className="text-[10px] text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
