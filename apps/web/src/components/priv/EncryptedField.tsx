import { EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function EncryptedField({
  label,
  value,
  reveal = false,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  reveal?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-3",
        className,
      )}
    >
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {reveal ? (
          <>
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-sm text-foreground">{value}</span>
          </>
        ) : (
          <>
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-sm tracking-wider text-muted-foreground">
              ••• ENCRYPTED •••
            </span>
          </>
        )}
      </div>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
