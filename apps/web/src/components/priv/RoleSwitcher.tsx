import { Building2, Landmark, ShieldCheck, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles: { id: Role; label: string; icon: LucideIcon }[] = [
  { id: "Company", label: "Company", icon: Building2 },
  { id: "Investor", label: "Investor", icon: Landmark },
  { id: "Auditor", label: "Auditor", icon: ShieldCheck },
];

export function RoleSwitcher() {
  const { role, setRole } = useStore();
  return (
    <div className="glass flex items-center gap-1 rounded-full p-1">
      {roles.map((r) => {
        const Icon = r.icon;
        const active = role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
