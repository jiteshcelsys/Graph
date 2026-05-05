import { useState, useCallback } from 'react';

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback(({ type = 'success', title, message, duration = 4000 }) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title, message) => add({ type: 'success', title, message }), [add]);
  const error = useCallback((title, message) => add({ type: 'error', title, message }), [add]);

  return { toasts, remove, success, error };
}
