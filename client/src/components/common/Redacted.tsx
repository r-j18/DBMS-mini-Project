import React, { useState } from 'react';

interface RedactedProps {
  children: React.ReactNode;
  revealText?: string;
  className?: string;
  permanent?: boolean;
}

export const Redacted: React.FC<RedactedProps> = ({ children, className = '', permanent = false }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  if (permanent) {
    return (
      <span
        className={`relative inline-block select-none cursor-not-allowed ${className}`}
        title="Classified Officer Particulars — Insufficient Clearance"
      >
        <span className="opacity-0 select-none">{children || 'REDACTED'}</span>
        <span className="absolute inset-0 bg-[#1F1F1F] dark:bg-[#111316] rounded-xs flex items-center justify-center px-2 py-0.5 text-[10px] font-typewriter text-[#EFE9DC] tracking-widest uppercase select-none">
          REDACTED
        </span>
      </span>
    );
  }

  return (
    <span
      tabIndex={0}
      onMouseEnter={() => setIsRevealed(true)}
      onMouseLeave={() => setIsRevealed(false)}
      onFocus={() => setIsRevealed(true)}
      onBlur={() => setIsRevealed(false)}
      className={`relative inline-block cursor-help transition-all duration-200 select-all ${className}`}
      title="Confidential Officer Information (Hover or click to unredact)"
    >
      <span className={isRevealed ? 'opacity-100 transition-opacity duration-200' : 'opacity-0 select-none'}>
        {children}
      </span>

      {!isRevealed && (
        <span className="absolute inset-0 bg-[#1F1F1F] dark:bg-[#111316] rounded-xs flex items-center justify-center px-2 py-0.5 text-[10px] font-typewriter text-[#EFE9DC] tracking-widest uppercase transition-opacity duration-200 select-none">
          REDACTED
        </span>
      )}
    </span>
  );
};
