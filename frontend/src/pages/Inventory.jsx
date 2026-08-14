import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Warehouse, ShoppingCart, History, ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import InventoryCard from '@/components/inventory/InventoryCard';
import InventoryForm from '@/components/inventory/InventoryForm';
import StockAdjustmentForm from '@/components/inventory/StockAdjustmentForm';
import ConsumptionLogForm from '@/components/inventory/ConsumptionLogForm';
import ConsumptionHistoryTab from '@/components/inventory/ConsumptionHistoryTab';
import ShoppingListPanel from '@/components/inventory/ShoppingListPanel';
import FeedingLogDialog from '@/components/inventory/FeedingLogDialog';
import FeedingSchedulesTab from '@/components/inventory/FeedingSchedulesTab';

export default function Inventory() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [consumptionOpen, setConsumptionOpen] = useState(false);
  const [feedingLogOpen, setFeedingLogOpen] = useState(false);

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['Inventory'],
    queryFn: () => entities.Inventory.list('-created_date', 500),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['CattleGroup'],
    queryFn: () => entities.CattleGroup.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => entities.Inventory.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['Inventory'] }); setFormOpen(false); toast.success('Item added'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities.Inventory.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['Inventory'] }); setFormOpen(false); setEditingItem(null); toast.success('Item updated'); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Inventory.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['Inventory'] }); setDeleteTarget(null); toast.success('Item deleted'); },
  });

  const adjustMutation = useMutation({
    mutationFn: async (data) => {
      await entities.StockAdjustment.create(data);
      return entities.Inventory.update(data.inventory_id, { total_quantity_kg: data.new_quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      setAdjustTarget(null);
      toast.success('Stock adjustment recorded');
    },
  });

  const consumptionMutation = useMutation({
    mutationFn: async (data) => {
      await entities.ConsumptionRecord.create(data);
      return entities.Inventory.update(data.inventory_id, { total_quantity_kg: data.stock_after_kg });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Inventory'] });
      queryClient.invalidateQueries({ queryKey: ['consumptionRecords'] });
      setConsumptionOpen(false);
      toast.success('Consumption logged');
    },
  });

  const handleFormSubmit = (data) => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-600" /> Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">Feed, medicine, and supply stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFeedingLogOpen(true)}>
            <ClipboardList className="w-4 h-4 mr-1.5" /> Quick Feed Log
          </Button>
          <Button variant="outline" onClick={() => setConsumptionOpen(true)}>
            <History className="w-4 h-4 mr-1.5" /> Log Consumption
          </Button>
          <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Warehouse className="w-4 h-4 mr-1.5" /> Items</TabsTrigger>
          <TabsTrigger value="shopping"><ShoppingCart className="w-4 h-4 mr-1.5" /> Shopping List</TabsTrigger>
          <TabsTrigger value="consumption"><History className="w-4 h-4 mr-1.5" /> Consumption History</TabsTrigger>
          <TabsTrigger value="schedules"><ClipboardList className="w-4 h-4 mr-1.5" /> Feeding Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : inventory.length === 0 ? (
            <p className="text-center py-16 text-slate-400 text-sm">No inventory items yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((item) => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onEdit={(it) => { setEditingItem(it); setFormOpen(true); }}
                  onDelete={(it) => setDeleteTarget(it)}
                  onAdjust={(it) => setAdjustTarget(it)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shopping" className="pt-4">
          <ShoppingListPanel inventory={inventory} />
        </TabsContent>

        <TabsContent value="consumption" className="pt-4">
          <ConsumptionHistoryTab inventory={inventory} />
        </TabsContent>

        <TabsContent value="schedules" className="pt-4">
          <FeedingSchedulesTab />
        </TabsContent>
      </Tabs>

      <InventoryForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingItem(null); }}
        item={editingItem}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <StockAdjustmentForm
        open={!!adjustTarget}
        onOpenChange={(open) => !open && setAdjustTarget(null)}
        item={adjustTarget}
        onSubmit={(data) => adjustMutation.mutate(data)}
        isLoading={adjustMutation.isPending}
      />

      <ConsumptionLogForm
        open={consumptionOpen}
        onOpenChange={setConsumptionOpen}
        inventory={inventory}
        groups={groups}
        onSubmit={(data) => consumptionMutation.mutate(data)}
        isLoading={consumptionMutation.isPending}
      />

      <FeedingLogDialog open={feedingLogOpen} onOpenChange={setFeedingLogOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
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
