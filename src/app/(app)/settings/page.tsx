"use client";
import * as React from "react";
import { useStore } from "@/lib/store";
import { PageHeader, KV } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useTheme } from "@/components/layout/theme";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Moon, Sun, Database } from "lucide-react";

export default function SettingsPage() {
  const d = useStore();
  const { theme, toggle } = useTheme();
  const [confirm, setConfirm] = React.useState(false);
  return (
    <>
      <PageHeader title="Settings" subtitle="Workspace preferences and demo data" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appearance" />
          <CardBody>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 text-sm">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Theme: <span className="font-medium capitalize">{theme}</span></div>
              <Button variant="outline" size="sm" onClick={toggle}>Switch to {theme === "dark" ? "light" : "dark"}</Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Workspace" />
          <CardBody className="grid grid-cols-2 gap-4">
            <KV label="Organisation" value="Allocations (demo)" />
            <KV label="Signed in as" value="Admin" />
            <KV label="Role" value={<Badge tone="brand">Fund administrator</Badge>} />
            <KV label="Base currency" value="USD" />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Demo data" subtitle="Everything is stored locally in your browser. No backend, no network calls." />
          <CardBody>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[["Vehicles", d.vehicles.length], ["Investors", d.investors.length], ["Subscriptions", d.subscriptions.length], ["Ledger entries", d.ledger.length], ["Activity events", d.activity.length]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg border border-border p-3"><p className="text-xs text-faint">{k}</p><p className="text-lg font-semibold tnum">{v}</p></div>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-subtle/60 p-3">
              <Database className="h-4 w-4 text-faint" />
              <p className="flex-1 text-sm text-muted">Reset restores the original seed dataset and discards every change you made.</p>
              <Button variant="danger" size="sm" onClick={() => setConfirm(true)}><RotateCcw className="h-3.5 w-3.5" /> Reset demo data</Button>
            </div>
          </CardBody>
        </Card>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Reset demo data?" description="All local changes will be lost." confirmLabel="Reset" danger onConfirm={() => { d.reset(); toast.success("Demo data reset"); }} />
    </>
  );
}
