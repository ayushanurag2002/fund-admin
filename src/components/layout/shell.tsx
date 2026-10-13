"use client";
import * as React from "react";
import Link from "next/link";
import { Bell, Menu, Search, Plus } from "lucide-react";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { ThemeToggle } from "./theme";
import { Toaster } from "@/components/ui/toast";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/ui/misc";
import { daysUntil, fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const hydrated = useStore((s) => s.hydrated);
  const tasks = useStore((s) => s.tasks);
  const urgent = tasks.filter((t) => t.status !== "done" && daysUntil(t.dueDate) <= 3).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6">
          <button className="rounded-lg p-2 text-muted hover:bg-hover lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
          <button onClick={() => setPaletteOpen(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-elev px-3 text-sm text-faint shadow-card hover:border-border-strong sm:max-w-md">
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Search vehicles, investors…</span>
            <kbd className="hidden rounded border border-border bg-subtle px-1.5 py-0.5 text-[10px] font-medium sm:block">⌘K</kbd>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Link href="/vehicles/new" className="hidden sm:block">
              <Button size="sm"><Plus className="h-4 w-4" /> New vehicle</Button>
            </Link>
            <ThemeToggle />
            <div className="relative">
              <button onClick={() => setNotifOpen((o) => !o)} className="relative rounded-lg p-2 text-muted hover:bg-hover hover:text-fg" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {urgent.length ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-bg" /> : null}
              </button>
              {notifOpen ? (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  <div className="animate-pop absolute right-0 z-40 mt-2 w-80 rounded-xl border border-border bg-elev p-2 shadow-pop">
                    <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-faint">Due within 3 days</p>
                    {urgent.length === 0 ? <p className="px-2 py-4 text-sm text-muted">You&apos;re all caught up.</p> : null}
                    {urgent.slice(0, 6).map((t) => (
                      <Link key={t.id} href="/tasks" onClick={() => setNotifOpen(false)} className="block rounded-lg px-2 py-2 hover:bg-hover">
                        <p className="truncate text-[13px] font-medium">{t.title}</p>
                        <p className={daysUntil(t.dueDate) < 0 ? "text-xs text-danger" : "text-xs text-muted"}>{daysUntil(t.dueDate) < 0 ? `Overdue · ${fmtDate(t.dueDate)}` : `Due ${fmtDate(t.dueDate)}`}</p>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <Link href="/settings" className="ml-1 flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-hover">
              <Avatar name="Admin" size="sm" />
              <span className="hidden text-[13px] font-medium md:block">Admin</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {hydrated ? <div className="animate-fade-up">{children}</div> : <ShellSkeleton />}
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64 rounded-lg" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
