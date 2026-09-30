import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Gavel,
  Lock,
  Code2,
  Database,
  Sun,
  Moon,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ darkMode, toggleDarkMode }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/criminals', label: 'Criminals', icon: Users },
    { to: '/police', label: 'Police Officers', icon: Shield },
    { to: '/court-records', label: 'Court Records', icon: Gavel },
    { to: '/jail', label: 'Jail Records', icon: Lock },
    { to: '/queries', label: 'Query Explorer', icon: Code2 },
    { to: '/schema', label: 'Database Schema', icon: Database },
  ];

  return (
    <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="p-1.5 bg-slate-800 text-white rounded dark:bg-slate-100 dark:text-slate-900">
          <ShieldAlert size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
            CRMS Portal
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Records & Investigation
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <div className="px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Registry Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-fast ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-l-2 border-slate-800 dark:border-slate-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon size={15} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Database Status & Theme Toggle */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-slate-600 dark:text-slate-400">crm_db</span>
          </div>
          <span className="text-[10px] text-slate-400">MySQL 8</span>
        </div>

        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-fast"
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </span>
          <span className="text-[10px] uppercase font-mono text-slate-400">
            {darkMode ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>
    </aside>
  );
};
