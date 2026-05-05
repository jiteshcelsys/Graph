import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export function Toast({ toasts, remove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onRemove, 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  const isSuccess = toast.type === 'success';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl min-w-72 max-w-sm
      transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      ${isSuccess ? 'bg-gray-900 border-green-800' : 'bg-gray-900 border-red-800'}`}>
      {isSuccess
        ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
        : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100">{toast.title}</p>
        {toast.message && <p className="text-xs text-gray-400 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className="text-gray-600 hover:text-gray-400 transition-colors shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
