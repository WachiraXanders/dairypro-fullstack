import React from 'react';
import { Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EntityCrudPage from '@/components/EntityCrudPage';
import { isCreditVendor } from '@/lib/vendorUtils';

const fields = [
  { key: 'name', label: 'Vendor Name', type: 'text', required: true },
  { key: 'category', label: 'Category', type: 'select', options: ['Feed Supplier', 'Medicine & Vet', 'Equipment', 'Services', 'Utilities', 'Other'], required: true },
  { key: 'contact_person', label: 'Contact Person', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'payment_terms', label: 'Payment Terms', type: 'select', options: ['Cash', 'Net 7', 'Net 14', 'Net 30', 'Net 60'], default: 'Cash' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], default: 'Active' },
  { key: 'address', label: 'Address', type: 'textarea', colSpan: 2 },
];

const columns = [
  { key: 'name', label: 'Vendor' },
  { key: 'category', label: 'Category' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status', render: (r) => <Badge className={r.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{r.status}</Badge> },
  {
    key: 'payment_terms', label: 'Terms',
    render: (r) => (
      <div className="flex items-center gap-1.5">
        <span>{r.payment_terms}</span>
        {isCreditVendor(r.payment_terms) && <Badge variant="outline" className="text-xs">Credit</Badge>}
      </div>
    ),
  },
];

export default function Vendors() {
  return (
    <EntityCrudPage
      entityName="Vendor"
      title="Vendor"
      description="Suppliers you buy feed, medicine, and services from."
      icon={Truck}
      columns={columns}
      fields={fields}
      searchKeys={['name', 'category', 'contact_person']}
    />
  );
}
