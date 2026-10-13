"use client";
import * as React from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtCurrency } from "@/lib/utils";

export const CHART_COLORS = ["var(--brand)", "var(--teal)", "var(--violet)", "var(--warning)", "var(--info)", "var(--success)", "var(--danger)"];

function TooltipBox({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string; formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-elev px-3 py-2 text-xs shadow-pop">
      {label ? <p className="mb-1 font-medium text-fg">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="flex-1">{p.name}</span>
          <span className="font-medium text-fg tnum">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function AreaTrend({ data, keys, height = 240, money = true }: { data: Record<string, string | number>[]; keys: { key: string; label: string; color?: string }[]; height?: number; money?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          {keys.map((k, i) => (
            <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color ?? CHART_COLORS[i]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={k.color ?? CHART_COLORS[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--fg-faint)" }} />
        <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={money} tick={{ fontSize: 11, fill: "var(--fg-faint)" }} tickFormatter={(v) => (money ? fmtCurrency(v, { compact: true }) : String(v))} />
        <Tooltip content={<TooltipBox formatter={(v) => (money ? fmtCurrency(v) : String(v))} />} cursor={{ stroke: "var(--border-strong)" }} />
        {keys.map((k, i) => (
          <Area key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color ?? CHART_COLORS[i]} strokeWidth={2} fill={`url(#grad-${k.key})`} dot={false} activeDot={{ r: 4 }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, keys, height = 240, money = true, stacked }: { data: Record<string, string | number>[]; keys: { key: string; label: string; color?: string }[]; height?: number; money?: boolean; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barCategoryGap={18}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--fg-faint)" }} />
        <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={money} tick={{ fontSize: 11, fill: "var(--fg-faint)" }} tickFormatter={(v) => (money ? fmtCurrency(v, { compact: true }) : String(v))} />
        <Tooltip content={<TooltipBox formatter={(v) => (money ? fmtCurrency(v) : String(v))} />} cursor={{ fill: "var(--bg-hover)" }} />
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} stackId={stacked ? "a" : undefined} fill={k.color ?? CHART_COLORS[i]} radius={stacked && i < keys.length - 1 ? 0 : [6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220, money = true }: { data: { name: string; value: number }[]; height?: number; money?: boolean }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex items-center gap-6">
      <div style={{ width: height, height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<TooltipBox formatter={(v) => (money ? fmtCurrency(v) : String(v))} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-wider text-faint">Total</span>
          <span className="text-lg font-semibold tnum">{money ? fmtCurrency(total, { compact: true }) : total}</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="flex-1 truncate text-muted">{d.name}</span>
            <span className="font-medium tnum">{money ? fmtCurrency(d.value, { compact: true }) : d.value}</span>
            <span className="w-10 text-right text-xs text-faint tnum">{total ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
