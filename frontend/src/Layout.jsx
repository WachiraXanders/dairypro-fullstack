import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/permissions';
import {
  LayoutDashboard, Beef, Milk, HeartPulse, Users2, Warehouse, ListChecks,
  Wallet, Truck, BarChart3, Sparkles, Settings as SettingsIcon, LogOut, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Cattle', label: 'Cattle', icon: Beef },
  { key: 'MilkProduction', label: 'Milk Production', icon: Milk },
  { key: 'HealthRecords', label: 'Health Records', icon: HeartPulse },
  { key: 'Breeding', label: 'Breeding', icon: Users2 },
  { key: 'Inventory', label: 'Inventory', icon: Warehouse },
  { key: 'Tasks', label: 'Tasks', icon: ListChecks },
  { key: 'Finance', label: 'Finance', icon: Wallet },
  { key: 'Vendors', label: 'Vendors', icon: Truck },
  { key: 'Reports', label: 'Reports', icon: BarChart3 },
  { key: 'PredictiveAnalytics', label: 'Predictive Analytics', icon: Sparkles },
  { key: 'Settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role || 'staff';

  const items = NAV_ITEMS.filter((item) => canAccessPage(item.key, role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 flex items-center gap-2 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white">D</div>
        <span className="font-semibold text-white text-lg">DairyPro</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(({ key, label, icon: Icon }) => {
          const active = location.pathname === `/${key}` || (key === 'Dashboard' && location.pathname === '/');
          return (
            <Link
              key={key}
              to={`/${key}`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-white p-2" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex md:w-60 md:flex-col bg-slate-900 fixed inset-y-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-slate-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">{currentPageName}</span>
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
