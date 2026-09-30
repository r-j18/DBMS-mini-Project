import React from 'react';
import { Search, Terminal, Sun, Moon, Zap, ZapOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
          <button
            onClick={() => navigate('/queries')}
            className="h-8 px-2.5 flex items-center gap-1.5 font-typewriter text-xs font-semibold bg-[#26374A] hover:bg-[#2B3D52] border border-[#2B3D52] rounded-xs text-[#EFE9DC] transition-fast"
            title="Open Direct SQL Console"
          >
            <Terminal size={13} className="text-[#B08D3C]" />
            <span className="hidden md:inline">SQL CONSOLE</span>
          </button>

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
        </div>
      </header>

      {/* Police Light Loading Bar (thin red/blue alternating) */}
      {isLoading && (
        <div className="absolute bottom-0 left-0 right-0 police-light-bar" />
      )}
    </div>
  );
};
