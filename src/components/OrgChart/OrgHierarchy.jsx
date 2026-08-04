import { useState } from 'react'
import { MdExpandMore, MdExpandLess, MdPerson, MdStore, MdBusiness } from 'react-icons/md'
import { HiUserGroup } from 'react-icons/hi'

// Org hierarchy data — single source of truth
const ORG_HIERARCHY = {
  id: 'chairman',
  name: 'Chairman',
  role: 'chairman',
  level: 0,
  color: 'bg-purple-600',
  children: [
    {
      id: 'md',
      name: 'Managing Director',
      role: 'md',
      level: 1,
      color: 'bg-purple-500',
      children: [
        {
          id: 'ceo',
          name: 'Chief Executive Officer',
          role: 'ceo',
          level: 2,
          color: 'bg-indigo-600',
          children: [
            {
              id: 'directors',
              name: 'Board of Directors',
              role: 'directors',
              level: 3,
              color: 'bg-indigo-500',
              children: [
                { id: 'nsm', name: 'National Sales Manager', role: 'nsm', level: 4, color: 'bg-blue-600' },
                { id: 'marketing_dir', name: 'Marketing Director', role: 'marketing', level: 4, color: 'bg-blue-600' },
                { id: 'finance_dir', name: 'Finance Director', role: 'finance', level: 4, color: 'bg-blue-600' },
                { id: 'supply_dir', name: 'Supply Chain Director', role: 'supply', level: 4, color: 'bg-blue-600' },
              ]
            },
            {
              id: 'rsm',
              name: 'Regional Sales Manager',
              role: 'rsm',
              level: 4,
              color: 'bg-blue-500',
              children: [
                {
                  id: 'dm',
                  name: 'District Manager',
                  role: 'dm',
                  level: 5,
                  color: 'bg-sky-500',
                  children: [
                    {
                      id: 'asm',
                      name: 'Area Sales Manager (ASM)',
                      role: 'asm',
                      level: 6,
                      color: 'bg-teal-500',
                      children: [
                        {
                          id: 'tso',
                          name: 'Territory Sales Officer (TSO)',
                          role: 'tso',
                          level: 7,
                          color: 'bg-emerald-500',
                          children: [
                            {
                              id: 'master_dealer',
                              name: 'Master Dealer',
                              role: 'master_dealer',
                              level: 8,
                              color: 'bg-amber-500',
                              children: [
                                {
                                  id: 'dealer',
                                  name: 'Sub Dealer',
                                  role: 'dealer',
                                  level: 9,
                                  color: 'bg-orange-500',
                                  children: [
                                    {
                                      id: 'sub_agent',
                                      name: 'Sub Agent',
                                      role: 'sub_agent',
                                      level: 10,
                                      color: 'bg-red-400',
                                      children: [
                                          {
                                            id: 'retailer',
                                            name: 'Retailer',
                                            role: 'retailer',
                                            level: 11,
                                            color: 'bg-rose-400',
                                            children: [
                                              { id: 'customer', name: 'Customer', role: 'customer', level: 12, color: 'bg-gray-400' }
                                            ]
                                          }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

const ROLE_LABELS = {
  chairman: 'Chairman',
  md: 'Managing Director',
  ceo: 'CEO',
  directors: 'Board of Directors',
  nsm: 'National Sales Manager',
  marketing: 'Marketing Director',
  finance: 'Finance Director',
  supply: 'Supply Chain Director',
  rsm: 'Regional Sales Manager',
  dm: 'District Manager',
  asm: 'Area Sales Manager',
  tso: 'Territory Sales Officer',
  master_dealer: 'Master Dealer',
  dealer: 'Sub Dealer',
  sub_agent: 'Sub Agent',
  retailer: 'Retailer',
  customer: 'Customer',
}

function OrgNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 3)
  const hasChildren = node.children && node.children.length > 0

  const getIcon = (role) => {
    if (['chairman', 'md', 'ceo'].includes(role)) return <MdBusiness size={16} />
    if (['master_dealer', 'dealer', 'retailer'].includes(role)) return <MdStore size={16} />
    if (role === 'customer') return <MdPerson size={16} />
    return <HiUserGroup size={16} />
  }

  return (
    <div className="relative">
      {/* Node */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold ${node.color} shadow-sm`}>
        <span className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center flex-shrink-0">
          {getIcon(node.role)}
        </span>
        <span className="whitespace-nowrap">{node.name}</span>
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
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Organizational Hierarchy</h3>
          <p className="text-xs text-gray-400 mt-0.5">KGSM Group — Mediron Sales Structure</p>
        </div>
        <span className="badge-info text-[10px]">13 Levels</span>
      </div>
      <div className="overflow-x-auto pb-4">
        <OrgNode node={ORG_HIERARCHY} />
      </div>
      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Legend</p>
        <div className="flex flex-wrap gap-3">
          {[
            { color: 'bg-purple-600', label: 'Top Management' },
            { color: 'bg-blue-600', label: 'Sales Leadership' },
            { color: 'bg-teal-500', label: 'Area / Territory' },
            { color: 'bg-amber-500', label: 'Distribution' },
            { color: 'bg-rose-400', label: 'Retail' },
            { color: 'bg-gray-400', label: 'End Customer' },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-[10px] text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { ROLE_LABELS }
