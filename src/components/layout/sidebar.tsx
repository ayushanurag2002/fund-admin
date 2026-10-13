"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Landmark, Users, FileSignature, ArrowDownToLine, ArrowUpFromLine, BookOpen, CheckSquare, FolderOpen, BarChart3, Settings, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Landmark },
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/subscriptions", label: "Subscriptions", icon: FileSignature },
  { href: "/capital-calls", label: "Capital Calls", icon: ArrowDownToLine },
  { href: "/distributions", label: "Distributions", icon: ArrowUpFromLine },
  { href: "/ledger", label: "Ledger", icon: BookOpen },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const openTasks = useStore((s) => s.tasks.filter((t) => t.status !== "done").length);
  const kycReview = useStore((s) => s.subscriptions.filter((t) => t.status === "kyc_review").length);
  const counts: Record<string, number> = { "/tasks": openTasks, "/subscriptions": kycReview };

  return (
    <>
      <div className={cn("fixed inset-0 z-40 bg-black/40 lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-elev transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-violet text-white shadow-[0_6px_16px_-6px_var(--brand)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight">Allocations</span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-faint">Fund Admin</span>
            </span>
          </Link>
          <button className="rounded-md p-1 text-faint hover:bg-hover lg:hidden" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <nav className="scroll-area flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">Workspace</p>
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-muted hover:bg-hover hover:text-fg",
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-brand" : "text-faint group-hover:text-fg")} />
                <span className="flex-1">{item.label}</span>
                {counts[item.href] ? <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] tnum", active ? "bg-brand/15" : "bg-subtle text-faint")}>{counts[item.href]}</span> : null}
              </Link>
            );
          })}
          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-faint">System</p>
          <Link href="/settings" onClick={onClose} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium", pathname.startsWith("/settings") ? "bg-brand-soft text-brand" : "text-muted hover:bg-hover hover:text-fg")}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-br from-brand/15 via-violet/10 to-transparent p-3.5">
            <p className="text-[12px] font-semibold">Demo workspace</p>
            <p className="mt-0.5 text-[11.5px] leading-4 text-muted">All data is local dummy data. Reset anytime from Settings.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
