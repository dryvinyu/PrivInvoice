import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivacyBadge({
  label = "Encrypted",
  tone = "emerald",
  className,
}: {
  label?: string;
  tone?: "emerald" | "warm" | "muted" | "warning" | "destructive";
  className?: string;
}) {
  const tones: Record<string, string> = {
    emerald: "bg-primary/10 text-primary border-primary/30",
    warm: "bg-warm/10 text-warm border-warm/30",
    muted: "bg-muted text-muted-foreground border-border",
    warning: "bg-warning/10 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
    >
      <Lock className="h-3 w-3" />
      {label}
    </span>
  );
}
