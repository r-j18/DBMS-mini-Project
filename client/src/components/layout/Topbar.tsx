import React, { useState } from 'react';
import {
  Search,
  Terminal,
  Sun,
  Moon,
  Zap,
  ZapOff,
  User,
  LogOut,
  KeyRound,
  Menu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stamp } from '../common/Stamp';

interface TopbarProps {
  onOpenSearch: () => void;
  title: string;
  isLoading?: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
  isMobile: boolean;
  onOpenMobileMenu: () => void;
  hamburgerRef: React.RefObject<HTMLButtonElement>;
  onOpenChangePassword?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSearch,
  title,
  darkMode,
  toggleDarkMode,
  reduceMotion,
  toggleReduceMotion,
  isMobile,
  onOpenMobileMenu,
  hamburgerRef,
  onOpenChangePassword,
}) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="relative shrink-0 select-none z-20">
      <header className="h-14 px-3 sm:px-6 bg-[#1F2D3D] text-[#EFE9DC] border-b border-[#141D27] flex items-center justify-between shadow-sm gap-2">
        {/* Left Side: Mobile Hamburger + App Badge/Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Hamburger Button on Mobile */}
          {isMobile && (
            <button
              ref={hamburgerRef}
              onClick={onOpenMobileMenu}
              className="w-11 h-11 flex items-center justify-center text-[#EFE9DC] hover:bg-[#26374A] rounded-xs transition-colors shrink-0 -ml-1"
              aria-label="Open main navigation menu"
              aria-expanded={false}
              aria-controls="mobile-navigation-drawer"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="h-4 w-1 bg-[#B08D3C] rounded-xs shrink-0 hidden sm:block" />

          {/* Title (Truncated on narrow viewports) */}
          <h1 className="font-typewriter text-xs sm:text-sm font-bold tracking-wider text-[#F6F0E0] uppercase truncate">
            {title}
          </h1>
        </div>

        {/* Right Side: Global Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Global Search Button */}
          {/* Mobile: 44px tap target icon button */}
          {/* Desktop/Tablet: Search bar */}
          <button
            onClick={onOpenSearch}
            className="flex items-center justify-center sm:justify-start gap-2 h-11 sm:h-8 w-11 sm:w-56 px-0 sm:px-3 bg-[#141D27] border border-[#2B3D52] hover:border-[#B08D3C] rounded-xs text-xs text-[#8C9AA8] hover:text-[#EFE9DC] transition-colors"
            title="Search index (Ctrl+K)"
            aria-label="Search index"
          >
            <Search size={14} className="shrink-0 text-[#B08D3C]" />
            <span className="hidden sm:inline flex-1 text-left font-typewriter text-[11px] truncate">
              Index Search...
            </span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-[#1F2D3D] border border-[#2B3D52] rounded-xs text-[#8C9AA8]">
              Ctrl K
            </kbd>
          </button>

          {/* Quick SQL Console Link (Admin, hidden on mobile to conserve space) */}
          {role === 'admin' && (
            <button
              onClick={() => navigate('/queries')}
              className="hidden lg:flex h-8 px-2.5 items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#26374A] hover:bg-[#2B3D52] border border-[#2B3D52] rounded-xs text-[#EFE9DC] transition-colors"
              title="Open Direct SQL Console"
            >
              <Terminal size={13} className="text-[#B08D3C]" />
              <span>SQL CONSOLE</span>
            </button>
          )}

          {/* Reduce Motion Manual Toggle (Desktop & Tablet only; on mobile moves into user menu) */}
          <button
            onClick={toggleReduceMotion}
            className={`hidden md:flex h-8 px-2 items-center gap-1 rounded-xs border transition-colors text-[11px] font-typewriter ${
              reduceMotion
                ? 'bg-[#B08D3C] text-[#1F1F1F] border-[#B08D3C] font-bold'
                : 'bg-[#141D27] text-[#8C9AA8] border-[#2B3D52] hover:text-[#EFE9DC]'
            }`}
            title={reduceMotion ? 'Reduce Motion is Active' : 'Enable Reduced Motion'}
            aria-label="Toggle reduced motion"
          >
            {reduceMotion ? <ZapOff size={13} /> : <Zap size={13} />}
            <span className="hidden lg:inline">{reduceMotion ? 'STATIC' : 'MOTION'}</span>
          </button>

          {/* Dark / Light Toggle (Desktop & Tablet only; on mobile moves into user menu) */}
          <button
            onClick={toggleDarkMode}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-xs bg-[#141D27] border border-[#2B3D52] text-[#8C9AA8] hover:text-[#EFE9DC] hover:border-[#B08D3C] transition-colors"
            title={darkMode ? 'Switch to Light Manila Theme' : 'Switch to Dark Charcoal Theme'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={14} className="text-[#B08D3C]" /> : <Moon size={14} />}
          </button>

          {/* User Menu Trigger Button */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 h-11 sm:h-8 px-2 sm:px-2.5 bg-[#141D27] border border-[#2B3D52] hover:border-[#B08D3C] rounded-xs transition-colors"
                aria-label="User account menu"
                aria-expanded={showUserMenu}
              >
                <div className="w-5 h-5 rounded-full bg-[#26374A] flex items-center justify-center text-[#B08D3C]">
                  <User size={13} />
                </div>
                <span className="hidden sm:inline font-typewriter text-[11px] font-bold text-[#EFE9DC] max-w-[90px] truncate">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[#F6F0E0] dark:bg-[#1A1C20] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs shadow-2xl z-50 py-1 text-[#1F1F1F] dark:text-[#E2DFD8]">
                    <div className="px-3 py-2.5 border-b border-[#D9D0BE] dark:border-[#2E323B] flex justify-between items-start">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-xs truncate">{user.fullName}</div>
                        <div className="font-mono text-[10px] text-[#7A7A7A] truncate">
                          @{user.username}
                        </div>
                      </div>
                      <div className="shrink-0 scale-75 origin-top-right">
                        <Stamp
                          text={role === 'admin' ? 'ADMIN' : 'VIEWER'}
                          size="sm"
                          variant={role === 'admin' ? 'classified' : 'open'}
                        />
                      </div>
                    </div>

                    {/* On Mobile: Theme & Reduce Motion Toggles inside Menu */}
                    <div className="block md:hidden px-3 py-2 border-b border-[#D9D0BE] dark:border-[#2E323B] space-y-1">
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between py-2 text-xs font-typewriter text-[#1F1F1F] dark:text-[#E2DFD8]"
                      >
                        <span className="flex items-center gap-2">
                          {darkMode ? <Sun size={14} className="text-[#B08D3C]" /> : <Moon size={14} />}
                          Theme
                        </span>
                        <span className="font-mono text-[11px] text-[#7A7A7A]">
                          {darkMode ? 'DARK' : 'LIGHT'}
                        </span>
                      </button>

                      <button
                        onClick={toggleReduceMotion}
                        className="w-full flex items-center justify-between py-2 text-xs font-typewriter text-[#1F1F1F] dark:text-[#E2DFD8]"
                      >
                        <span className="flex items-center gap-2">
                          {reduceMotion ? <ZapOff size={14} className="text-[#B08D3C]" /> : <Zap size={14} />}
                          Animations
                        </span>
                        <span className="font-mono text-[11px] text-[#7A7A7A]">
                          {reduceMotion ? 'STATIC' : 'MOTION'}
                        </span>
                      </button>
                    </div>

                    {/* Account Actions */}
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenChangePassword?.();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-typewriter hover:bg-[#EFE9DC] dark:hover:bg-[#252830] transition-colors rounded-xs text-left"
                      >
                        <KeyRound size={13} className="text-[#B08D3C]" />
                        <span>Change Password</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-typewriter text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors rounded-xs text-left"
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
};
