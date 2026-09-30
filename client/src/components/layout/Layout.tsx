import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from '../search/GlobalSearchModal';

const routeTitles: Record<string, string> = {
  '/': 'Central Bureau Case Dashboard',
  '/board': 'Investigation Case Board (Incident Net)',
  '/criminals': 'Criminal Records & Identification Dossier',
  '/police': 'Investigating Officers Service Roster',
  '/court-records': 'Judicial Court Room Docket',
  '/jail': 'Correctional Detention & Sentencing Log',
  '/queries': 'SQL Query Explorer & Evaluation Console',
  '/schema': 'Relational Architecture & Entity Model',
};

export const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('crm_theme') === 'dark';
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem('crm_reduce_motion') === 'true';
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

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
      localStorage.setItem('crm_reduce_motion', 'true');
    } else {
      document.documentElement.classList.remove('reduce-motion');
      localStorage.setItem('crm_reduce_motion', 'false');
    }
  }, [reduceMotion]);

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
  const toggleReduceMotion = () => setReduceMotion((prev) => !prev);

  let currentTitle = routeTitles[location.pathname] || 'Criminal Records Bureau';
  if (location.pathname.startsWith('/criminals/')) {
    currentTitle = 'CONFIDENTIAL • Offender Dossier File';
  } else if (location.pathname.startsWith('/police/')) {
    currentTitle = 'Investigating Officer Service Record';
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EFE9DC] dark:bg-[#16181C] text-[#1F1F1F] dark:text-[#E2DFD8] paper-noise select-text">
      {/* Fixed Left Sidebar */}
      <Sidebar
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        reduceMotion={reduceMotion}
        toggleReduceMotion={toggleReduceMotion}
      />

      {/* Main Bureau Content Window */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Topbar
          onOpenSearch={() => setIsSearchOpen(true)}
          title={currentTitle}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          reduceMotion={reduceMotion}
          toggleReduceMotion={toggleReduceMotion}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-5 relative">
          {/* Faint Fingerprint Watermark in bottom corner (5% opacity inline SVG) */}
          <div className="fixed bottom-3 right-5 pointer-events-none opacity-[0.04] dark:opacity-[0.03] z-0 select-none">
            <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 2a10 10 0 0 0-10 10c0 3.3 1.6 6.2 4.1 8" />
              <path d="M12 6a6 6 0 0 0-6 6c0 2 1 3.8 2.5 5" />
              <path d="M12 10a2 2 0 0 0-2 2c0 .8.4 1.5 1 2" />
              <path d="M12 14c-.6 0-1-.4-1-1" />
              <path d="M12 18c-2 0-3.8-1-5-2.5" />
              <path d="M15.5 17c1.5-1.2 2.5-3 2.5-5a6 6 0 0 0-6-6" />
              <path d="M17.9 20c2.5-1.8 4.1-4.7 4.1-8a10 10 0 0 0-10-10" />
            </svg>
          </div>

          <div className="max-w-[1280px] mx-auto w-full pb-14 relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bureau Formal Form Footer */}
          <div className="max-w-[1280px] mx-auto w-full mt-8 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B] flex flex-col sm:flex-row items-center justify-between text-[10px] font-typewriter text-[#7A7A7A] dark:text-[#8C9AA8] select-none">
            <span>OFFICIAL DOCUMENT • CRIMINAL RECORDS BUREAU • ARCHIVAL SYSTEM</span>
            <span className="font-mono">FORM CRB-01 • REF 2026/REV-B</span>
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
