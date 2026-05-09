import { CheckCircle2, Clock, XCircle, Coins, Banknote, type LucideIcon } from "lucide-react";
import type { InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const map: Record<InvoiceStatus, { label: string; cls: string; icon: LucideIcon }> = {
  Created: { label: "Created", cls: "bg-muted text-muted-foreground border-border", icon: Clock },
  Eligible: {
    label: "Eligible",
    cls: "bg-primary/10 text-primary border-primary/30",
    icon: CheckCircle2,
  },
  Rejected: {
    label: "Rejected",
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
  Funded: { label: "Funded", cls: "bg-warm/10 text-warm border-warm/30", icon: Coins },
  Repaid: { label: "Repaid", cls: "bg-chart-3/10 text-chart-3 border-chart-3/30", icon: Banknote },
};

export function StatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const m = map[status];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        m.cls,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}
