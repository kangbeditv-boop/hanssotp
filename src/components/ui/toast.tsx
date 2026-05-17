"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, variant = "default", onClose }: ToastProps) {
  const variantClasses = {
    default: "bg-background border",
    destructive: "bg-destructive text-destructive-foreground border-destructive",
    success: "bg-green-600 text-white border-green-600",
  };

  return (
    <div className={cn("pointer-events-auto flex w-full max-w-md rounded-lg p-4 shadow-lg", variantClasses[variant])}>
      <div className="flex-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button onClick={() => onClose(id)} className="ml-2 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

const ToastContext = React.createContext<{
  toast: (item: Omit<ToastItem, "id">) => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((item: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...item, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
