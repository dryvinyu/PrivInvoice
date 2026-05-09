import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invoice } from "@/lib/types";
import { EncryptedField } from "./EncryptedField";
import { PrivacyBadge } from "./PrivacyBadge";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function InvestorFundingModal({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { fundInvoice } = useStore();
  const [amount, setAmount] = useState("10000");
  const [submitting, setSubmitting] = useState(false);
  if (!invoice) return null;

  async function confirm() {
    if (!invoice) return;
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Enter a valid investment amount");
      return;
    }

    setSubmitting(true);
    try {
      await fundInvoice(invoice, parsedAmount);
      toast.success("Investment submitted onchain.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Investment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Fund Confidential Invoice</DialogTitle>
          <DialogDescription>
            Public terms are visible. Sensitive fields stay encrypted via Zama FHE.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          <Term label="APR" value={`${invoice.apr}%`} />
          <Term label="Due" value={`${invoice.dueDays}d`} />
          <Term label="Industry" value={invoice.industry} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <EncryptedField label="Invoice Amount" value="" />
          <EncryptedField label="Credit Score" value="" />
        </div>

        <div className="flex flex-wrap gap-2">
          <PrivacyBadge label="Eligibility Verified" />
          <PrivacyBadge label="FHE Evaluated" tone="warm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Investment Amount (USDZ)
          </Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
        </div>

        <Button
          onClick={confirm}
          disabled={submitting}
          className="w-full bg-linear-to-r from-primary to-warm text-primary-foreground shadow-glow"
        >
          {submitting ? "Submitting..." : "Confirm Investment"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
