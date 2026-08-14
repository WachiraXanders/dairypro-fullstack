import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { entities } from '@/api';
import AIInsights from '@/components/analytics/AIInsights';
import MilkTrendForecast from '@/components/analytics/MilkTrendForecast';
import FinancialForecast from '@/components/finance/FinancialForecast';

export default function PredictiveAnalytics() {
  const { data: cattle = [] } = useQuery({ queryKey: ['Cattle'], queryFn: () => entities.Cattle.list() });
  const { data: milkRecords = [] } = useQuery({ queryKey: ['MilkProduction'], queryFn: () => entities.MilkProduction.list('-date', 5000) });
  const { data: healthRecords = [] } = useQuery({ queryKey: ['HealthRecord'], queryFn: () => entities.HealthRecord.list('-date', 2000) });
  const { data: breedingRecords = [] } = useQuery({ queryKey: ['BreedingRecord'], queryFn: () => entities.BreedingRecord.list('-breeding_date', 500) });
  const { data: transactions = [] } = useQuery({ queryKey: ['Transaction'], queryFn: () => entities.Transaction.list('-date', 5000) });
  const { data: milkPrices = [] } = useQuery({ queryKey: ['MilkPrice'], queryFn: () => entities.MilkPrice.list() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" /> Predictive Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">AI-assisted insights and forward-looking forecasts for your farm.</p>
      </div>

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai"><Sparkles className="w-4 h-4 mr-1.5" /> AI Insights</TabsTrigger>
          <TabsTrigger value="milk"><TrendingUp className="w-4 h-4 mr-1.5" /> Milk Forecast</TabsTrigger>
          <TabsTrigger value="financial"><DollarSign className="w-4 h-4 mr-1.5" /> Financial Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="pt-4">
          <AIInsights cattle={cattle} milkRecords={milkRecords} healthRecords={healthRecords} breedingRecords={breedingRecords} />
        </TabsContent>

        <TabsContent value="milk" className="pt-4">
          <MilkTrendForecast cattle={cattle} milkRecords={milkRecords} />
        </TabsContent>

        <TabsContent value="financial" className="pt-4">
          <FinancialForecast transactions={transactions} milkRecords={milkRecords} milkPrices={milkPrices} cattle={cattle} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
