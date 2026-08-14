import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Beef, Milk, ListChecks, AlertTriangle, Wallet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { entities, analytics } from '@/api';
import { useAuth } from '@/lib/AuthContext';

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);

  const { data: cattle = [] } = useQuery({ queryKey: ['Cattle'], queryFn: () => entities.Cattle.list() });
  const { data: milk = [] } = useQuery({ queryKey: ['MilkProduction'], queryFn: () => entities.MilkProduction.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['Task'], queryFn: () => entities.Task.list() });
  const { data: inventory = [] } = useQuery({ queryKey: ['Inventory'], queryFn: () => entities.Inventory.list() });
  const { data: transactions = [] } = useQuery({ queryKey: ['Transaction'], queryFn: () => entities.Transaction.list() });
  const { data: insights, isLoading: insightsLoading } = useQuery({ queryKey: ['insights'], queryFn: analytics.insights });

  const activeCattle = cattle.filter((c) => c.status === 'Active' || c.status === 'Pregnant' || c.status === 'Dry').length;
  const todayMilk = milk.filter((m) => m.date === today).reduce((s, m) => s + (Number(m.quantity_liters) || 0), 0);
  const pendingTasks = tasks.filter((t) => t.status === 'Pending' || t.status === 'In Progress').length;
  const lowStock = inventory.filter((i) => i.reorder_level_kg && Number(i.current_stock_kg) <= Number(i.reorder_level_kg)).length;
  const thisMonth = today.slice(0, 7);
  const monthNet = transactions
    .filter((t) => (t.date || '').startsWith(thisMonth))
    .reduce((s, t) => s + (t.type === 'Income' ? Number(t.amount) || 0 : -(Number(t.amount) || 0)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Here's how the farm is doing today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Cattle" value={activeCattle} icon={Beef} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Today's Milk (L)" value={todayMilk.toFixed(1)} icon={Milk} tone="bg-blue-100 text-blue-700" />
        <StatCard label="Pending Tasks" value={pendingTasks} icon={ListChecks} tone="bg-amber-100 text-amber-700" />
        <StatCard label="Low Stock Items" value={lowStock} icon={AlertTriangle} tone="bg-red-100 text-red-700" />
        <StatCard label="Net This Month" value={monthNet.toLocaleString()} icon={Wallet} tone="bg-purple-100 text-purple-700" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quick Insights</CardTitle></CardHeader>
        <CardContent>
          {insightsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700">{insights?.summary}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">Milk trend: {insights?.milk_forecast?.trend}</Badge>
                <Badge variant="outline">{insights?.health_risk?.high_risk_count} high health risk</Badge>
                <Badge variant="outline">{insights?.breeding?.recommendations?.length || 0} breeding follow-ups</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Upcoming Tasks</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {tasks
            .filter((t) => t.status !== 'Completed')
            .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
            .slice(0, 6)
            .map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <span>{t.title}</span>
                <span className="text-slate-400">{t.due_date}</span>
              </div>
            ))}
          {tasks.filter((t) => t.status !== 'Completed').length === 0 && (
            <p className="text-sm text-slate-400">No pending tasks — nice work.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
