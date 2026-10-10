import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg',
  footer,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const drawerRef = useRef<HTMLDivElement>(null);
  const reduceMotion =
    typeof window !== 'undefined' &&
    (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion'));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Motion variants depending on screen size
  const getVariants = () => {
    if (reduceMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }
    if (isMobile) {
      return {
        initial: { y: '100%', opacity: 1 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 1 },
      };
    }
    return {
      initial: { x: '100%', opacity: 1 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 1 },
    };
  };

  const variants = getVariants();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={onClose}
            aria-hidden="true"
          />

          {isMobile ? (
            /* Mobile Full-Screen Sheet sliding up from bottom */
            <motion.div
              ref={drawerRef}
              initial={variants.initial}
              animate={variants.animate}
              exit={variants.exit}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
              className="fixed inset-0 w-full h-[100dvh] bg-[#F6F0E0] dark:bg-[#1F2228] flex flex-col z-50 pt-safe pb-safe"
            >
              {/* Sticky Header with Title and Accessible Close Button */}
              <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#B08D3C] bg-[#E6DFCD] dark:bg-[#1A1C20] shrink-0">
                <div className="min-w-0 pr-2">
                  <h2
                    id="drawer-title"
                    className="font-typewriter text-sm font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider truncate"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="font-typewriter text-[11px] text-[#7A7A7A] truncate mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#D9D0BE] dark:hover:bg-[#2E323B] focus:outline-none shrink-0"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain">
                {children}
              </div>

              {/* Optional Sticky Footer */}
              {footer && (
                <div className="p-3 border-t border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20] shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          ) : (
            /* Tablet (max-w-[60vw]) and Desktop Slide-over Drawer */
            <div className="fixed inset-y-0 right-0 flex pl-10">
              <motion.div
                ref={drawerRef}
                initial={variants.initial}
                animate={variants.animate}
                exit={variants.exit}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                className={`w-screen ${
                  isTablet ? 'max-w-[60vw]' : width
                } bg-[#F6F0E0] dark:bg-[#1F2228] border-l-4 border-[#B08D3C] shadow-2xl flex flex-col pt-safe pb-safe`}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20] shrink-0">
                  <div className="min-w-0 pr-2">
                    <h2
                      id="drawer-title"
                      className="font-typewriter text-sm font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider truncate"
                    >
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="font-typewriter text-[11px] text-[#7A7A7A] mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#D9D0BE] dark:hover:bg-[#2E323B] focus:outline-none shrink-0"
                    aria-label="Close panel"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">{children}</div>

                {/* Optional Footer */}
                {footer && (
                  <div className="p-4 border-t border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20] shrink-0">
                    {footer}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
