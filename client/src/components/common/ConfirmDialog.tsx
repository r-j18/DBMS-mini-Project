import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isSubmitting?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Permanently purge record',
  cancelText = 'Cancel',
  isSubmitting = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4 min-w-0 max-w-full">
        {/* Caution Tape Header sliding in - overflow contained */}
        <div className="w-full overflow-hidden rounded-xs -mt-1 mb-2">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.25 }}
            className="caution-tape-header h-3 w-full origin-left"
          />
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-950/60 text-[#B3261E] dark:text-red-400 rounded border border-[#B3261E]/40 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-typewriter text-xs font-bold text-[#B3261E] uppercase tracking-wider mb-1">
              Warning: Destructive Operation
            </div>
            <p className="text-xs text-[#4B4B4B] dark:text-[#A09D95] leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 text-xs font-typewriter font-semibold border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-[#1F1F1F] dark:text-[#E2DFD8] hover:bg-[#EFE9DC] dark:hover:bg-[#1F2228] disabled:opacity-50 order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 text-xs font-typewriter font-bold rounded-xs bg-[#B3261E] hover:bg-[#921E18] text-white focus:outline-none focus:ring-1 focus:ring-[#B3261E] disabled:opacity-50 tracking-wider uppercase order-1 sm:order-2"
          >
            {isSubmitting ? 'Purging...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
