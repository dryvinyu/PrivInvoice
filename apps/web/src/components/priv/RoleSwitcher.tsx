import { Building2, Landmark, ShieldCheck, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

const roles: { id: Role; label: string; icon: LucideIcon; to: string }[] = [
  { id: "Company", label: "Company", icon: Building2, to: "/company" },
  { id: "Investor", label: "Investor", icon: Landmark, to: "/marketplace" },
  { id: "Auditor", label: "Auditor", icon: ShieldCheck, to: "/auditor" },
];

export function RoleSwitcher() {
  const { role, setRole } = useStore();
  const navigate = useNavigate();

  function selectRole(nextRole: (typeof roles)[number]) {
    setRole(nextRole.id);
    void navigate({ to: nextRole.to });
  }

  return (
    <div className="glass flex items-center gap-1 rounded-full p-1">
      {roles.map((r) => {
        const Icon = r.icon;
        const active = role === r.id;
        return (
          <button
            key={r.id}
            onClick={() => selectRole(r)}
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
