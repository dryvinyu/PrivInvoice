import { createFileRoute } from "@tanstack/react-router";
import { CreateInvoiceForm } from "@/components/priv/CreateInvoiceForm";
import { InvoiceCard } from "@/components/priv/InvoiceCard";
import { InvoiceDetailModal } from "@/components/priv/InvoiceDetailModal";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { StatCard } from "@/components/priv/StatCard";
import { FileText, ShieldCheck, Coins, Lock } from "lucide-react";

export const Route = createFileRoute("/company")({
  head: () => ({
    meta: [
      { title: "Company Dashboard — PrivInvoice" },
      {
        name: "description",
        content: "Submit confidential invoice financing requests with FHE-encrypted fields.",
      },
      { property: "og:title", content: "Company Dashboard — PrivInvoice" },
      { property: "og:description", content: "Submit confidential invoice financing requests." },
    ],
  }),
  component: Company,
});

function Company() {
  const { invoices } = useStore();
  const [open, setOpen] = useState<Invoice | null>(null);
  const eligible = invoices.filter((i) => i.status === "Eligible").length;
  const funded = invoices.filter((i) => i.status === "Funded").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Company</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">SME Financing Console</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Submit and manage confidential invoice financing requests. Sensitive fields are encrypted
          client-side via FHE before being stored onchain.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total Invoices" value={invoices.length} icon={FileText} />
        <StatCard label="Eligible" value={eligible} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Funded" value={funded} icon={Coins} tone="warm" />
        <StatCard label="Privacy" value="FHE Onchain" icon={Lock} hint="euint64 / euint32" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <CreateInvoiceForm />
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Invoice Requests</h2>
            <span className="text-xs text-muted-foreground">{invoices.length} total</span>
          </div>
          <div className="grid gap-3">
            {invoices.map((i) => (
              <InvoiceCard
                key={i.onchainId}
                invoice={i}
                showCompanyActions
                onOpen={(inv) => setOpen(inv)}
              />
            ))}
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
