import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { StatusBadge } from "@/components/priv/StatusBadge";
import { InvestorFundingModal } from "@/components/priv/InvestorFundingModal";
import { InvoiceDetailModal } from "@/components/priv/InvoiceDetailModal";
import { Coins, ShieldCheck, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/priv/StatCard";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — PrivInvoice" },
      {
        name: "description",
        content:
          "Confidential invoice marketplace. Invest in verified RWA invoices without exposing sensitive SME data.",
      },
      { property: "og:title", content: "Confidential Invoice Marketplace — PrivInvoice" },
      {
        property: "og:description",
        content: "Invest in verified RWA invoices without exposing sensitive SME data.",
      },
    ],
  }),
  component: Marketplace,
});

function Marketplace() {
  const { invoices } = useStore();
  const [funding, setFunding] = useState<Invoice | null>(null);
  const [details, setDetails] = useState<Invoice | null>(null);
  const open = invoices.filter((i) => i.status === "Eligible" || i.status === "Funded");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Confidential Invoice Marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Invest in verified RWA invoice opportunities without exposing sensitive SME data.
          </p>
        </div>
        <div className="flex gap-2">
          <PrivacyBadge label="FHE Verified" />
          <PrivacyBadge label="Eligibility Onchain" tone="warm" />
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Open Opportunities" value={open.length} icon={TrendingUp} tone="emerald" />
        <StatCard
          label="Eligible"
          value={invoices.filter((i) => i.status === "Eligible").length}
          icon={ShieldCheck}
        />
        <StatCard
          label="Funded"
          value={invoices.filter((i) => i.status === "Funded").length}
          icon={Coins}
          tone="warm"
        />
      </div>

      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="hidden grid-cols-[1.1fr_1fr_.6fr_.5fr_.5fr_.6fr_.7fr_.7fr_auto] gap-4 border-b border-border/60 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
          <span>Invoice</span>
          <span>Company</span>
          <span>Industry</span>
          <span>Due</span>
          <span>APR</span>
          <span>Risk</span>
          <span>Invoice Amt</span>
          <span>Credit</span>
          <span>Action</span>
        </div>

        {open.length === 0 ? (
          <EmptyState />
        ) : (
          open.map((i) => (
            <Row
              key={i.onchainId}
              invoice={i}
              onInvest={() => setFunding(i)}
              onView={() => setDetails(i)}
            />
          ))
        )}
      </div>

      <InvestorFundingModal
        invoice={funding}
        open={!!funding}
        onOpenChange={(o) => !o && setFunding(null)}
      />
      <InvoiceDetailModal
        invoice={details}
        open={!!details}
        onOpenChange={(o) => !o && setDetails(null)}
      />
    </main>
  );
}

function Row({
  invoice,
  onInvest,
  onView,
}: {
  invoice: Invoice;
  onInvest: () => void;
  onView: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-border/40 px-6 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[1.1fr_1fr_.6fr_.5fr_.5fr_.6fr_.7fr_.7fr_auto]">
      <div>
        <p className="font-mono text-sm">{invoice.id}</p>
        <StatusBadge status={invoice.status} className="mt-1 md:hidden" />
      </div>
      <p className="font-mono text-xs text-muted-foreground">{invoice.company}</p>
      <p className="text-sm">{invoice.industry}</p>
      <p className="text-sm">{invoice.dueDays}d</p>
      <p className="text-sm">{invoice.apr}%</p>
      <p className="text-sm">
        <span
          className={
            invoice.riskLevel === "Low"
              ? "text-primary"
              : invoice.riskLevel === "High"
                ? "text-destructive"
                : "text-warning"
          }
        >
          {invoice.riskLevel}
        </span>
      </p>
      <p className="font-mono text-xs text-muted-foreground">••• ENC •••</p>
      <p className="font-mono text-xs text-muted-foreground">••• ENC •••</p>
      <div className="col-span-2 flex gap-2 md:col-span-1">
        <Button size="sm" variant="ghost" onClick={onView}>
          View
        </Button>
        <Button
          size="sm"
          onClick={onInvest}
          disabled={invoice.status !== "Eligible"}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {invoice.status === "Funded" ? "Funded" : "Invest"}
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <Coins className="h-8 w-8 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">
        No eligible invoices yet. Have a Company submit one from the dashboard.
      </p>
    </div>
  );
}
