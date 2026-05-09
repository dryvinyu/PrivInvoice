import type { AuditEvent } from "@/lib/types";
import { CheckCircle2, ScrollText } from "lucide-react";

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
        <ScrollText className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No audit events yet.</p>
      </div>
    );
  }
  return (
    <ol className="relative space-y-4 border-l border-border/60 pl-6">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[29px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 ring-2 ring-background">
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </span>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{e.label}</p>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(e.ts).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Actor: {e.actor}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
