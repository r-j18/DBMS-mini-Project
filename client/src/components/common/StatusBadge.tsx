import React from 'react';
import { Stamp, StampVariant } from './Stamp';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  animateSlam?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  animateSlam = false,
  className = '',
}) => {
  const norm = (status || '').toLowerCase();

  let variant: StampVariant = 'custom';
  let rotate = -1.5;

  if (norm === 'open') {
    variant = 'open';
    rotate = -2;
  } else if (norm === 'under investigation') {
    variant = 'under investigation';
    rotate = 1.5;
  } else if (norm === 'closed') {
    variant = 'closed';
    rotate = -1.8;
  } else if (norm === 'jailed' || norm === 'incarcerated') {
    variant = 'jailed';
    rotate = 2;
  } else if (norm === 'confidential' || norm === 'classified') {
    variant = 'classified';
    rotate = -3;
  }

  return (
    <Stamp
      text={status}
      variant={variant}
      size={size}
      rotateDeg={rotate}
      animateSlam={animateSlam}
      className={className}
    />
  );
};
