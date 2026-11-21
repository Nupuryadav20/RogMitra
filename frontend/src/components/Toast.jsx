// Toast.jsx - Simple toast notification component
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  };
  const icons = { success: CheckCircle2, error: XCircle, info: AlertCircle };
  const Icon = icons[type] || CheckCircle2;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-sm font-medium ${styles[type]}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 p-0.5 rounded-lg hover:bg-black/10">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => remove(t.id)} />
      ))}
    </div>
  );

  return { show, ToastContainer };
}
