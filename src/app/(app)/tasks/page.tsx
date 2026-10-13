"use client";
import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader, SegmentedControl, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge, taskTone, priorityTone } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { AddTaskDialog } from "@/components/domain/dialogs";
import { fmtDate, daysUntil, titleCase, cn } from "@/lib/utils";
import { vehicleName, investorName } from "@/lib/selectors";
import { Plus, CheckSquare, Circle, CircleDot, CheckCircle2, Trash2, Calendar } from "lucide-react";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const d = useStore();
  const [filter, setFilter] = React.useState<"open" | "mine" | "overdue" | "done">("open");
  const [add, setAdd] = React.useState(false);
  const rows = d.tasks
    .filter((t) => (filter === "open" ? t.status !== "done" : filter === "mine" ? t.assignee === "You" && t.status !== "done" : filter === "overdue" ? t.status !== "done" && daysUntil(t.dueDate) < 0 : t.status === "done"))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const groups: { label: string; items: Task[] }[] = [
    { label: "Overdue", items: rows.filter((t) => t.status !== "done" && daysUntil(t.dueDate) < 0) },
    { label: "Today", items: rows.filter((t) => t.status !== "done" && daysUntil(t.dueDate) === 0) },
    { label: "This week", items: rows.filter((t) => t.status !== "done" && daysUntil(t.dueDate) > 0 && daysUntil(t.dueDate) <= 7) },
    { label: "Later", items: rows.filter((t) => t.status !== "done" && daysUntil(t.dueDate) > 7) },
    { label: "Completed", items: rows.filter((t) => t.status === "done") },
  ].filter((g) => g.items.length);

  return (
    <>
      <PageHeader title="Tasks & compliance" subtitle={`${d.tasks.filter((t) => t.status !== "done").length} open · ${d.tasks.filter((t) => t.status !== "done" && daysUntil(t.dueDate) < 0).length} overdue`} actions={<><SegmentedControl options={[{ value: "open", label: "Open" }, { value: "mine", label: "Mine" }, { value: "overdue", label: "Overdue" }, { value: "done", label: "Done" }]} value={filter} onChange={setFilter} /><Button onClick={() => setAdd(true)}><Plus className="h-4 w-4" /> New task</Button></>} />
      {groups.length === 0 ? <EmptyState icon={<CheckSquare className="h-5 w-5" />} title="Nothing here" description="You're all caught up." /> : null}
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wider", g.label === "Overdue" ? "text-danger" : "text-faint")}>{g.label} · {g.items.length}</p>
            <div className="overflow-hidden rounded-xl border border-border bg-elev shadow-card">
              {g.items.map((t) => (
                <div key={t.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                  <button
                    onClick={() => toast.result(d.setTaskStatus(t.id, t.status === "done" ? "open" : t.status === "open" ? "in_progress" : "done"))}
                    className={cn("shrink-0", t.status === "done" ? "text-success" : t.status === "in_progress" ? "text-info" : "text-faint hover:text-fg")}
                    title={t.status === "open" ? "Start" : t.status === "in_progress" ? "Complete" : "Reopen"}
                  >
                    {t.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : t.status === "in_progress" ? <CircleDot className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", t.status === "done" && "text-faint line-through")}>{t.title}</p>
                    <p className="truncate text-xs text-muted">
                      {t.vehicleId ? <Link href={`/vehicles/${t.vehicleId}`} className="hover:underline">{vehicleName(d, t.vehicleId)}</Link> : null}
                      {t.vehicleId && t.investorId ? " · " : null}
                      {t.investorId ? <Link href={`/investors/${t.investorId}`} className="hover:underline">{investorName(d, t.investorId)}</Link> : null}
                      {!t.vehicleId && !t.investorId ? "General" : null}
                      {" · "}{t.assignee}
                    </p>
                  </div>
                  <Badge>{titleCase(t.type)}</Badge>
                  <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
                  <StatusBadge status={t.status} map={taskTone} />
                  <span className={cn("hidden w-28 items-center gap-1 text-xs sm:flex", daysUntil(t.dueDate) < 0 && t.status !== "done" ? "text-danger" : "text-muted")}><Calendar className="h-3.5 w-3.5" /> {fmtDate(t.dueDate)}</span>
                  {t.status !== "done" ? <Button size="sm" variant="outline" onClick={() => toast.result(d.setTaskStatus(t.id, "done"))}>Complete</Button> : null}
                  <button onClick={() => toast.result(d.deleteTask(t.id))} className="text-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <AddTaskDialog open={add} onClose={() => setAdd(false)} />
    </>
  );
}
