import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`relative w-full ${maxWidth} bg-[#F6F0E0] dark:bg-[#1F2228] border-2 border-[#B08D3C] rounded-xs shadow-2xl overflow-hidden`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D9D0BE] dark:border-[#2E323B] bg-[#E6DFCD] dark:bg-[#1A1C20]">
                <div>
                  <h3 id="modal-title" className="font-typewriter text-sm font-bold text-[#1F1F1F] dark:text-[#E2DFD8] uppercase tracking-wider">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="font-typewriter text-[11px] text-[#7A7A7A] mt-0.5">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white hover:bg-[#D9D0BE] dark:hover:bg-[#2E323B]"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
