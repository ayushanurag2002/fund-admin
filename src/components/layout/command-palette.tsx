"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Landmark, Users, CornerDownLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { NAV } from "./sidebar";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";

export function CommandPalette(props: { open: boolean; onClose: () => void }) {
  if (!props.open) return null;
  return <CommandPaletteInner {...props} />;
}

function CommandPaletteInner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const vehicles = useStore((s) => s.vehicles);
  const investors = useStore((s) => s.investors);
  const [q, setQ] = React.useState("");
  const [idx, setIdx] = React.useState(0);

  const items = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    const nav = NAV.filter((n) => !term || n.label.toLowerCase().includes(term)).map((n) => ({ id: n.href, label: n.label, hint: "Page", href: n.href, icon: n.icon }));
    const v = vehicles.filter((x) => term && (x.name.toLowerCase().includes(term) || x.portfolioCompany.toLowerCase().includes(term))).slice(0, 6).map((x) => ({ id: x.id, label: x.name, hint: `${x.type} · ${x.status}`, href: `/vehicles/${x.id}`, icon: Landmark }));
    const i = investors.filter((x) => term && (x.name.toLowerCase().includes(term) || x.email.toLowerCase().includes(term))).slice(0, 6).map((x) => ({ id: x.id, label: x.name, hint: x.email, href: `/investors/${x.id}`, icon: Users }));
    return [...v, ...i, ...(term ? nav : nav.slice(0, 10))];
  }, [q, vehicles, investors]);


  const go = (href: string) => { router.push(href); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} title="Search" size="md">
      <div className="-mx-5 -mt-4 -mb-4">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-faint" />
          <input
            autoFocus
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === "Enter" && items[idx]) go(items[idx].href);
            }}
            placeholder="Search vehicles, investors, pages…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-border bg-subtle px-1.5 py-0.5 text-[10px] text-faint">ESC</kbd>
        </div>
        <ul className="scroll-area max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? <li className="px-3 py-8 text-center text-sm text-muted">No results</li> : null}
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.id}>
                <button onMouseEnter={() => setIdx(i)} onClick={() => go(it.href)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm", i === idx ? "bg-brand-soft text-brand" : "text-fg hover:bg-hover")}>
                  <Icon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="flex-1 truncate">{it.label}</span>
                  <span className="truncate text-xs text-faint">{it.hint}</span>
                  {i === idx ? <CornerDownLeft className="h-3.5 w-3.5 opacity-60" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}
