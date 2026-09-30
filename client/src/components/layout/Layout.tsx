import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from '../search/GlobalSearchModal';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard Overview',
  '/criminals': 'Criminal Records Registry',
  '/police': 'Police Officers Roster',
  '/court-records': 'Court Room Assignments',
  '/jail': 'Jail & Incarceration Records',
  '/queries': 'Query Explorer & SQL Console',
  '/schema': 'Database Schema & Architecture',
};

export const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('crm_theme') === 'dark';
  });

  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('crm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('crm_theme', 'light');
    }
  }, [darkMode]);

  // Global Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Compute title dynamically for detail pages
  let currentTitle = routeTitles[location.pathname] || 'Criminal Record Management System';
  if (location.pathname.startsWith('/criminals/')) {
    currentTitle = 'Criminal Dossier & Profile';
  } else if (location.pathname.startsWith('/police/')) {
    currentTitle = 'Investigating Officer Detail';
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Fixed Left Sidebar */}
      <Sidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar onOpenSearch={() => setIsSearchOpen(true)} title={currentTitle} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[1280px] mx-auto w-full pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
