import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Invoice, RiskLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { StatusBadge } from "@/components/priv/StatusBadge";
import { InvestorFundingModal } from "@/components/priv/InvestorFundingModal";
import { InvoiceDetailModal } from "@/components/priv/InvoiceDetailModal";
import { Coins, ShieldCheck, TrendingUp, Search, WalletCards } from "lucide-react";
import { StatCard } from "@/components/priv/StatCard";
import { mockInvestorAddress } from "@/lib/mock";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace - PrivInvoice" },
      {
        name: "description",
        content:
          "Confidential invoice marketplace. Invest in verified RWA invoices without exposing sensitive SME data.",
      },
      { property: "og:title", content: "Confidential Invoice Marketplace - PrivInvoice" },
      {
        property: "og:description",
        content: "Invest in verified RWA invoices without exposing sensitive SME data.",
      },
    ],
  }),
  component: Marketplace,
});

type SortKey = "apr" | "due" | "risk";

function Marketplace() {
  const { invoices } = useStore();
  const [funding, setFunding] = useState<Invoice | null>(null);
  const [details, setDetails] = useState<Invoice | null>(null);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<"All" | RiskLevel>("All");
  const [sort, setSort] = useState<SortKey>("apr");

  const opportunities = useMemo(() => {
    return invoices
      .filter((i) => i.status === "Eligible" || i.status === "Funded")
      .filter((invoice) => {
        const text = `${invoice.id} ${invoice.companyName} ${invoice.counterparty} ${invoice.industry}`;
        return text.toLowerCase().includes(query.toLowerCase());
      })
      .filter((invoice) => risk === "All" || invoice.riskLevel === risk)
      .sort((a, b) => {
        if (sort === "apr") return b.apr - a.apr;
        if (sort === "due") return a.dueDays - b.dueDays;
        return riskWeight(a.riskLevel) - riskWeight(b.riskLevel);
      });
  }, [invoices, query, risk, sort]);

  const portfolio = invoices.filter((i) => i.investor === mockInvestorAddress);
  const invested = portfolio.reduce((sum, item) => sum + item.publicFundingAmount, 0);
  const expectedYield = portfolio.reduce((sum, item) => sum + yieldFor(item), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Investor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Confidential Invoice Marketplace
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Compare verified receivables, fund eligible invoices, and track your portfolio.
          </p>
        </div>
        <div className="flex gap-2">
          <PrivacyBadge label="FHE Verified" />
          <PrivacyBadge label="Eligibility Onchain" tone="warm" />
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard
          label="Open Opportunities"
          value={opportunities.filter((i) => i.status === "Eligible").length}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard label="Portfolio" value={portfolio.length} icon={WalletCards} />
        <StatCard
          label="Invested"
          value={`${Math.round(invested).toLocaleString()} USDZ`}
          icon={Coins}
          tone="warm"
        />
        <StatCard
          label="Est. Yield"
          value={`${Math.round(expectedYield).toLocaleString()} USDZ`}
          icon={ShieldCheck}
        />
      </div>

      <PortfolioPanel portfolio={portfolio} />

      <div className="mb-4 mt-8 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, buyer, industry"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Low", "Medium", "High"] as Array<"All" | RiskLevel>).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={risk === item ? "default" : "outline"}
              onClick={() => setRisk(item)}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            ["apr", "APR"],
            ["due", "Due"],
            ["risk", "Risk"],
          ].map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={sort === id ? "default" : "outline"}
              onClick={() => setSort(id as SortKey)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-strong overflow-hidden rounded-2xl">
        <div className="hidden grid-cols-[1fr_1fr_.7fr_.5fr_.5fr_.6fr_.7fr_.7fr_auto] gap-4 border-b border-border/60 px-6 py-3 text-[11px] uppercase tracking-wider text-muted-foreground md:grid">
          <span>Invoice</span>
          <span>Company / Buyer</span>
          <span>Industry</span>
          <span>Due</span>
          <span>APR</span>
          <span>Risk</span>
          <span>Target</span>
          <span>Est. Yield</span>
          <span>Action</span>
        </div>

        {opportunities.length === 0 ? (
          <EmptyState />
        ) : (
          opportunities.map((i) => (
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

function PortfolioPanel({ portfolio }: { portfolio: Invoice[] }) {
  return (
    <section className="glass-strong rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">My Portfolio</p>
          <h2 className="mt-1 text-lg font-semibold">Funded Receivables</h2>
        </div>
        <PrivacyBadge label="Private fields hidden" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {portfolio.map((invoice) => (
          <div
            key={invoice.onchainId}
            className="rounded-xl border border-border/60 bg-muted/25 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-sm">{invoice.id}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{invoice.companyName}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span>Funded</span>
              <span className="text-right font-mono">
                {invoice.publicFundingAmount.toLocaleString()}
              </span>
              <span>Yield</span>
              <span className="text-right font-mono">{Math.round(yieldFor(invoice))}</span>
              <span>Maturity</span>
              <span className="text-right">{invoice.repaymentDueDate}</span>
            </div>
          </div>
        ))}
        {portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground">No funded positions yet.</p>
        ) : null}
      </div>
    </section>
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
  const progress = Math.min(
    100,
    Math.round((invoice.publicFundingAmount / invoice.fundingTarget) * 100),
  );
  return (
    <div className="grid grid-cols-2 gap-4 border-b border-border/40 px-6 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[1fr_1fr_.7fr_.5fr_.5fr_.6fr_.7fr_.7fr_auto]">
      <div>
        <p className="font-mono text-sm">{invoice.id}</p>
        <StatusBadge status={invoice.status} className="mt-1 md:hidden" />
      </div>
      <div>
        <p className="text-sm">{invoice.companyName}</p>
        <p className="truncate text-xs text-muted-foreground">{invoice.counterparty}</p>
      </div>
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
      <div className="text-xs">
        <p className="font-mono">{invoice.fundingTarget.toLocaleString()}</p>
        <p className="text-muted-foreground">{progress}% filled</p>
      </div>
      <p className="font-mono text-xs">{Math.round(yieldFor(invoice)).toLocaleString()} USDZ</p>
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
        No eligible invoices match the current filters.
      </p>
    </div>
  );
}

function yieldFor(invoice: Invoice) {
  const principal = invoice.publicFundingAmount || invoice.fundingTarget;
  return principal * (invoice.apr / 100) * (invoice.dueDays / 365);
}

function riskWeight(risk: RiskLevel) {
  if (risk === "Low") return 1;
  if (risk === "Medium") return 2;
  if (risk === "High") return 3;
  return 4;
}
