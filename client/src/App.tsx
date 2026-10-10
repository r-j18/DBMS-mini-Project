import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Route-level code splitting with React.lazy
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CaseBoardPage = lazy(() => import('./pages/CaseBoardPage').then(m => ({ default: m.CaseBoardPage })));
const CriminalsPage = lazy(() => import('./pages/CriminalsPage').then(m => ({ default: m.CriminalsPage })));
const CriminalDetailPage = lazy(() => import('./pages/CriminalDetailPage').then(m => ({ default: m.CriminalDetailPage })));
const PolicePage = lazy(() => import('./pages/PolicePage').then(m => ({ default: m.PolicePage })));
const PoliceDetailPage = lazy(() => import('./pages/PoliceDetailPage').then(m => ({ default: m.PoliceDetailPage })));
const CourtRecordsPage = lazy(() => import('./pages/CourtRecordsPage').then(m => ({ default: m.CourtRecordsPage })));
const JailPage = lazy(() => import('./pages/JailPage').then(m => ({ default: m.JailPage })));
const QueryExplorerPage = lazy(() => import('./pages/QueryExplorerPage').then(m => ({ default: m.QueryExplorerPage })));
const SchemaPage = lazy(() => import('./pages/SchemaPage').then(m => ({ default: m.SchemaPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage').then(m => ({ default: m.AuditLogPage })));

const RouteLoadingFallback: React.FC = () => (
  <div className="w-full h-full min-h-[40vh] flex flex-col items-center justify-center p-6 space-y-3">
    <div className="w-48 police-light-bar rounded-xs overflow-hidden" />
    <span className="font-typewriter text-xs text-[#7A7A7A] animate-pulse">
      Accessing bureau archives...
    </span>
  </div>
);

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="board" element={<CaseBoardPage />} />
                <Route path="criminals" element={<CriminalsPage />} />
                <Route path="criminals/:id" element={<CriminalDetailPage />} />
                <Route path="police" element={<PolicePage />} />
                <Route path="police/:id" element={<PoliceDetailPage />} />
                <Route path="court-records" element={<CourtRecordsPage />} />
                <Route path="jail" element={<JailPage />} />
                <Route path="queries" element={<QueryExplorerPage />} />
                <Route path="schema" element={<SchemaPage />} />
                
                <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
                <Route path="audit-log" element={<ProtectedRoute adminOnly><AuditLogPage /></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
