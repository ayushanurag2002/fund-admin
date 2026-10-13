"use client";
import * as React from "react";
import { create } from "zustand";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Result } from "@/lib/store";

type Toast = { id: number; kind: "success" | "error" | "info"; message: string };
let n = 0;
const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; remove: (id: number) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++n;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3800);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToasts.getState().push({ kind: "success", message }),
  error: (message: string) => useToasts.getState().push({ kind: "error", message }),
  info: (message: string) => useToasts.getState().push({ kind: "info", message }),
  result: (r: Result, fallback = "Done") => {
    if (r.ok) toast.success(r.message ?? fallback);
    else toast.error(r.error);
    return r.ok;
  },
};

export function Toaster() {
  const { toasts, remove } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-pop pointer-events-auto flex items-start gap-3 rounded-xl border bg-elev px-4 py-3 text-sm shadow-pop",
            t.kind === "success" && "border-success/30",
            t.kind === "error" && "border-danger/40",
            t.kind === "info" && "border-info/30",
          )}
        >
          {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : t.kind === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />}
          <span className="flex-1 leading-5">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-faint hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}
