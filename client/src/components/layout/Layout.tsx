import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useResponsive } from '../../hooks/useResponsive';

const routeTitles: Record<string, string> = {
  '/': 'Central Bureau Case Dashboard',
  '/board': 'Investigation Case Board (Incident Net)',
  '/criminals': 'Criminal Records & Identification Dossier',
  '/police': 'Investigating Officers Service Roster',
  '/court-records': 'Judicial Court Room Docket',
  '/jail': 'Correctional Detention & Sentencing Log',
  '/queries': 'SQL Query Explorer & Evaluation Console',
  '/schema': 'Relational Architecture & Entity Model',
  '/users': 'Personnel Directory & Access Control',
  '/audit-log': 'System Security & Audit Journal',
};

export const Layout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Desktop sidebar expanded state with localStorage persistence
  const [desktopExpanded, setDesktopExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('crm_sidebar_desktop_expanded');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Tablet sidebar expanded overlay state
  const [tabletExpandedOverlay, setTabletExpandedOverlay] = useState<boolean>(false);

  // Mobile off-canvas drawer open state
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('crm_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [reduceMotion, setReduceMotion] = useState(() => {
    try {
      return localStorage.getItem('crm_reduce_motion') === 'true';
    } catch {
      return false;
    }
  });

  const location = useLocation();

  const handleToggleDesktop = () => {
    setDesktopExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('crm_sidebar_desktop_expanded', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('crm_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('crm_theme', 'light');
      }
    } catch {}
  }, [darkMode]);

  useEffect(() => {
    try {
      if (reduceMotion) {
        document.documentElement.classList.add('reduce-motion');
        localStorage.setItem('crm_reduce_motion', 'true');
      } else {
        document.documentElement.classList.remove('reduce-motion');
        localStorage.setItem('crm_reduce_motion', 'false');
      }
    } catch {}
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
    currentTitle = 'CONFIDENTIAL • Offender Dossier';
  } else if (location.pathname.startsWith('/police/')) {
    currentTitle = 'Investigating Officer Service Record';
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#EFE9DC] dark:bg-[#16181C] text-[#1F1F1F] dark:text-[#E2DFD8] paper-noise select-text">
      {/* Sidebar (Responsive across Mobile, Tablet, Desktop) */}
      <Sidebar
        isDesktop={isDesktop}
        isTablet={isTablet}
        isMobile={isMobile}
        desktopExpanded={desktopExpanded}
        onToggleDesktop={handleToggleDesktop}
        tabletExpandedOverlay={tabletExpandedOverlay}
        onToggleTablet={() => setTabletExpandedOverlay((prev) => !prev)}
        onCloseTablet={() => setTabletExpandedOverlay(false)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        hamburgerButtonRef={hamburgerRef}
        reduceMotion={reduceMotion}
        onOpenChangePassword={() => setShowPasswordModal(true)}
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
          isMobile={isMobile}
          onOpenMobileMenu={() => setMobileOpen(true)}
          hamburgerRef={hamburgerRef}
          onOpenChangePassword={() => setShowPasswordModal(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-5 relative w-full">
          {/* Faint Fingerprint Watermark in bottom corner (Desktop only) */}
          <div className="hidden lg:block fixed bottom-3 right-5 pointer-events-none opacity-[0.04] dark:opacity-[0.03] z-0 select-none">
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
                initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bureau Formal Form Footer */}
          <div className="max-w-[1280px] mx-auto w-full mt-6 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B] flex flex-col sm:flex-row items-center justify-between text-[10px] font-typewriter text-[#7A7A7A] dark:text-[#8C9AA8] select-none gap-1 pb-safe">
            <span className="text-center sm:text-left">OFFICIAL DOCUMENT • CRIMINAL RECORDS BUREAU • ARCHIVAL SYSTEM</span>
            <span className="font-mono">FORM CRB-01 • REF 2026/REV-B</span>
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};
