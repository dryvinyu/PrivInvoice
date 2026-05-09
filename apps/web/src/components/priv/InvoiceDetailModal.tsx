import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { AuditEvent, Invoice } from "@/lib/types";
import { EncryptedField } from "./EncryptedField";
import { StatusBadge } from "./StatusBadge";
import { PrivacyBadge } from "./PrivacyBadge";
import { AuditTimeline } from "./AuditTimeline";
import { useStore } from "@/lib/store";
import { Building2, Calendar, Percent, Hash, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

export function InvoiceDetailModal({
  invoice,
  open,
  onOpenChange,
  canDecrypt = false,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canDecrypt?: boolean;
}) {
  const { audit, invoices, decryptInvoice } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const current = invoice
    ? (invoices.find((i) => i.onchainId === invoice.onchainId) ?? invoice)
    : null;

  useEffect(() => {
    setRevealed(false);
  }, [invoice?.onchainId]);

  if (!current) return null;
  const events: AuditEvent[] = audit.filter((e) => e.invoiceId === current.id);
  const fundedPct = current.status === "Funded" ? 100 : current.status === "Eligible" ? 35 : 0;
  const fundedWidthClass =
    current.status === "Funded" ? "w-full" : current.status === "Eligible" ? "w-[35%]" : "w-0";
  const privateReveal = canDecrypt && revealed && current.privateValuesLoaded;

  async function toggleDecryption() {
    if (!current) return;
    if (revealed) {
      setRevealed(false);
      return;
    }
    if (!current.privateValuesLoaded) {
      setDecrypting(true);
      try {
        await decryptInvoice(current);
        toast.success("Authorized data decrypted.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Decryption failed");
        setDecrypting(false);
        return;
      } finally {
        setDecrypting(false);
      }
    }
    setRevealed(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-strong">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="font-mono">{current.id}</DialogTitle>
            <StatusBadge status={current.status} />
          </div>
          <DialogDescription>
            {current.industry} · {current.dueDays}d · {current.apr}% APR
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 grid grid-cols-2 gap-3">
            <Meta icon={Hash} label="Invoice ID" value={current.id} />
            <Meta icon={Building2} label="Industry" value={current.industry} />
            <Meta icon={Calendar} label="Due Days" value={`${current.dueDays} days`} />
            <Meta icon={Percent} label="APR" value={`${current.apr}%`} />
            <Meta icon={Hash} label="Hash" value={current.invoiceHash} mono />
            <Meta icon={Building2} label="Company" value={current.company} mono />
          </TabsContent>

          <TabsContent value="privacy" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              These values are stored and processed as encrypted values. Smart contracts evaluate
              eligibility without revealing raw business data.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <EncryptedField
                label="Invoice Amount"
                value={`${current.invoiceAmount.toLocaleString()} USDZ`}
                reveal={privateReveal}
              />
              <EncryptedField
                label="Requested Financing"
                value={`${current.requestedAmount.toLocaleString()} USDZ`}
                reveal={privateReveal}
              />
              <EncryptedField
                label="Credit Score"
                value={current.creditScore}
                reveal={privateReveal}
              />
            </div>
            {canDecrypt && (
              <Button
                onClick={toggleDecryption}
                disabled={decrypting}
                variant="outline"
                className="w-full"
              >
                {decrypting
                  ? "Decrypting..."
                  : revealed
                    ? "Hide Decrypted Values"
                    : "Decrypt Authorized Data"}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="funding" className="mt-4 space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Funding Progress</span>
                <span className="font-mono">{fundedPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className={`h-full rounded-full bg-linear-to-r from-primary to-warm transition-all ${fundedWidthClass}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrivacyBadge
                label="Eligibility Verified"
                tone={
                  current.status === "Eligible" || current.status === "Funded" ? "emerald" : "muted"
                }
              />
              <PrivacyBadge
                label={`Risk: ${current.riskLevel}`}
                tone={
                  current.riskLevel === "Low"
                    ? "emerald"
                    : current.riskLevel === "High"
                      ? "destructive"
                      : "warning"
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <PrivacyBadge
                label={
                  current.auditorAccessGranted ? "Auditor Access Granted" : "Auditor Access Pending"
                }
                tone={current.auditorAccessGranted ? "warm" : "muted"}
              />
            </div>
            <AuditTimeline events={events} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={`mt-1 truncate text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
