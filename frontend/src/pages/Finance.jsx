import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown, Scale, DollarSign, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EntityCrudPage from '@/components/EntityCrudPage';
import { useCategories } from '@/hooks/useCategories';
import { entities } from '@/api';
import MilkPriceDialog from '@/components/milk/MilkPriceDialog';
import { isOutstandingTransaction } from '@/lib/vendorUtils';

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsTab() {
  const [rows, setRows] = useState([]);
  const incomeCategories = useCategories('finance_income');
  const expenseCategories = useCategories('finance_expense');
  const allCategories = [...new Set([...incomeCategories, ...expenseCategories])];
  const { data: vendors = [] } = useQuery({ queryKey: ['Vendor'], queryFn: () => entities.Vendor.list() });
  const vendorByName = Object.fromEntries(vendors.map((v) => [v.name, v]));

  const fields = [
    { key: 'type', label: 'Type', type: 'select', options: ['Income', 'Expense'], required: true },
    { key: 'category', label: 'Category', type: 'select', options: allCategories, required: true },
    { key: 'amount', label: 'Amount', type: 'number', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['Cash', 'Bank Transfer', 'Check', 'Mobile Money', 'Other'] },
    { key: 'vendor_name', label: 'Vendor', type: 'text' },
    { key: 'reference', label: 'Reference #', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  ];

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type', render: (r) => <Badge className={r.type === 'Income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{r.type}</Badge> },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
    {
      key: 'vendor_name', label: 'Vendor',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span>{r.vendor_name || '—'}</span>
          {r.vendor_name && isOutstandingTransaction(r, vendorByName[r.vendor_name]?.payment_terms) && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">Outstanding</Badge>
          )}
        </div>
      ),
    },
  ];

  const { income, expense } = useMemo(() => {
    const income = rows.filter((r) => r.type === 'Income').reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const expense = rows.filter((r) => r.type === 'Expense').reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return { income, expense };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Income" value={income.toLocaleString()} icon={TrendingUp} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Total Expenses" value={expense.toLocaleString()} icon={TrendingDown} tone="bg-red-100 text-red-700" />
        <StatCard label="Net" value={(income - expense).toLocaleString()} icon={Scale} tone="bg-blue-100 text-blue-700" />
      </div>
      <EntityCrudPage
        entityName="Transaction"
        title="Transaction"
        description="Income and expenses across the farm."
        icon={Wallet}
        columns={columns}
        fields={fields}
        searchKeys={['category', 'vendor_name', 'description']}
        onRowsLoaded={setRows}
      />
    </div>
  );
}

function MilkPricesTab() {
  const [open, setOpen] = useState(false);
  const { data: prices = [] } = useQuery({
    queryKey: ['MilkPrice'],
    queryFn: () => entities.MilkPrice.list('-month', 24),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Monthly Milk Prices</h3>
          <p className="text-sm text-slate-500">Used to calculate milk sales income and for financial forecasting.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1.5" /> Set Price</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {prices.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-3">
            <p className="text-xs text-slate-500">{p.month}</p>
            <p className="text-lg font-semibold text-emerald-600">{p.price_per_liter}</p>
          </div>
        ))}
        {prices.length === 0 && <p className="text-sm text-slate-400 col-span-full">No prices set yet.</p>}
      </div>
      <MilkPriceDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

export default function Finance() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-emerald-600" /> Finance
      </h1>
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="milk_prices">Milk Prices</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="pt-4"><TransactionsTab /></TabsContent>
        <TabsContent value="milk_prices" className="pt-4"><MilkPricesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
