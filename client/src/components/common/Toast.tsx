import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container: bottom-center on mobile, bottom-right on desktop, above safe area */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-50 flex flex-col items-center sm:items-end gap-2 max-w-sm w-auto sm:w-full pointer-events-none pb-safe mx-auto sm:mx-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full flex items-start gap-2.5 p-3 rounded-xs border text-xs shadow-lg transition-fast ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
                : 'bg-slate-50 text-slate-900 border-slate-300 dark:bg-slate-900/90 dark:text-slate-200 dark:border-slate-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />}
            </div>
            <div className="flex-1 font-typewriter font-medium leading-relaxed">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center -mr-1 -mt-1"
              aria-label="Dismiss toast"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
