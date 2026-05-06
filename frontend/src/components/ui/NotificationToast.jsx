import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function mostrarToast(texto, color = "verde", timing = 3) {
    const id = Date.now();
    const novoToast = { id, texto, color };

    setToasts((prev) => {
      const novaLista = [...prev, novoToast];
      
      if (novaLista.length > 3) {
        return novaLista.slice(-3);
      }
      
      return novaLista;
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, timing * 1000);
  }

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      {/* Render dos toasts */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-white shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-2 pointer-events-auto ${
              toast.color === "verde"
                ? "bg-green-600/90 border border-green-400"
                : toast.color === "vermelho"
                ? "bg-red-600/90 border border-red-400"
                : "bg-yellow-500/90 border border-yellow-300"
            } backdrop-blur-sm`}
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