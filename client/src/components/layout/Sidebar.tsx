import React, { useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Gavel,
  Lock,
  Code2,
  Database,
  Pin,
  UserCog,
  FileClock,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LogOut,
  KeyRound,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Stamp } from '../common/Stamp';

interface SidebarProps {
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  desktopExpanded: boolean;
  onToggleDesktop: () => void;
  tabletExpandedOverlay: boolean;
  onToggleTablet: () => void;
  onCloseTablet: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  hamburgerButtonRef: React.RefObject<HTMLButtonElement>;
  reduceMotion: boolean;
  onOpenChangePassword?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDesktop,
  isTablet,
  isMobile,
  desktopExpanded,
  onToggleDesktop,
  tabletExpandedOverlay,
  onToggleTablet,
  onCloseTablet,
  mobileOpen,
  onCloseMobile,
  hamburgerButtonRef,
  reduceMotion,
  onOpenChangePassword,
}) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  const navItems = [
    { to: '/', label: 'DASHBOARD', tabCode: 'IDX-01', icon: LayoutDashboard },
    { to: '/board', label: 'CASE BOARD', tabCode: 'INV-BD', icon: Pin },
    { to: '/criminals', label: 'CRIMINALS', tabCode: 'REG-CR', icon: Users },
    { to: '/police', label: 'POLICE ROSTER', tabCode: 'OFF-RO', icon: Shield },
    { to: '/court-records', label: 'COURT DOCKET', tabCode: 'DOC-CT', icon: Gavel },
    { to: '/jail', label: 'JAIL INMATES', tabCode: 'FAC-JL', icon: Lock },
    { to: '/queries', label: 'QUERY EXPLORER', tabCode: 'SQL-XP', icon: Code2 },
    { to: '/schema', label: 'DATA SCHEMA', tabCode: 'SCH-DB', icon: Database },
  ];

  if (role === 'admin') {
    navItems.push(
      { to: '/users', label: 'PERSONNEL', tabCode: 'ADM-US', icon: UserCog },
      { to: '/audit-log', label: 'AUDIT LOG', tabCode: 'ADM-AL', icon: FileClock }
    );
  }

  // Close overlays on location change
  useEffect(() => {
    if (mobileOpen) onCloseMobile();
    if (tabletExpandedOverlay) onCloseTablet();
  }, [location.pathname]);

  // Lock body scroll and trap focus when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside drawer
    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseMobile();
      } else if (e.key === 'Tab' && drawerRef.current) {
        const elements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to hamburger button
      hamburgerButtonRef.current?.focus();
    };
  }, [mobileOpen, onCloseMobile, hamburgerButtonRef]);

  // Escape key for tablet overlay
  useEffect(() => {
    if (!tabletExpandedOverlay) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseTablet();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabletExpandedOverlay, onCloseTablet]);

  // Touch swipe-left detection on mobile drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (deltaX < -50) {
      // Swiped left by more than 50px
      onCloseMobile();
    }
  };

  // Determine effective mode
  const isRail = (isDesktop && !desktopExpanded) || (isTablet && !tabletExpandedOverlay);

  // Common Nav Item renderer
  const renderNavItems = (collapsed: boolean, onItemClick?: () => void) => (
    <nav className="flex-1 p-2 space-y-1 overflow-y-auto" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onItemClick}
            className={({ isActive }) =>
              `group relative flex items-center ${
                collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
              } rounded-xs font-typewriter text-xs tracking-wider transition-colors duration-150 min-h-[44px] ${
                isActive
                  ? 'bg-[#F6F0E0] text-[#1F1F1F] font-bold shadow-paper border-l-4 border-[#B3261E]'
                  : 'text-[#C9D1D9] hover:bg-[#26374A] hover:text-[#FFFFFF] focus:bg-[#26374A] focus:text-[#FFFFFF]'
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
                  <Icon
                    size={17}
                    className={`shrink-0 ${
                      isActive ? 'text-[#B3261E]' : 'text-[#8C9AA8] group-hover:text-[#B08D3C]'
                    }`}
                    aria-hidden="true"
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <span
                    className={`font-mono text-[9px] px-1 py-0.5 rounded-xs shrink-0 ${
                      isActive
                        ? 'bg-[#E6DFCD] text-[#1F1F1F]'
                        : 'bg-[#141D27] text-[#8C9AA8]'
                    }`}
                  >
                    {item.tabCode}
                  </span>
                )}

                {/* Accessible Tooltip for Icon Rail */}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#141D27] text-[#F6F0E0] text-[11px] font-typewriter font-semibold rounded-xs shadow-xl opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 border border-[#2B3D52]"
                  >
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  // 1. MOBILE DRAWER (< 768px)
  if (isMobile) {
    if (!mobileOpen) return null;

    return (
      <div className="fixed inset-0 z-50 select-none" role="dialog" aria-modal="true" aria-label="Main navigation drawer">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-200 ${
            reduceMotion ? '' : 'animate-fadeIn'
          }`}
          onClick={onCloseMobile}
          aria-hidden="true"
        />

        {/* Off-canvas Drawer Sheet */}
        <div
          ref={drawerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`fixed inset-y-0 left-0 w-[min(85vw,320px)] bg-[#1F2D3D] text-[#EFE9DC] border-r-2 border-[#B08D3C] shadow-2xl flex flex-col z-50 ${
            reduceMotion ? '' : 'transition-transform duration-200 ease-out'
          }`}
        >
          {/* Mobile Drawer Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#141D27] bg-[#1A2533] pt-safe">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#B08D3C] text-[#1F2D3D] rounded-xs shadow-pin shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.14 8.79-7 9.88-3.86-1.09-7-5.34-7-9.88V6.29l7-3.11zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="font-typewriter text-xs font-bold tracking-wider text-[#F6F0E0]">
                  CRIMINAL RECORDS
                </div>
                <div className="font-typewriter text-[9px] text-[#B08D3C] uppercase tracking-widest font-semibold">
                  BUREAU • ARCHIVES
                </div>
              </div>
            </div>

            <button
              onClick={onCloseMobile}
              className="w-11 h-11 flex items-center justify-center rounded-xs text-[#8C9AA8] hover:text-[#F6F0E0] hover:bg-[#26374A] transition-colors"
              aria-label="Close navigation drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          {renderNavItems(false, onCloseMobile)}

          {/* Mobile Drawer Footer with Current User Profile & Actions */}
          {user && (
            <div className="p-3 border-t border-[#141D27] bg-[#17212D] space-y-2.5 pb-safe">
              <div className="p-2.5 bg-[#141D27] rounded-xs border border-[#2B3D52] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#26374A] flex items-center justify-center text-[#B08D3C] shrink-0">
                    <User size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-typewriter text-xs font-bold text-[#EFE9DC] truncate">
                      {user.fullName}
                    </div>
                    <div className="font-mono text-[10px] text-[#8C9AA8] truncate">
                      @{user.username}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 scale-90 origin-right">
                  <Stamp
                    text={role === 'admin' ? 'ADMIN' : 'VIEWER'}
                    size="sm"
                    variant={role === 'admin' ? 'classified' : 'open'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenChangePassword?.();
                  }}
                  className="h-11 px-2 flex items-center justify-center gap-1.5 font-typewriter text-[11px] font-semibold bg-[#26374A] hover:bg-[#2B3D52] rounded-xs text-[#EFE9DC] transition-colors border border-[#2B3D52]"
                >
                  <KeyRound size={13} className="text-[#B08D3C]" />
                  <span>PASSWORD</span>
                </button>

                <button
                  onClick={() => {
                    onCloseMobile();
                    logout();
                  }}
                  className="h-11 px-2 flex items-center justify-center gap-1.5 font-typewriter text-[11px] font-semibold bg-[#B3261E]/20 hover:bg-[#B3261E]/30 text-rose-300 rounded-xs transition-colors border border-[#B3261E]/40"
                >
                  <LogOut size={13} />
                  <span>SIGN OUT</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. TABLET OVERLAY (768 to 1023px)
  if (isTablet) {
    return (
      <>
        {/* Default Collapsed Rail in normal document flow (64px) */}
        <aside
          className="w-16 bg-[#1F2D3D] text-[#EFE9DC] border-r border-[#141D27] flex flex-col shrink-0 select-none z-20 shadow-md h-full"
          aria-label="Tablet navigation rail"
        >
          {/* Logo Badge Header */}
          <div className="h-14 flex items-center justify-center border-b border-[#141D27] bg-[#1A2533]">
            <div className="p-1.5 bg-[#B08D3C] text-[#1F2D3D] rounded-xs shadow-pin">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.14 8.79-7 9.88-3.86-1.09-7-5.34-7-9.88V6.29l7-3.11zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
              </svg>
            </div>
          </div>

          {/* Toggle Expand Overlay Button */}
          <div className="p-2 border-b border-[#141D27] flex justify-center">
            <button
              onClick={onToggleTablet}
              aria-expanded={tabletExpandedOverlay}
              aria-label="Expand sidebar overlay"
              className="w-11 h-11 flex items-center justify-center text-[#8C9AA8] hover:text-[#EFE9DC] hover:bg-[#26374A] rounded-xs transition-colors"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>

          {/* Rail Nav Items */}
          {renderNavItems(true)}
        </aside>

        {/* Expanded Overlay on Tablet (240px wide over content without reflow) */}
        {tabletExpandedOverlay && (
          <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Expanded navigation overlay">
            {/* Backdrop for click outside */}
            <div
              className="fixed inset-0 bg-black/40 transition-opacity duration-150"
              onClick={onCloseTablet}
              aria-hidden="true"
            />

            <div
              className={`fixed inset-y-0 left-0 w-60 bg-[#1F2D3D] text-[#EFE9DC] border-r border-[#141D27] shadow-2xl flex flex-col z-50 ${
                reduceMotion ? '' : 'transition-transform duration-200 ease-out'
              }`}
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-[#141D27] bg-[#1A2533]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#B08D3C] text-[#1F2D3D] rounded-xs shadow-pin shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.14 8.79-7 9.88-3.86-1.09-7-5.34-7-9.88V6.29l7-3.11zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
                    </svg>
                  </div>
                  <div className="font-typewriter text-xs font-bold tracking-wider text-[#F6F0E0]">
                    CRIMINAL RECORDS
                  </div>
                </div>

                <button
                  onClick={onCloseTablet}
                  className="w-10 h-10 flex items-center justify-center rounded-xs text-[#8C9AA8] hover:text-[#F6F0E0] hover:bg-[#26374A] transition-colors"
                  aria-label="Collapse sidebar overlay"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              {renderNavItems(false, onCloseTablet)}

              <div className="p-3 border-t border-[#141D27] bg-[#1A2533] text-center">
                <span className="text-[10px] font-typewriter text-[#8C9AA8]">
                  TAP OUTSIDE OR ESC TO CLOSE
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 3. DESKTOP (>= 1024px)
  return (
    <aside
      className={`${
        desktopExpanded ? 'w-60' : 'w-16'
      } bg-[#1F2D3D] text-[#EFE9DC] border-r border-[#141D27] flex flex-col shrink-0 select-none z-30 shadow-md h-full transition-[width] duration-200 ease-in-out`}
      aria-label="Bureau navigation"
    >
      {/* Brand Header */}
      <div
        className={`h-14 ${
          desktopExpanded ? 'px-4 justify-between' : 'justify-center'
        } flex items-center border-b border-[#141D27] bg-[#1A2533]`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 bg-[#B08D3C] text-[#1F2D3D] rounded-xs shadow-pin shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.14 8.79-7 9.88-3.86-1.09-7-5.34-7-9.88V6.29l7-3.11zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
            </svg>
          </div>
          {desktopExpanded && (
            <div className="leading-tight truncate">
              <div className="font-typewriter text-[13px] font-bold tracking-wider text-[#F6F0E0] truncate">
                CRIMINAL RECORDS
              </div>
              <div className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-widest font-semibold">
                BUREAU • ARCHIVES
              </div>
            </div>
          )}
        </div>

        {desktopExpanded && (
          <button
            onClick={onToggleDesktop}
            className="w-8 h-8 flex items-center justify-center text-[#8C9AA8] hover:text-[#EFE9DC] hover:bg-[#26374A] rounded-xs transition-colors shrink-0"
            aria-label="Collapse sidebar to icon rail"
            title="Collapse Sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Collapse/Expand Bar for Rail */}
      {!desktopExpanded && (
        <div className="p-2 border-b border-[#141D27] flex justify-center">
          <button
            onClick={onToggleDesktop}
            className="w-10 h-10 flex items-center justify-center text-[#8C9AA8] hover:text-[#EFE9DC] hover:bg-[#26374A] rounded-xs transition-colors"
            aria-label="Expand sidebar"
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      {/* Index Tab Subheader (only if expanded) */}
      {desktopExpanded && (
        <div className="px-4 py-2 bg-[#17212D] border-b border-[#141D27] flex items-center justify-between text-[10px] font-typewriter text-[#8C9AA8] tracking-widest uppercase">
          <span>FILING CABINET INDEX</span>
          <span className="font-mono">CAB-A</span>
        </div>
      )}

      {/* Nav Items */}
      {renderNavItems(!desktopExpanded)}

      {/* Bureau Seal Footer */}
      <div className="p-3 border-t border-[#141D27] bg-[#1A2533]">
        {desktopExpanded ? (
          <div className="space-y-2">
            <div className="px-2.5 py-1.5 bg-[#141D27] rounded-xs border border-[#26374A] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[#EFE9DC] text-[10px]">MYSQL 8.0</span>
              </div>
              <span className="font-typewriter text-[9px] text-[#B08D3C]">DB ACTIVE</span>
            </div>
            <div className="text-[10px] font-typewriter text-[#8C9AA8] text-center tracking-wider pt-0.5">
              RECORD ARCHIVE • DIV-09
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Database Active">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
