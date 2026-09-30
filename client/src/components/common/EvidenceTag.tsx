import React from 'react';

interface EvidenceTagProps {
  label: string;
  value: React.ReactNode;
  tagId?: string;
  className?: string;
}

export const EvidenceTag: React.FC<EvidenceTagProps> = ({
  label,
  value,
  tagId,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 bg-[#F6F0E0] dark:bg-[#252830] border border-[#B08D3C]/60 dark:border-[#B08D3C]/40 rounded-xs shadow-paper ${className}`}
    >
      {/* Punched hole graphic */}
      <span className="w-2.5 h-2.5 rounded-full bg-[#EFE9DC] dark:bg-[#16181C] border border-[#B08D3C]/60 shrink-0 shadow-inner" />

      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-typewriter text-[#B08D3C] uppercase tracking-wider">
            {tagId ? `TAG ${tagId} • ` : ''}{label}
          </span>
        </div>
        <div className="text-xs font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
          {value}
        </div>
      </div>
    </div>
  );
};
