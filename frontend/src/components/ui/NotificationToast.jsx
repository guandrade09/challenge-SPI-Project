import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext();

const COLOR_MAP = {
  verde:    "bg-green-600/90 border border-green-400",
  vermelho:  "bg-red-600/90 border border-red-400",
  amarelo:  "bg-yellow-500/90 border border-yellow-300",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timerRefs.current.get(id));
    timerRefs.current.delete(id);
  }, []);

  const mostrarToast = useCallback((texto, color = "verde", timing = 3) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => {
      const next = [...prev, { id, texto, color }];
      return next.length > 3 ? next.slice(-3) : next;
    });
    timerRefs.current.set(
      id,
      setTimeout(() => dismissToast(id), timing * 1000)
    );
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-white shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 pointer-events-auto backdrop-blur-sm ${
              COLOR_MAP[toast.color] ?? COLOR_MAP.verde
            }`}
          >
            <span className="font-medium">{toast.texto}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}