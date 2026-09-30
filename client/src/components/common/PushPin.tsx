import React from 'react';

interface PushPinProps {
  color?: 'red' | 'brass' | 'silver';
  className?: string;
  size?: number;
}

export const PushPin: React.FC<PushPinProps> = ({ color = 'red', className = '', size = 22 }) => {
  const pinHeadColor = {
    red: '#B3261E',
    brass: '#B08D3C',
    silver: '#94A3B8',
  }[color];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`drop-shadow-pin shrink-0 select-none ${className}`}
    >
      {/* Pin Shadow */}
      <ellipse cx="14" cy="18" rx="4" ry="2" fill="rgba(0,0,0,0.3)" />
      {/* Pin Needle */}
      <line x1="12" y1="12" x2="12" y2="19" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Pin Head */}
      <circle cx="12" cy="8" r="6" fill={pinHeadColor} stroke="#1F1F1F" strokeWidth="0.8" />
      {/* 3D highlight */}
      <ellipse cx="10" cy="6" rx="2" ry="1.2" fill="rgba(255,255,255,0.4)" />
      {/* Pin Center Core */}
      <circle cx="12" cy="8" r="2.5" fill="#1F1F1F" opacity="0.3" />
    </svg>
  );
};
