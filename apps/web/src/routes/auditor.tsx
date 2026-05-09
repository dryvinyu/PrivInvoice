import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useMemo, useState } from "react";
import type { AuditReviewStatus, Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EncryptedField } from "@/components/priv/EncryptedField";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { AuditTimeline } from "@/components/priv/AuditTimeline";
import { StatusBadge } from "@/components/priv/StatusBadge";
import { mockAuditorAddress } from "@/lib/mock";
import {
  KeyRound,
  ShieldCheck,
  FileCheck2,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auditor")({
  head: () => ({
    meta: [
      { title: "Auditor - PrivInvoice" },
      {
        name: "description",
        content: "Permissioned compliance review with selective FHE decryption.",
      },
      { property: "og:title", content: "Auditor - PrivInvoice" },
      {
        property: "og:description",
        content: "Permissioned compliance review with selective FHE decryption.",
      },
    ],
  }),
  component: Auditor,
});

const reviewFilters: Array<"All" | AuditReviewStatus> = [
  "All",
  "PendingReview",
  "InfoRequested",
  "Approved",
  "Rejected",
];

function Auditor() {
  const { invoices, audit } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | AuditReviewStatus>("All");

  const assigned = useMemo(() => {
    return invoices
      .filter(
        (invoice) => invoice.auditorAccessGranted || invoice.auditorAddress === mockAuditorAddress,
      )
      .filter((invoice) => filter === "All" || invoice.auditReviewStatus === filter)
      .filter((invoice) => {
        const text = `${invoice.id} ${invoice.companyName} ${invoice.counterparty} ${invoice.industry}`;
        return text.toLowerCase().includes(query.toLowerCase());
      });
  }, [filter, invoices, query]);

  const pending = assigned.filter(
    (invoice) => invoice.auditReviewStatus === "PendingReview",
  ).length;
  const approved = assigned.filter((invoice) => invoice.auditReviewStatus === "Approved").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Auditor</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Permissioned Compliance Review
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Review assigned invoices, decrypt authorized fields, record decisions, and produce audit
            reports.
          </p>
        </div>
        <div className="flex gap-2">
          <PrivacyBadge label="ACL Enforced" />
          <PrivacyBadge label="Decryption Logged" tone="warm" />
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <QueueCard label="Assigned Cases" value={assigned.length} />
        <QueueCard label="Pending Review" value={pending} />
        <QueueCard label="Approved Reports" value={approved} />
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoice, company, buyer"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {reviewFilters.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "outline"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {assigned.map((i) => (
            <AuditorAccessCard key={i.onchainId} invoice={i} />
          ))}
          {assigned.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No assigned audit cases match the current filters.
            </div>
          ) : null}
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
  const { decryptInvoice, approveAudit, rejectAudit, requestAuditInfo } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [notes, setNotes] = useState(invoice.auditNotes ?? "");
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

  async function review(
    action: "approve" | "reject" | "info",
    handler: (invoice: Invoice, notes: string) => Promise<void>,
  ) {
    setReviewing(action);
    try {
      await handler(invoice, notes);
      toast.success("Audit review updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm">{invoice.id}</p>
          <p className="text-xs text-muted-foreground">
            {invoice.companyName} / {invoice.counterparty} / {invoice.industry}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <StatusBadge status={invoice.status} />
          <PrivacyBadge
            label={invoice.auditReviewStatus}
            tone={reviewTone(invoice.auditReviewStatus)}
          />
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
                  Rule: requested {"<="} 80% invoice /{" "}
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

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.9fr]">
            <div className="space-y-3">
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add review notes, buyer confirmation, or exception reason"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => review("approve", approveAudit)}
                  disabled={!!reviewing}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {reviewing === "approve" ? "Saving..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => review("info", requestAuditInfo)}
                  disabled={!!reviewing}
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  Request Info
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => review("reject", rejectAudit)}
                  disabled={!!reviewing}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Evidence Checklist
              </p>
              <div className="mt-2 space-y-2">
                {invoice.evidenceChecklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    <span
                      className={
                        item.completed
                          ? "h-2 w-2 rounded-full bg-primary"
                          : "h-2 w-2 rounded-full bg-muted-foreground"
                      }
                    />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              {invoice.auditReportHash ? (
                <p className="mt-3 truncate font-mono text-xs text-muted-foreground">
                  {invoice.auditReportHash}
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QueueCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function reviewTone(status: AuditReviewStatus) {
  if (status === "Approved") return "emerald";
  if (status === "Rejected") return "destructive";
  if (status === "NotRequested") return "muted";
  return "warm";
}
