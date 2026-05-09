import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { RoleSwitcher } from "./RoleSwitcher";

const links = [
  { to: "/", label: "Overview" },
  { to: "/company", label: "Company" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/auditor", label: "Auditor" },
  { to: "/docs", label: "Docs" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-warm shadow-glow">
            <Lock className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Priv<span className="text-gradient-emerald">Invoice</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm text-foreground bg-muted" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* <div className="hidden md:block">
            <RoleSwitcher />
          </div> */}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
