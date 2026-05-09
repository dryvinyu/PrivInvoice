import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PrivacyBadge } from "./PrivacyBadge";
import { StatusBadge } from "./StatusBadge";
import { Building2, KeyRound, ShieldCheck, FileText, Ban, Banknote } from "lucide-react";
import { toast } from "sonner";

export function InvoiceCard({
  invoice,
  onOpen,
  showCompanyActions = false,
}: {
  invoice: Invoice;
  onOpen?: (i: Invoice) => void;
  showCompanyActions?: boolean;
}) {
  const { evaluateInvoice, finalizeEligibility, grantAuditorAccess, markRepaid, cancelInvoice } =
    useStore();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(label: string, action: () => Promise<void>, success: string) {
    setBusy(label);
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  function evaluate() {
    void run(
      "evaluate",
      () => evaluateInvoice(invoice),
      "Encrypted eligibility evaluation submitted.",
    );
  }

  function finalize() {
    void run("finalize", () => finalizeEligibility(invoice), "Eligibility finalized.");
  }

  function grant() {
    void run("grant", () => grantAuditorAccess(invoice), "Auditor access granted.");
  }

  function repay() {
    void run("repay", () => markRepaid(invoice), "Invoice marked repaid.");
  }

  function cancel() {
    void run(
      "cancel",
      () => cancelInvoice(invoice, "Cancelled by company before investor funding."),
      "Invoice cancelled.",
    );
  }

  const canCancel =
    showCompanyActions && (invoice.status === "Created" || invoice.status === "Eligible");

  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm/15 text-warm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium">{invoice.id}</p>
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {invoice.companyName} / {invoice.counterparty}
            </p>
          </div>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Cell label="Invoice" />
        <Cell label="Requested" />
        <Cell label="Credit" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>{invoice.industry}</span>
        <span className="text-right">
          {invoice.dueDays}d / {invoice.apr}% APR
        </span>
        <span>Due {invoice.repaymentDueDate}</span>
        <span className="text-right">Target {invoice.fundingTarget.toLocaleString()} USDZ</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <PrivacyBadge label={invoice.hasEvaluation ? "FHE Evaluated" : "Awaiting FHE Evaluation"} />
        <PrivacyBadge
          label={`Audit: ${invoice.auditReviewStatus}`}
          tone={
            invoice.auditReviewStatus === "Approved"
              ? "emerald"
              : invoice.auditReviewStatus === "Rejected"
                ? "destructive"
                : invoice.auditReviewStatus === "NotRequested"
                  ? "muted"
                  : "warm"
          }
        />
      </div>

      {(showCompanyActions || onOpen) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {showCompanyActions && invoice.status === "Created" && !invoice.hasEvaluation && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={evaluate}
              disabled={!!busy}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {busy === "evaluate" ? "Evaluating..." : "Evaluate Eligibility"}
            </Button>
          )}
          {showCompanyActions && invoice.status === "Created" && invoice.hasEvaluation && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={finalize}
              disabled={!!busy}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {busy === "finalize" ? "Finalizing..." : "Finalize Eligibility"}
            </Button>
          )}
          {showCompanyActions && !invoice.auditorAccessGranted && invoice.status !== "Rejected" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-warm hover:text-warm"
              onClick={grant}
              disabled={!!busy}
            >
              <KeyRound className="h-3.5 w-3.5" />
              {busy === "grant" ? "Granting..." : "Grant Auditor Access"}
            </Button>
          )}
          {showCompanyActions && invoice.status === "Funded" && (
            <Button size="sm" variant="outline" className="gap-1" onClick={repay} disabled={!!busy}>
              <Banknote className="h-3.5 w-3.5" />
              {busy === "repay" ? "Marking..." : "Mark Repaid"}
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="ghost" className="gap-1" onClick={cancel} disabled={!!busy}>
              <Ban className="h-3.5 w-3.5" />
              {busy === "cancel" ? "Cancelling..." : "Cancel"}
            </Button>
          )}
          {onOpen && (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onOpen(invoice)}>
              View Details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Cell({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xs tracking-wider text-muted-foreground">ENCRYPTED</p>
    </div>
  );
}
