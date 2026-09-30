import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records on file',
  description = 'No corresponding case files or registered entries exist for this search criterion.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-[#D9D0BE] dark:border-[#2E323B] rounded bg-[#F6F0E0]/60 dark:bg-[#1F2228]/60 my-2">
      {/* Illustrated empty manila folder SVG */}
      <div className="mb-3 text-[#B08D3C]">
        <svg width="48" height="38" viewBox="0 0 48 38" fill="none" className="mx-auto drop-shadow-xs">
          {/* Back folder tab */}
          <path d="M4 8C4 6.89543 4.89543 6 6 6H16L20 10H42C43.1046 10 44 10.8954 44 12V32C44 33.1046 43.1046 34 42 34H6C4.89543 34 4 33.1046 4 32V8Z" fill="#E6DFCD" stroke="#B08D3C" strokeWidth="1.5" />
          {/* Empty interior shadow */}
          <rect x="7" y="14" width="34" height="16" rx="2" fill="#D9D0BE" opacity="0.4" />
          {/* Front folder leaf open */}
          <path d="M3 18C3 16.8954 3.89543 16 5 16H43C44.1046 16 45 16.8954 45 18L43 33C43 34.1046 42.1046 35 41 35H7C5.89543 35 5 34.1046 5 33L3 18Z" fill="#F6F0E0" stroke="#B08D3C" strokeWidth="1.5" />
          {/* Faint 'EMPTY' stamped note */}
          <text x="24" y="27" textAnchor="middle" fill="#B3261E" fontSize="8" fontFamily="'Special Elite', monospace" letterSpacing="1" opacity="0.6">NO DOSSIER</text>
        </svg>
      </div>

      <h4 className="text-sm font-typewriter font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wide">
        {title}
      </h4>
      <p className="text-xs text-[#6B685F] dark:text-[#A09D95] mt-1 max-w-sm">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3.5 px-3 py-1.5 text-xs font-semibold bg-[#1F2D3D] text-[#EFE9DC] hover:bg-[#141D27] dark:bg-[#EFE9DC] dark:text-[#1F2D3D] rounded transition-fast shadow-paper"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
