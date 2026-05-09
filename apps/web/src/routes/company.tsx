import { createFileRoute } from "@tanstack/react-router";
import { CreateInvoiceForm } from "@/components/priv/CreateInvoiceForm";
import { InvoiceCard } from "@/components/priv/InvoiceCard";
import { InvoiceDetailModal } from "@/components/priv/InvoiceDetailModal";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { StatCard } from "@/components/priv/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { chainConfig } from "@/lib/chain/config";
import { mockCompanyAddress } from "@/lib/mock";
import { FileText, ShieldCheck, Coins, Lock, Banknote, Search } from "lucide-react";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company Dashboard - PrivInvoice" },
      {
        name: "description",
        content: "Submit confidential invoice financing requests with FHE-encrypted fields.",
      },
      { property: "og:title", content: "Company Dashboard - PrivInvoice" },
      { property: "og:description", content: "Submit confidential invoice financing requests." },
    ],
  }),
  component: Company,
});

const statusFilters: Array<"All" | InvoiceStatus> = [
  "All",
  "Created",
  "Eligible",
  "Funded",
  "Repaid",
  "Rejected",
];

function Company() {
  const { invoices } = useStore();
  const [open, setOpen] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<"All" | InvoiceStatus>("All");
  const [query, setQuery] = useState("");

  const companyInvoices = useMemo(() => {
    const base = chainConfig.mockDataEnabled
      ? invoices.filter((invoice) => invoice.company === mockCompanyAddress)
      : invoices;
    return base.filter((invoice) => {
      const matchesStatus = status === "All" || invoice.status === status;
      const text = `${invoice.id} ${invoice.companyName} ${invoice.counterparty} ${invoice.industry}`;
      return matchesStatus && text.toLowerCase().includes(query.toLowerCase());
    });
  }, [invoices, query, status]);

  const eligible = companyInvoices.filter((i) => i.status === "Eligible").length;
  const funded = companyInvoices.filter((i) => i.status === "Funded").length;
  const receivables = companyInvoices.reduce((sum, item) => sum + item.fundingTarget, 0);
  const repaid = companyInvoices.filter((i) => i.status === "Repaid").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Company</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">SME Financing Console</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Submit, review, audit, fund, and repay confidential invoice financing requests.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="My Invoices" value={companyInvoices.length} icon={FileText} />
        <StatCard label="Eligible" value={eligible} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Funded" value={funded} icon={Coins} tone="warm" />
        <StatCard label="Repaid" value={repaid} icon={Banknote} />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <CompanyProfile total={receivables} />
        <WorkflowPanel invoices={companyInvoices} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <CreateInvoiceForm />
        <div>
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invoice Requests</h2>
              <span className="text-xs text-muted-foreground">{companyInvoices.length} shown</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={status === item ? "default" : "outline"}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search invoice, buyer, industry"
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-3">
            {companyInvoices.map((i) => (
              <InvoiceCard
                key={i.onchainId}
                invoice={i}
                showCompanyActions
                onOpen={(inv) => setOpen(inv)}
              />
            ))}
            {companyInvoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                No invoices match the current filters.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <InvoiceDetailModal
        invoice={open}
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        canDecrypt
      />
    </main>
  );
}

function CompanyProfile({ total }: { total: number }) {
  return (
    <section className="glass-strong rounded-2xl p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Company Profile</p>
          <h2 className="mt-1 text-lg font-semibold">Northstar Components LLC</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified supplier profile for receivables financing.
          </p>
        </div>
        <PrivacyBadge label="KYC Verified" tone="emerald" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ProfileItem
          label="Wallet"
          value={`${mockCompanyAddress.slice(0, 8)}...${mockCompanyAddress.slice(-6)}`}
        />
        <ProfileItem label="Receivables" value={`${total.toLocaleString()} USDZ`} />
        <ProfileItem label="Documents" value="Invoice PDF / PO / BOL" />
      </div>
    </section>
  );
}

function WorkflowPanel({ invoices }: { invoices: Invoice[] }) {
  const needsAudit = invoices.filter((item) => item.auditReviewStatus === "NotRequested").length;
  const infoRequested = invoices.filter(
    (item) => item.auditReviewStatus === "InfoRequested",
  ).length;
  const openFunding = invoices.filter((item) => item.status === "Eligible").length;
  return (
    <section className="glass-strong rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Operations Queue</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <ProfileItem label="Needs Auditor" value={String(needsAudit)} />
        <ProfileItem label="Info Requested" value={String(infoRequested)} />
        <ProfileItem label="Open Funding" value={String(openFunding)} />
      </div>
    </section>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}
