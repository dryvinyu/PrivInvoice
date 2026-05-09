import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useState } from "react";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EncryptedField } from "@/components/priv/EncryptedField";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { AuditTimeline } from "@/components/priv/AuditTimeline";
import { StatusBadge } from "@/components/priv/StatusBadge";
import { KeyRound, ShieldCheck, FileCheck2, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auditor")({
  head: () => ({
    meta: [
      { title: "Auditor — PrivInvoice" },
      {
        name: "description",
        content: "Permissioned compliance review with selective FHE decryption.",
      },
      { property: "og:title", content: "Auditor — PrivInvoice" },
      {
        property: "og:description",
        content: "Permissioned compliance review with selective FHE decryption.",
      },
    ],
  }),
  component: Auditor,
});

function Auditor() {
  const { invoices, audit } = useStore();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Auditor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Permissioned Compliance Review
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Auditors can decrypt sensitive invoice fields only after receiving access from the
            company. Every decryption is logged onchain.
          </p>
        </div>
        <div className="flex gap-2">
          <PrivacyBadge label="ACL Enforced" />
          <PrivacyBadge label="Decryption Logged" tone="warm" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {invoices.map((i) => (
            <AuditorAccessCard key={i.onchainId} invoice={i} />
          ))}
        </div>
        <aside className="glass-strong h-fit rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Compliance Activity Log</h3>
          </div>
          <AuditTimeline events={audit.slice(0, 8)} />
        </aside>
      </div>
    </main>
  );
}

function AuditorAccessCard({ invoice }: { invoice: Invoice }) {
  const { decryptInvoice } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const granted = invoice.auditorAccessGranted;
  const canShowPrivateValues = revealed && invoice.privateValuesLoaded;
  const ruleOk =
    invoice.privateValuesLoaded && invoice.requestedAmount <= invoice.invoiceAmount * 0.8;
  const compliancePassed = ruleOk && invoice.creditScore >= 650;

  async function decrypt() {
    setDecrypting(true);
    try {
      await decryptInvoice(invoice);
      setRevealed(true);
      toast.success("Authorized data decrypted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decryption failed");
    } finally {
      setDecrypting(false);
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm">{invoice.id}</p>
          <p className="text-xs text-muted-foreground">
            {invoice.company} · {invoice.industry}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={invoice.status} />
          {granted ? (
            <PrivacyBadge label="Access Granted" tone="warm" />
          ) : (
            <PrivacyBadge label="Access Not Granted" tone="muted" />
          )}
        </div>
      </div>

      {!granted ? (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Decryption disabled</p>
              <p className="text-xs text-muted-foreground">
                The company has not granted auditor ACL access.
              </p>
            </div>
          </div>
          <Button disabled variant="outline" size="sm">
            Decrypt Data
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <EncryptedField
              label="Invoice Amount"
              value={`${invoice.invoiceAmount.toLocaleString()} USDZ`}
              reveal={canShowPrivateValues}
            />
            <EncryptedField
              label="Requested Financing"
              value={`${invoice.requestedAmount.toLocaleString()} USDZ`}
              reveal={canShowPrivateValues}
            />
            <EncryptedField
              label="Credit Score"
              value={invoice.creditScore}
              reveal={canShowPrivateValues}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={decrypt}
              disabled={decrypting || canShowPrivateValues}
              size="sm"
              className="gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {decrypting
                ? "Decrypting..."
                : canShowPrivateValues
                  ? "Decrypted"
                  : "Decrypt Authorized Data"}
            </Button>
            {canShowPrivateValues && (
              <>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  Rule: requested ≤ 80% invoice ·{" "}
                  <span className={ruleOk ? "text-primary" : "text-destructive"}>
                    {ruleOk ? "OK" : "Failed"}
                  </span>
                </span>
                <PrivacyBadge
                  label={compliancePassed ? "Compliance Passed" : "Compliance Failed"}
                  tone={compliancePassed ? "emerald" : "destructive"}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
