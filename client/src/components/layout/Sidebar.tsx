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
  Pin,
  FolderClosed,
  FolderOpen,
} from 'lucide-react';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  reduceMotion: boolean;
  toggleReduceMotion: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
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

  return (
    <aside className="w-60 bg-[#1F2D3D] text-[#EFE9DC] border-r border-[#141D27] flex flex-col shrink-0 select-none z-30 shadow-md">
      {/* Brand Header: Bureau Shield Logo + Title */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-[#141D27] bg-[#1A2533]">
        {/* Inline SVG Bureau Shield Badge */}
        <div className="p-1.5 bg-[#B08D3C] text-[#1F2D3D] rounded-xs shadow-pin shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.11v4.71c0 4.54-3.14 8.79-7 9.88-3.86-1.09-7-5.34-7-9.88V6.29l7-3.11zM11 7v6h2V7h-2zm0 8v2h2v-2h-2z" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-typewriter text-[13px] font-bold tracking-wider text-[#F6F0E0]">
            CRIMINAL RECORDS
          </div>
          <div className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-widest font-semibold">
            BUREAU • ARCHIVES
          </div>
        </div>
      </div>

      {/* Cabinet Index Header */}
      <div className="px-4 py-2 bg-[#17212D] border-b border-[#141D27] flex items-center justify-between text-[10px] font-typewriter text-[#8C9AA8] tracking-widest uppercase">
        <span>FILING CABINET INDEX</span>
        <span className="font-mono">CAB-A</span>
      </div>

      {/* Filing Tabs Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center justify-between px-3 py-2 rounded-xs font-typewriter text-xs tracking-wider transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F6F0E0] text-[#1F1F1F] font-bold shadow-paper translate-x-1 border-l-4 border-[#B3261E]'
                    : 'text-[#C9D1D9] hover:bg-[#26374A] hover:text-[#FFFFFF]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      className={isActive ? 'text-[#B3261E]' : 'text-[#8C9AA8] group-hover:text-[#B08D3C]'}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`font-mono text-[9px] px-1 py-0.5 rounded-xs ${
                      isActive
                        ? 'bg-[#E6DFCD] text-[#1F1F1F]'
                        : 'bg-[#141D27] text-[#8C9AA8]'
                    }`}
                  >
                    {item.tabCode}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bureau Seal & Department Meta */}
      <div className="p-3 border-t border-[#141D27] bg-[#1A2533] space-y-2">
        <div className="px-2.5 py-1.5 bg-[#141D27] rounded-xs border border-[#26374A] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[#EFE9DC] text-[10px]">MYSQL 8.0</span>
          </div>
          <span className="font-typewriter text-[9px] text-[#B08D3C]">DB ACTIVE</span>
        </div>

        <div className="text-[10px] font-typewriter text-[#8C9AA8] text-center tracking-wider pt-1">
          RECORD ARCHIVE • DIV-09
        </div>
      </div>
    </aside>
  );
};
