import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { PrivacyBadge } from "./PrivacyBadge";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

const industries = ["Manufacturing", "Logistics", "SaaS", "Energy", "Healthcare"];

export function CreateInvoiceForm() {
  const { createInvoice, walletConnected } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState("");
  const [form, setForm] = useState({
    id: `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
    invoiceHash: "ipfs://Qm",
    industry: "Manufacturing",
    dueDays: "60",
    apr: "8",
    invoiceAmount: "",
    requestedAmount: "",
    creditScore: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(form.invoiceAmount);
    const req = Number(form.requestedAmount);
    const cs = Number(form.creditScore);
    if (!amt || !req || !cs) {
      toast.error("Please complete all encrypted fields");
      return;
    }
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setSubmitting(true);
    setSubmitStage("Connecting wallet...");
    try {
      await createInvoice({
        id: form.id,
        invoiceHash: form.invoiceHash,
        industry: form.industry,
        dueDays: Number(form.dueDays),
        apr: Number(form.apr),
        invoiceAmount: amt,
        requestedAmount: req,
        creditScore: cs,
        onProgress: (message) => {
          setSubmitStage(message);
          toast.loading(message, { id: "create-invoice-progress" });
        },
      });
      toast.dismiss("create-invoice-progress");
      toast.success("Encrypted invoice request submitted onchain.");
      setForm((s) => ({
        ...s,
        id: `INV-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
        invoiceAmount: "",
        requestedAmount: "",
        creditScore: "",
      }));
    } catch (error) {
      toast.dismiss("create-invoice-progress");
      console.error("[PrivInvoice] Failed to submit invoice", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit invoice");
    } finally {
      setSubmitting(false);
      setSubmitStage("");
    }
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-2xl p-6 shadow-elegant">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Create Confidential Invoice Request</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sensitive business data remains encrypted onchain.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Lock className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Invoice ID">
          <Input value={form.id} onChange={(e) => set("id", e.target.value)} />
        </Field>
        <Field label="Invoice Hash">
          <Input value={form.invoiceHash} onChange={(e) => set("invoiceHash", e.target.value)} />
        </Field>
        <Field label="Industry">
          <Select value={form.industry} onValueChange={(v) => set("industry", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {industries.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due Days">
            <Select value={form.dueDays} onValueChange={(v) => set("dueDays", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["30", "60", "90"].map((i) => (
                  <SelectItem key={i} value={i}>
                    {i} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="APR">
            <Select value={form.apr} onValueChange={(v) => set("apr", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["6", "8", "10", "12"].map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <EncField
          label="Invoice Amount (USDZ)"
          value={form.invoiceAmount}
          onChange={(v) => set("invoiceAmount", v)}
          placeholder="100000"
        />
        <EncField
          label="Requested Financing (USDZ)"
          value={form.requestedAmount}
          onChange={(v) => set("requestedAmount", v)}
          placeholder="75000"
        />
        <EncField
          label="Credit Score"
          value={form.creditScore}
          onChange={(v) => set("creditScore", v)}
          placeholder="720"
          className="md:col-span-2"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full gap-2 bg-linear-to-r from-primary to-warm text-primary-foreground shadow-glow hover:opacity-95"
      >
        <Sparkles className="h-4 w-4" />
        {submitting ? submitStage || "Submitting..." : "Submit Encrypted Invoice"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EncField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        <PrivacyBadge label="Encrypted before submission" />
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono"
      />
    </div>
  );
}
