"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, empty, initialSort, pageSize = 25, dense }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
  dense?: boolean;
}) {
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" } | null>(initialSort ?? null);
  const [page, setPage] = React.useState(0);

  const sorted = React.useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sv = col.sortValue;
    return [...rows].sort((a, b) => {
      const va = sv(a);
      const vb = sv(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = sorted.slice(current * pageSize, current * pageSize + pageSize);

  const toggle = (key: string) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-elev shadow-card">
      <div className="scroll-area overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-subtle/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn("px-4 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-wider text-faint", c.align === "right" && "text-right", c.align === "center" && "text-center", c.sortValue && "cursor-pointer select-none hover:text-fg")}
                  onClick={() => c.sortValue && toggle(c.key)}
                >
                  <span className={cn("inline-flex items-center gap-1", c.align === "right" && "flex-row-reverse")}>
                    {c.header}
                    {c.sortValue ? (sort?.key === c.key ? (sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-50" />) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted">{empty ?? "No records"}</td>
              </tr>
            ) : (
              slice.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn("border-b border-border last:border-b-0 transition-colors", onRowClick && "cursor-pointer hover:bg-hover")}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 align-middle", dense ? "py-2" : "py-3", c.align === "right" && "text-right tnum", c.align === "center" && "text-center", c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted">
          <span>
            Showing {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-md border border-border px-2 py-1 hover:bg-hover disabled:opacity-40">Prev</button>
            <button disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded-md border border-border px-2 py-1 hover:bg-hover disabled:opacity-40">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
