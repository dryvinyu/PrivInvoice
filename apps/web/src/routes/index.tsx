import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import {
  ArrowRight,
  Lock,
  ShieldCheck,
  EyeOff,
  Landmark,
  FileCheck2,
  Globe2,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ScrollText,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="relative">
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-2">
          <div>
            <PrivacyBadge label="Powered by Zama FHE" />
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Confidential <span className="text-gradient-emerald">RWA Invoice</span> Financing
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              PrivInvoice enables SMEs to finance real-world invoices onchain while keeping invoice
              amounts, financing requests, and credit scores encrypted using Zama FHE.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-linear-to-r from-primary to-warm text-primary-foreground shadow-glow"
              >
                <Link to="/company">
                  Launch App <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/marketplace">View Demo Flow</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <PrivacyBadge label="Encrypted Onchain" />
              <PrivacyBadge label="FHE Evaluated" tone="warm" />
              <PrivacyBadge label="Compliance Ready" tone="muted" />
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <Features />
      <Problem />
      <Solution />
      <CTA />
    </main>
  );
}

function HeroPreview() {
  const rows = [
    { label: "Invoice Amount", value: "Encrypted", icon: Lock },
    { label: "Requested Financing", value: "Encrypted", icon: Lock },
    { label: "Credit Score", value: "Encrypted", icon: Lock },
    { label: "Eligibility", value: "Verified", icon: CheckCircle2, tone: "emerald" },
    { label: "Auditor Access", value: "Permissioned", icon: KeyRound, tone: "warm" },
  ] as const;
  return (
    <div className="relative">
      <div className="absolute -inset-12 bg-[radial-gradient(ellipse_at_center,var(--primary)/.18,transparent_60%)] blur-2xl" />
      <div className="glass-strong relative rounded-3xl p-6 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Confidential Invoice
            </p>
            <p className="font-mono text-sm">INV-2026-001 · Manufacturing</p>
          </div>
          <PrivacyBadge label="FHE Evaluated" />
        </div>
        <div className="space-y-2">
          {rows.map((r) => {
            const Icon = r.icon;
            const tone =
              "tone" in r
                ? r.tone === "emerald"
                  ? "text-primary"
                  : "text-warm"
                : "text-muted-foreground";
            return (
              <div
                key={r.label}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span className={`inline-flex items-center gap-1.5 font-mono text-sm ${tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {r.value}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-linear-to-r from-primary/15 to-warm/10 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Eligibility computed over encrypted values
          </span>
          <span className="font-mono text-xs text-primary">euint64</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: Lock,
    title: "Encrypted Invoice Data",
    desc: "Invoice amounts, requests, and credit scores stay encrypted onchain via Zama FHE.",
  },
  {
    icon: ShieldCheck,
    title: "FHE-based Eligibility",
    desc: "Smart contracts compute financing eligibility directly on encrypted inputs.",
  },
  {
    icon: EyeOff,
    title: "Selective Auditor Disclosure",
    desc: "Companies grant per-invoice ACL access for permissioned compliance review.",
  },
  {
    icon: Landmark,
    title: "Investor Marketplace",
    desc: "Investors fund verified invoices without seeing sensitive SME data.",
  },
  {
    icon: FileCheck2,
    title: "Compliance-first",
    desc: "Audit trails and decryption logs are designed for regulated finance.",
  },
  {
    icon: Globe2,
    title: "Real-world RWA",
    desc: "Bridge offchain SME receivables into onchain capital markets.",
  },
];

function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="mb-12 max-w-2xl">
        <PrivacyBadge label="Platform" />
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Built for SMEs, investors, auditors, and RWA financing workflows.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="glass group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-warm/20 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Problem() {
  const exposed = [
    "Invoice amount",
    "Financing amount",
    "Credit score",
    "Business cash flow",
    "Investor activity",
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="glass-strong rounded-3xl p-8 md:p-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <PrivacyBadge label="The Problem" tone="destructive" />
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Public blockchains expose business-sensitive financing data.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Onchain transparency is a feature for assets — but a liability for private commercial
              relationships. SMEs cannot publish their receivables and credit profiles in plaintext.
            </p>
          </div>
          <ul className="grid gap-3">
            {exposed.map((e) => (
              <li
                key={e}
                className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4"
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm">{e}</span>
                <span className="ml-auto font-mono text-xs text-destructive">PUBLIC</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const steps = [
    {
      icon: Building2,
      title: "SME submits encrypted invoice data",
      desc: "Client-side FHE encryption of amount, request, credit score.",
    },
    {
      icon: ShieldCheck,
      title: "Contract evaluates eligibility on ciphertexts",
      desc: "FHE comparison runs over euint values without decryption.",
    },
    {
      icon: Landmark,
      title: "Investors fund eligible invoices",
      desc: "Public terms only: APR, tenor, industry, eligibility.",
    },
    {
      icon: KeyRound,
      title: "Auditors decrypt only authorized records",
      desc: "Per-invoice ACL access for compliance review.",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <div className="mb-12 max-w-2xl">
        <PrivacyBadge label="The Solution" />
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Eligibility is computed without exposing raw invoice values.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="glass relative rounded-2xl p-6">
              <span className="absolute right-4 top-4 font-mono text-xs text-muted-foreground">
                0{i + 1}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="glass-strong relative overflow-hidden rounded-3xl p-10 text-center shadow-elegant">
        <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-warm/10" />
        <div className="relative">
          <ScrollText className="mx-auto h-8 w-8 text-primary" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Selective disclosure. Real compliance. Zero leakage.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Try the demo across Company, Investor, and Auditor roles.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-linear-to-r from-primary to-warm text-primary-foreground shadow-glow"
            >
              <Link to="/company">Launch App</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
