import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/permissions';
import Layout from './Layout';
import AccessDenied from '@/components/AccessDenied';
import Login from './pages/Login';
import ProcessScheduledFeeds from '@/components/shared/ProcessScheduledFeeds';

import Dashboard from './pages/Dashboard';
import Cattle from './pages/Cattle';
import MilkProduction from './pages/MilkProduction';
import HealthRecords from './pages/HealthRecords';
import Breeding from './pages/Breeding';
import Inventory from './pages/Inventory';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Settings from './pages/Settings';

const PAGES = {
  Dashboard, Cattle, MilkProduction, HealthRecords, Breeding,
  Inventory, Tasks, Finance, Vendors, Reports, PredictiveAnalytics, Settings,
};

function PageGate({ name, children }) {
  const { user } = useAuth();
  const role = user?.role || 'staff';
  if (!canAccessPage(name, role)) {
    return <Layout currentPageName={name}><AccessDenied /></Layout>;
  }
  return <Layout currentPageName={name}>{children}</Layout>;
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
      <ProcessScheduledFeeds />
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/Dashboard" replace />} />
        {Object.entries(PAGES).map(([name, Page]) => (
          <Route
            key={name}
            path={`/${name}`}
            element={<PageGate name={name}><Page /></PageGate>}
          />
        ))}
        <Route path="*" element={<Navigate to="/Dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
