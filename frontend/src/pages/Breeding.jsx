import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Users2, Pencil, Trash2, Loader2, Baby, BarChart3, CalendarDays, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import BreedingRecordForm from '@/components/breeding/BreedingRecordForm';
import BreedingAnalytics from '@/components/breeding/BreedingAnalytics';
import CalvingHeatmapCalendar from '@/components/breeding/CalvingHeatmapCalendar';
import CattleForm from '@/components/cattle/CattleForm';

const OUTCOME_COLORS = {
  Pending: 'bg-slate-100 text-slate-700',
  Successful: 'bg-emerald-100 text-emerald-700',
  Stillborn: 'bg-red-100 text-red-700',
  Assisted: 'bg-amber-100 text-amber-700',
  'C-Section': 'bg-purple-100 text-purple-700',
};

function generateNextTag(cattle) {
  const numericTags = cattle.map((c) => parseInt(c.tag_number, 10)).filter((n) => !isNaN(n));
  const max = numericTags.length > 0 ? Math.max(...numericTags) : 0;
  return String(max + 1).padStart(3, '0');
}

export default function Breeding() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('records');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [calfRegOpen, setCalfRegOpen] = useState(false);
  const [calfDefaults, setCalfDefaults] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['BreedingRecord'],
    queryFn: () => entities.BreedingRecord.list('-breeding_date', 1000),
  });
  const { data: cattle = [] } = useQuery({ queryKey: ['Cattle'], queryFn: () => entities.Cattle.list() });

  // --- Auto-lactation on create (new record created already successful) ---
  const createMutation = useMutation({
    mutationFn: async (data) => {
      await entities.BreedingRecord.create(data);
      if (data.calving_outcome === 'Successful' && data.actual_calving_date && data.cattle_id) {
        const currentCattle = cattle.find((c) => c.id === data.cattle_id);
        if (currentCattle) {
          const newLactation = (currentCattle.lactation_number || 0) + 1;
          await entities.Cattle.update(data.cattle_id, { lactation_number: newLactation, status: 'Active' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['BreedingRecord'] });
      queryClient.invalidateQueries({ queryKey: ['Cattle'] });
      setFormOpen(false);
      toast.success('Breeding record added');
    },
  });

  // --- Auto-lactation + auto-calf-registration on update (calving newly marked successful) ---
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const previousRecord = records.find((r) => r.id === id);
      await entities.BreedingRecord.update(id, data);

      const isNewSuccessfulCalving =
        data.calving_outcome === 'Successful' &&
        data.actual_calving_date &&
        data.cattle_id &&
        previousRecord?.calving_outcome !== 'Successful';

      if (isNewSuccessfulCalving) {
        const mother = cattle.find((c) => c.id === data.cattle_id);
        if (mother) {
          const newLactation = (mother.lactation_number || 0) + 1;
          await entities.Cattle.update(data.cattle_id, {
            lactation_number: newLactation,
            status: 'Active',
            stage: 'Mature Cow',
          });
        }
        return { isNewSuccessfulCalving: true, data, motherId: data.cattle_id };
      }
      return { isNewSuccessfulCalving: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['BreedingRecord'] });
      queryClient.invalidateQueries({ queryKey: ['Cattle'] });
      setFormOpen(false);
      setEditing(null);

      if (result?.isNewSuccessfulCalving) {
        toast.success('Breeding record updated — cow promoted to Mature Cow');
        const mother = cattle.find((c) => c.id === result.motherId);
        const nextTag = generateNextTag(cattle);
        setCalfDefaults({
          tag_number: nextTag,
          date_of_birth: result.data.actual_calving_date,
          acquisition_date: result.data.actual_calving_date,
          acquisition_type: 'Born on Farm',
          gender: result.data.calf_gender === 'Male' ? 'Male' : 'Female',
          breed: mother?.breed || 'Holstein',
          dam_id: mother?.tag_number || '',
          sire_id: result.data.sire_info || '',
          status: 'Active',
          stage: 'Calf',
        });
        setCalfRegOpen(true);
      } else {
        toast.success('Breeding record updated');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.BreedingRecord.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['BreedingRecord'] }); setDeleteTarget(null); toast.success('Record deleted'); },
  });

  const registerCalfMutation = useMutation({
    mutationFn: (data) => entities.Cattle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Cattle'] });
      setCalfRegOpen(false);
      setCalfDefaults(null);
      toast.success('Calf registered');
    },
  });

  const cattleById = Object.fromEntries(cattle.map((c) => [c.id, c]));

  const stats = useMemo(() => {
    const confirmed = records.filter((r) => r.pregnancy_status === 'Confirmed').length;
    const pending = records.filter((r) => r.pregnancy_status === 'Pending').length;
    const successfulCalvings = records.filter((r) => r.calving_outcome === 'Successful').length;
    return { confirmed, pending, successfulCalvings };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.cattle_tag?.toLowerCase().includes(search.toLowerCase()) ||
        r.sire_info?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.pregnancy_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const TABS = [
    { key: 'records', label: 'Records', icon: Baby },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'heatmap', label: 'Calving Map', icon: CalendarDays },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Users2 className="w-6 h-6 text-emerald-600" /> Breeding
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track breeding events, pregnancy status, and calving.</p>
        </div>
        {activeTab === 'records' && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Breeding Record
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Confirmed Pregnant</p><p className="text-xl font-semibold text-emerald-700">{stats.confirmed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Pending Checks</p><p className="text-xl font-semibold text-amber-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Successful Calvings</p><p className="text-xl font-semibold text-purple-700">{stats.successfulCalvings}</p></CardContent></Card>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === key ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && <BreedingAnalytics records={records} />}
      {activeTab === 'heatmap' && <CalvingHeatmapCalendar breedingRecords={records} cattle={cattle} />}

      {activeTab === 'records' && (
        <>
          <div className="flex flex-wrap gap-2">
            <div className="relative max-w-xs flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <Input className="pl-8" placeholder="Search by tag or sire..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pregnancy Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Not Pregnant">Not Pregnant</SelectItem>
                <SelectItem value="Aborted">Aborted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : filteredRecords.length === 0 ? (
                <p className="text-center py-16 text-slate-400 text-sm">No breeding records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cow</TableHead>
                        <TableHead>Breeding Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Pregnancy</TableHead>
                        <TableHead>Expected Calving</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((r) => {
                        const cow = cattleById[r.cattle_id];
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{r.cattle_tag || cow?.tag_number} {cow?.name ? `— ${cow.name}` : ''}</TableCell>
                            <TableCell>{r.breeding_date}</TableCell>
                            <TableCell>{r.breeding_type}</TableCell>
                            <TableCell>{r.pregnancy_status}</TableCell>
                            <TableCell>{r.expected_calving_date || '—'}</TableCell>
                            <TableCell><Badge className={OUTCOME_COLORS[r.calving_outcome] || ''}>{r.calving_outcome}</Badge></TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <BreedingRecordForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        record={editing}
        cattle={cattle}
        onSubmit={(data) => editing ? updateMutation.mutate({ id: editing.id, data }) : createMutation.mutate(data)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <CattleForm
        open={calfRegOpen}
        onOpenChange={(open) => { setCalfRegOpen(open); if (!open) setCalfDefaults(null); }}
        cattleRecord={null}
        defaultValues={calfDefaults}
        onSubmit={(data) => registerCalfMutation.mutate(data)}
        isLoading={registerCalfMutation.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteTarget.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
