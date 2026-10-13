"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VEHICLE_STATUS_ORDER } from "@/lib/selectors";
import type { VehicleStatus } from "@/lib/types";

export function Lifecycle({ status }: { status: VehicleStatus }) {
  const idx = VEHICLE_STATUS_ORDER.indexOf(status);
  return (
    <ol className="flex items-center">
      {VEHICLE_STATUS_ORDER.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors", done ? "border-success bg-success text-white" : current ? "border-brand bg-brand text-white shadow-[0_0_0_4px_var(--brand-soft)]" : "border-border bg-elev text-faint")}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("mt-1.5 text-[11px] font-medium capitalize", current ? "text-fg" : "text-faint")}>{s}</span>
            </div>
            {i < VEHICLE_STATUS_ORDER.length - 1 ? <span className={cn("mx-2 mb-5 h-0.5 flex-1 rounded", i < idx ? "bg-success" : "bg-border")} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
