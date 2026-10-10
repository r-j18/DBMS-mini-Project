import React, { useState } from 'react';
import { Search, Terminal, Sun, Moon, Zap, ZapOff, User, LogOut, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Stamp } from '../common/Stamp';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface TopbarProps {
  onOpenSearch: () => void;
  title: string;
  isLoading?: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenSearch,
  title,
  isLoading = false,
  darkMode,
  toggleDarkMode,
  reduceMotion,
  toggleReduceMotion,
}) => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <div className="relative shrink-0 select-none">
      <header className="h-14 px-6 bg-[#1F2D3D] text-[#EFE9DC] border-b border-[#141D27] flex items-center justify-between shadow-sm">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 bg-[#B08D3C] rounded-xs" />
          <h1 className="font-typewriter text-xs sm:text-sm font-bold tracking-wider text-[#F6F0E0] uppercase">
            {title}
          </h1>
        </div>

        {/* Global Bureau Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 h-8 px-2.5 sm:px-3 bg-[#141D27] border border-[#2B3D52] hover:border-[#B08D3C] rounded-xs text-xs text-[#8C9AA8] hover:text-[#EFE9DC] transition-fast w-36 sm:w-60"
          >
            <Search size={13} className="shrink-0 text-[#B08D3C]" />
            <span className="flex-1 text-left font-typewriter text-[11px] truncate">
              Index Search...
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-[#1F2D3D] border border-[#2B3D52] rounded-xs text-[#8C9AA8]">
              Ctrl K
            </kbd>
          </button>

          {/* Quick SQL Console Link */}
          {role === 'admin' && (
            <button
              onClick={() => navigate('/queries')}
              className="h-8 px-2.5 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#26374A] hover:bg-[#2B3D52] border border-[#2B3D52] rounded-xs text-[#EFE9DC] transition-fast"
              title="Open Direct SQL Console"
            >
              <Terminal size={13} className="text-[#B08D3C]" />
              <span className="hidden md:inline">SQL CONSOLE</span>
            </button>
          )}

          {/* Reduce Motion Manual Toggle */}
          <button
            onClick={toggleReduceMotion}
            className={`h-8 px-2 flex items-center gap-1 rounded-xs border transition-fast text-[11px] font-typewriter ${
              reduceMotion
                ? 'bg-[#B08D3C] text-[#1F1F1F] border-[#B08D3C] font-bold'
                : 'bg-[#141D27] text-[#8C9AA8] border-[#2B3D52] hover:text-[#EFE9DC]'
            }`}
            title={reduceMotion ? 'Reduce Motion is Active' : 'Enable Reduced Motion'}
          >
            {reduceMotion ? <ZapOff size={13} /> : <Zap size={13} />}
            <span className="hidden lg:inline">{reduceMotion ? 'STATIC' : 'MOTION'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="h-8 w-8 flex items-center justify-center rounded-xs bg-[#141D27] border border-[#2B3D52] text-[#8C9AA8] hover:text-[#EFE9DC] hover:border-[#B08D3C] transition-fast"
            title={darkMode ? 'Switch to Light Manila Theme' : 'Switch to Dark Charcoal Theme'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={14} className="text-[#B08D3C]" /> : <Moon size={14} />}
          </button>
          
          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 h-8 px-2 bg-[#141D27] border border-[#2B3D52] hover:border-[#B08D3C] rounded-xs transition-fast"
              >
                <div className="w-5 h-5 rounded-full bg-[#26374A] flex items-center justify-center text-[#B08D3C]">
                  <User size={12} />
                </div>
                <span className="hidden sm:inline font-typewriter text-[11px] font-bold text-[#EFE9DC]">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-[#F6F0E0] dark:bg-[#1A1C20] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs shadow-xl z-50 py-1">
                  <div className="px-3 py-2 border-b border-[#D9D0BE] dark:border-[#2E323B] flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs text-[#1F1F1F] dark:text-[#E2DFD8] truncate">{user.fullName}</div>
                      <div className="font-mono text-[10px] text-[#7A7A7A] truncate">{user.username}</div>
                    </div>
                    <div className="scale-75 origin-top-right -mt-1">
                      <Stamp text={role === 'admin' ? 'ADMIN' : 'VIEWER'} size="sm" variant={role === 'admin' ? 'classified' : 'open'} />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-typewriter text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] flex items-center gap-2 transition-fast"
                  >
                    <KeyRound size={12} className="text-[#7A7A7A]" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-typewriter text-[#B3261E] hover:bg-[#EFE9DC] dark:hover:bg-[#252830] flex items-center gap-2 transition-fast"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Police Light Loading Bar (thin red/blue alternating) */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 police-light-bar" />
      )}
      
      {showPasswordModal && (
        <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};
