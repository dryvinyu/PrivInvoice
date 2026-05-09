import { createFileRoute } from "@tanstack/react-router";
import { PrivacyBadge } from "@/components/priv/PrivacyBadge";
import { Lock, Upload, Cpu, Shield, KeyRound, ScrollText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — PrivInvoice" },
      {
        name: "description",
        content: "How PrivInvoice uses Zama FHE for confidential invoice financing.",
      },
      { property: "og:title", content: "How PrivInvoice Uses Zama FHE" },
      {
        property: "og:description",
        content: "Architecture overview of the confidential RWA invoice financing dApp.",
      },
    ],
  }),
  component: Docs,
});

const cards = [
  {
    icon: Lock,
    title: "Frontend Encryption",
    desc: "Sensitive fields are encrypted in the browser before any RPC call.",
  },
  {
    icon: Upload,
    title: "Encrypted Input Submission",
    desc: "Ciphertexts are submitted as inputs to the smart contract function.",
  },
  {
    icon: Cpu,
    title: "FHE Smart Contract Evaluation",
    desc: "Eligibility logic runs on euint64 / euint32 ciphertexts.",
  },
  {
    icon: Shield,
    title: "ACL-based Access Control",
    desc: "Per-record permissions govern which addresses can decrypt.",
  },
  {
    icon: KeyRound,
    title: "User-side Decryption",
    desc: "Authorized parties decrypt locally; raw values never go onchain.",
  },
  {
    icon: ScrollText,
    title: "Compliance Audit Trail",
    desc: "Every access grant and decryption is recorded for review.",
  },
];

function Docs() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <PrivacyBadge label="Architecture" />
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
        How PrivInvoice Uses Zama FHE
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        PrivInvoice combines fully homomorphic encryption with public blockchains so SMEs can
        finance receivables without leaking sensitive business data.
      </p>

      <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="glass rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-12 glass-strong rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-semibold">Encrypted Submission Flow</h2>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {[
            "Browser",
            "Encrypt amount, request, credit score",
            "Submit ciphertext to contract",
            "Store as euint64 / euint32",
            "Evaluate eligibility (FHE)",
            "Grant auditor ACL",
            "Authorized decryption",
          ].map((step, i, arr) => (
            <div key={step} className="flex flex-1 items-center gap-3">
              <div className="flex h-full flex-1 flex-col rounded-xl border border-border/60 bg-muted/30 p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </span>
                <span className="mt-1 text-sm font-medium">{step}</span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <CodeBlock
          title="Solidity (sketch)"
          code={`function submitInvoice(
  einput encInvoiceAmt, einput encReqAmt, einput encScore,
  bytes calldata proof
) external {
  euint64 amt   = TFHE.asEuint64(encInvoiceAmt, proof);
  euint64 req   = TFHE.asEuint64(encReqAmt, proof);
  euint32 score = TFHE.asEuint32(encScore, proof);

  ebool ratioOk = TFHE.le(req, TFHE.mul(amt, 80) / 100);
  ebool scoreOk = TFHE.ge(score, TFHE.asEuint32(650));
  ebool eligible = TFHE.and(ratioOk, scoreOk);

  invoices[id] = Invoice(amt, req, score, eligible);
}`}
        />
        <CodeBlock
          title="Client (sketch)"
          code={`const enc = await fhevm.createEncryptedInput(addr, user);
enc.add64(invoiceAmount);
enc.add64(requestedAmount);
enc.add32(creditScore);
const { handles, inputProof } = await enc.encrypt();

await contract.submitInvoice(
  handles[0], handles[1], handles[2], inputProof
);`}
        />
      </section>
    </main>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{title}</span>
        <PrivacyBadge label="FHE" />
      </div>
      <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
