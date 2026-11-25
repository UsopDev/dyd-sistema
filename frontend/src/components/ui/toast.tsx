import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ESTILOS: Record<ToastVariant, string> = {
  success: "border-emerald-200/80 bg-emerald-50/95 text-emerald-900",
  error: "border-rose-200/80 bg-rose-50/95 text-rose-900",
  info: "border-blue-200/80 bg-blue-50/95 text-blue-900",
};

const ICONOS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const quitar = useCallback((id: string) => {
    setItems((previos) => previos.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setItems((previos) => [...previos, { ...item, id }]);
      window.setTimeout(() => quitar(id), 5000);
    },
    [quitar],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {items.map((item) => {
          const Icono = ICONOS[item.variant];

          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-xl",
                ESTILOS[item.variant],
              )}
              role="status"
            >
              <Icono className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => quitar(item.id)}
                className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Cerrar notificación"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contexto = useContext(ToastContext);

  if (!contexto) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return contexto;
}
