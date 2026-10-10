import { useState, useEffect } from 'react';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, isMobile: false, isTablet: false, isDesktop: true };
    }
    const width = window.innerWidth;
    return {
      width,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setDimensions({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
}
