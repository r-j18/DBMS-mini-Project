import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-lg',
}) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex pl-10">
            {/* Sheet of Paper Slide */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`w-screen ${width} bg-[#F6F0E0] dark:bg-[#1F2228] border-l-4 border-[#B08D3C] shadow-2xl flex flex-col`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20]">
                <div>
                  <h2 id="drawer-title" className="font-typewriter text-sm font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="font-typewriter text-[11px] text-[#7A7A7A] mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#D9D0BE] dark:hover:bg-[#2E323B] focus:outline-none"
                  aria-label="Close panel"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
