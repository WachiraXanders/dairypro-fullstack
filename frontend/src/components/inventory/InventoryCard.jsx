import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, TrendingDown, ArrowUpDown, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const categoryColors = {
  Feed: "bg-amber-100 text-amber-700 border-amber-200",
  Medicine: "bg-rose-100 text-rose-700 border-rose-200",
  Supplement: "bg-purple-100 text-purple-700 border-purple-200",
  Equipment: "bg-blue-100 text-blue-700 border-blue-200",
  Supplies: "bg-slate-100 text-slate-700 border-slate-200",
  Other: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function InventoryCard({ item, onEdit, onDelete, onAdjust }) {
  const stockPercentage = (item.total_quantity_kg / item.reorder_level) * 100;
  const isLowStock = item.total_quantity_kg <= item.reorder_level;
  const isCritical = item.total_quantity_kg <= item.reorder_level * 0.5;

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 group",
      isCritical ? "border-rose-300 bg-rose-50/30" : isLowStock ? "border-amber-300 bg-amber-50/30" : "border-slate-100 hover:shadow-md"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800">{item.name}</h3>
          </div>
          <Badge variant="outline" className={cn("mt-2 text-xs border", categoryColors[item.category])}>
            {item.category}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAdjust(item)}>
              <ArrowUpDown className="w-4 h-4 mr-2" /> Stock Adjustment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item)} className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-end justify-between mb-1">
            <span className="text-sm text-slate-500">Current Stock</span>
            {isLowStock && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <TrendingDown className="w-3 h-3" />
                <span>Low Stock</span>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold",
              isCritical ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-600"
            )}>
              {item.total_quantity_kg}
            </span>
            <span className="text-slate-500">kg</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {item.package_quantity} {item.package_unit} × {item.kg_per_package}kg
          </p>
          <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all",
                isCritical ? "bg-rose-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
          <div>
            <p className="text-slate-500">Reorder at</p>
            <p className="font-medium text-slate-700">{item.reorder_level} kg</p>
          </div>
          {item.cost_per_kg && (
            <div className="text-right">
              <p className="text-slate-500">Cost per Kg</p>
              <p className="font-medium text-slate-700">Kshs {item.cost_per_kg}</p>
            </div>
          )}
        </div>

        {item.location && (
          <p className="text-xs text-slate-500">📍 {item.location}</p>
        )}
      </div>
    </div>
  );
}
