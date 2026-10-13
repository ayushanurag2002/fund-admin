"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-border bg-elev px-3 text-sm text-fg placeholder:text-faint transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-brand disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(base, "h-9.5", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, "min-h-20 py-2", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(base, "h-9.5 appearance-none pr-8", className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function MoneyInput({ value, onChange, ...props }: { value: number; onChange: (n: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">$</span>
      <Input
        inputMode="numeric"
        className="pl-7 tnum"
        value={value ? value.toLocaleString("en-US") : ""}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/[^0-9]/g, "")) || 0;
          onChange(n);
        }}
        {...props}
      />
    </div>
  );
}
