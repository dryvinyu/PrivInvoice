import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  tone?: "default" | "emerald" | "warm";
  className?: string;
}) {
  const ring =
    tone === "emerald" ? "ring-primary/30" : tone === "warm" ? "ring-warm/30" : "ring-border";
  return (
    <div className={cn("glass relative overflow-hidden rounded-2xl p-5 ring-1", ring, className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              tone === "emerald"
                ? "bg-primary/15 text-primary"
                : tone === "warm"
                  ? "bg-warm/15 text-warm"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
