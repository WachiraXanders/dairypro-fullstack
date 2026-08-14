import React, { useMemo, useState } from 'react';
import { Milk } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EntityCrudPage from '@/components/EntityCrudPage';

const fields = [
  { key: 'date', label: 'Date', type: 'date', required: true },
  { key: 'cattle_tag', label: 'Cattle Tag', type: 'text' },
  { key: 'session', label: 'Session', type: 'select', options: ['Morning', 'Afternoon', 'Evening'], required: true },
  { key: 'quantity_liters', label: 'Quantity (L)', type: 'number', required: true },
  { key: 'milk_used_by_calves', label: 'Used by Calves (L)', type: 'number' },
  { key: 'fat_percentage', label: 'Fat %', type: 'number' },
  { key: 'protein_percentage', label: 'Protein %', type: 'number' },
  { key: 'quality_grade', label: 'Quality Grade', type: 'select', options: ['A', 'B', 'C'], default: 'A' },
  { key: 'notes', label: 'Notes', type: 'textarea', colSpan: 2 },
];

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'cattle_tag', label: 'Cattle' },
  { key: 'session', label: 'Session' },
  { key: 'quantity_liters', label: 'Liters' },
  { key: 'quality_grade', label: 'Grade' },
];

export default function MilkProduction() {
  const [rows, setRows] = useState([]);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows.filter((r) => r.date === today).reduce((s, r) => s + (Number(r.quantity_liters) || 0), 0);
  }, [rows]);

  return (
    <div className="space-y-5">
      <Card className="max-w-xs">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Today's Total Yield</CardTitle></CardHeader>
        <CardContent><p className="text-3xl font-semibold">{todayTotal.toFixed(1)} L</p></CardContent>
      </Card>
      <EntityCrudPage
        entityName="MilkProduction"
        title="Milk Production"
        description="Record daily milking sessions."
        icon={Milk}
        columns={columns}
        fields={fields}
        searchKeys={['cattle_tag', 'session']}
        onRowsLoaded={setRows}
      />
    </div>
  );
}
