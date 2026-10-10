import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { DashboardPage } from './pages/DashboardPage';
import { CaseBoardPage } from './pages/CaseBoardPage';
import { CriminalsPage } from './pages/CriminalsPage';
import { CriminalDetailPage } from './pages/CriminalDetailPage';
import { PolicePage } from './pages/PolicePage';
import { PoliceDetailPage } from './pages/PoliceDetailPage';
import { CourtRecordsPage } from './pages/CourtRecordsPage';
import { JailPage } from './pages/JailPage';
import { QueryExplorerPage } from './pages/QueryExplorerPage';
import { SchemaPage } from './pages/SchemaPage';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogPage } from './pages/AuditLogPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
