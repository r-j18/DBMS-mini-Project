import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/layout/Layout';

import { DashboardPage } from './pages/DashboardPage';
import { CriminalsPage } from './pages/CriminalsPage';
import { CriminalDetailPage } from './pages/CriminalDetailPage';
import { PolicePage } from './pages/PolicePage';
import { PoliceDetailPage } from './pages/PoliceDetailPage';
import { CourtRecordsPage } from './pages/CourtRecordsPage';
import { JailPage } from './pages/JailPage';
import { QueryExplorerPage } from './pages/QueryExplorerPage';
import { SchemaPage } from './pages/SchemaPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="criminals" element={<CriminalsPage />} />
            <Route path="criminals/:id" element={<CriminalDetailPage />} />
            <Route path="police" element={<PolicePage />} />
            <Route path="police/:id" element={<PoliceDetailPage />} />
            <Route path="court-records" element={<CourtRecordsPage />} />
            <Route path="jail" element={<JailPage />} />
            <Route path="queries" element={<QueryExplorerPage />} />
            <Route path="schema" element={<SchemaPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
