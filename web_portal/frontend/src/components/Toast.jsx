import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-[#f0e6dc] bg-white text-slate-900 transition-all transform animate-slide-up">
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
      {isError && <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
      {!isSuccess && !isError && <Info className="w-5 h-5 text-[#1d5ba5] flex-shrink-0" />}

      <div className="text-sm font-medium">{toast.message}</div>

      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
