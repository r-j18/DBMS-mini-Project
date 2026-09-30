import React from 'react';
import { Search, Database, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onOpenSearch: () => void;
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSearch, title }) => {
  const navigate = useNavigate();

  return (
    <header className="h-14 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 select-none">
      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 h-8 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-fast w-48 sm:w-64"
        >
          <Search size={13} className="shrink-0" />
          <span className="flex-1 text-left">Search all records...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
            Ctrl K
          </kbd>
        </button>

        {/* Quick SQL Console Link */}
        <button
          onClick={() => navigate('/queries')}
          className="h-8 px-2.5 flex items-center gap-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 transition-fast"
          title="Open SQL Console"
        >
          <Terminal size={13} />
          <span className="hidden sm:inline">SQL Explorer</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-[11px] text-slate-500 font-mono">
          <Database size={12} className="text-slate-400" />
          <span>crm_db</span>
        </div>
      </div>
    </header>
  );
};
