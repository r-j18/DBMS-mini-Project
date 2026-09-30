import React from 'react';

interface FolderCardProps {
  tabLabel?: string;
  tabId?: string | number;
  hasPaperclip?: boolean;
  rotationDeg?: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  tabLabel = 'CASE No.',
  tabId,
  hasPaperclip = true,
  rotationDeg = 0,
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{ transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined }}
      className={`relative pt-4 transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-[1.01]' : ''
      } ${className}`}
    >
      {/* Folder Tab on top-left */}
      {tabId !== undefined && (
        <div className="absolute top-0 left-3 z-10 px-3 py-0.5 bg-[#E6DFCD] dark:bg-[#2B303C] border-t border-l border-r border-[#D9D0BE] dark:border-[#2E323B] rounded-t font-typewriter text-[10px] tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8] font-bold shadow-xs">
          <span>{tabLabel} </span>
          <span className="font-mono text-[#B3261E] dark:text-[#F87171]">#{tabId}</span>
        </div>
      )}

      {/* Inline SVG Paperclip on top-right */}
      {hasPaperclip && (
        <div className="absolute -top-2 right-6 z-20 pointer-events-none drop-shadow-xs">
          <svg width="18" height="28" viewBox="0 0 16 28" fill="none">
            {/* Realistic metallic paperclip path */}
            <path
              d="M 5 20 L 5 7 C 5 4.5 7 2.5 9 2.5 C 11 2.5 13 4.5 13 7 L 13 22 C 13 25.5 10 27.5 7 27.5 C 4 27.5 1.5 25 1.5 22 L 1.5 9 C 1.5 7 2.5 5 4 5"
              stroke="#B08D3C"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Manila Paper Body */}
      <div className="bg-[#F6F0E0] dark:bg-[#1F2228] border border-[#D9D0BE] dark:border-[#2E323B] rounded shadow-folder overflow-hidden p-4">
        {children}
      </div>
    </div>
  );
};
