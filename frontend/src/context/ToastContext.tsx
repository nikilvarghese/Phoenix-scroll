import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global subscriber mechanism so window.alert or non-react helpers can trigger toasts
type ToastListener = (message: string, type: ToastType) => void;
let globalToastListener: ToastListener | null = null;

export const triggerGlobalToast = (message: string, type: ToastType = 'info') => {
  if (globalToastListener) {
    globalToastListener(message, type);
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);

  useEffect(() => {
    globalToastListener = (msg, type) => {
      showToast(msg, type);
    };

    // Replace native browser alert with clean UI banner fallback
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      if (msg !== undefined && msg !== null) {
        showToast(String(msg), 'info');
      }
    };

    return () => {
      globalToastListener = null;
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}

      {/* Floating UI Banner Notification Container */}
      <div
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center pointer-events-none w-full max-w-lg px-4"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const isError = toast.type === 'error';
            const isSuccess = toast.type === 'success';
            const isWarning = toast.type === 'warning';

            let bgStyle = 'bg-stone-900/95 text-stone-100 border-stone-700 shadow-stone-950/40';
            let IconComponent = Info;
            let iconColor = 'text-amber-400';

            if (isError) {
              bgStyle = 'bg-red-950/95 text-red-100 border-red-800/80 shadow-red-950/40';
              IconComponent = AlertCircle;
              iconColor = 'text-red-400';
            } else if (isSuccess) {
              bgStyle = 'bg-emerald-950/95 text-emerald-100 border-emerald-800/80 shadow-emerald-950/40';
              IconComponent = CheckCircle2;
              iconColor = 'text-emerald-400';
            } else if (isWarning) {
              bgStyle = 'bg-amber-950/95 text-amber-100 border-amber-800/80 shadow-amber-950/40';
              IconComponent = AlertTriangle;
              iconColor = 'text-amber-400';
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-sm font-medium tracking-wide ${bgStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconComponent className={`w-5 h-5 shrink-0 ${iconColor}`} />
                  <span className="truncate break-words">{toast.message}</span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-white/10 transition shrink-0 opacity-70 hover:opacity-100"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
