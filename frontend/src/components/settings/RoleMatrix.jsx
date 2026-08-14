import React from 'react';
import { Check, Minus, Crown, Shield, User, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import { PERMISSION_MATRIX } from '@/lib/permissions';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: Crown, color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'manager', label: 'Manager', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'staff', label: 'Staff', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'viewer', label: 'Viewer', icon: Eye, color: 'text-slate-600', bg: 'bg-slate-50' },
];

function Cell({ value }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-600 mx-auto" />;
  if (value === false) return <Minus className="w-4 h-4 text-slate-300 mx-auto" />;
  return null;
}

export default function RoleMatrix() {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-800">
          <strong>Enforced:</strong> This matrix defines the active access levels per role. Navigation and page access are automatically filtered based on the user's assigned role. Assign roles in the <em>Users</em> tab.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-sm font-semibold text-slate-600 min-w-[220px]">Module / Permission</th>
                {ROLES.map(role => {
                  const Icon = role.icon;
                  return (
                    <th key={role.key} className="px-4 py-3 text-center min-w-[90px]">
                      <div className={cn("inline-flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg", role.bg)}>
                        <Icon className={cn("w-4 h-4", role.color)} />
                        <span className={cn("text-xs font-semibold", role.color)}>{role.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr
                  key={row.module}
                  className={cn(
                    "border-b border-slate-50 hover:bg-slate-50/60 transition-colors",
                    idx % 2 === 0 ? '' : 'bg-slate-50/30'
                  )}
                >
                  <td className="px-5 py-3 text-sm text-slate-700">{row.module}</td>
                  {ROLES.map(role => (
                    <td key={role.key} className="px-4 py-3 text-center">
                      <Cell value={row.permissions[role.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 px-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Check className="w-4 h-4 text-emerald-600" /> Allowed
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Minus className="w-4 h-4 text-slate-300" /> Not Allowed
        </div>
      </div>
    </div>
  );
}
