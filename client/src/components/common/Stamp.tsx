import React from 'react';
import { motion } from 'framer-motion';

export type StampVariant = 'open' | 'under investigation' | 'closed' | 'classified' | 'confidential' | 'jailed' | 'custom';

interface StampProps {
  text: string;
  variant?: StampVariant;
  rotateDeg?: number;
  size?: 'sm' | 'md' | 'lg';
  animateSlam?: boolean;
  className?: string;
}

export const Stamp: React.FC<StampProps> = ({
  text,
  variant,
  rotateDeg = -2,
  size = 'md',
  animateSlam = true,
  className = '',
}) => {
  const norm = (variant || text || '').toLowerCase();

  let colorClasses = 'border-slate-700 text-slate-700 dark:border-slate-300 dark:text-slate-300 bg-slate-100/30';

  if (norm === 'open') {
    colorClasses = 'border-[#1E40AF] text-[#1E40AF] dark:border-[#60A5FA] dark:text-[#60A5FA] bg-blue-50/30 dark:bg-blue-950/20';
  } else if (norm === 'under investigation') {
    colorClasses = 'border-[#B45309] text-[#B45309] dark:border-[#FBBF24] dark:text-[#FBBF24] bg-amber-50/30 dark:bg-amber-950/20';
  } else if (norm === 'closed' || norm === 'classified' || norm === 'confidential') {
    colorClasses = 'border-[#B3261E] text-[#B3261E] dark:border-[#EF4444] dark:text-[#EF4444] bg-red-50/30 dark:bg-red-950/20';
  } else if (norm === 'jailed' || norm === 'incarcerated') {
    colorClasses = 'border-[#831843] text-[#831843] dark:border-[#F472B6] dark:text-[#F472B6] bg-pink-50/30 dark:bg-pink-950/20';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 border-[1.5px]',
    md: 'text-xs px-2.5 py-0.5 border-[2px]',
    lg: 'text-sm px-3.5 py-1 border-[2.5px]',
  }[size];

  return (
    <motion.span
      initial={animateSlam ? { scale: 1.5, opacity: 0, rotate: rotateDeg - 6 } : false}
      animate={{ scale: 1, opacity: 0.92, rotate: rotateDeg }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`rubber-stamp tracking-wider font-typewriter uppercase inline-flex items-center justify-center shadow-xs select-none ${colorClasses} ${sizeClasses} ${className}`}
      style={{ transform: `rotate(${rotateDeg}deg)` }}
    >
      {text}
    </motion.span>
  );
};
