import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function WalletButton() {
  const { walletConnected, walletAddress, connectWallet, disconnectWallet } = useStore();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    try {
      await connectWallet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet connection failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await disconnectWallet();
    } finally {
      setBusy(false);
    }
  }

  const label = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "Connected";

  if (!walletConnected) {
    return (
      <Button
        onClick={connect}
        disabled={busy}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Wallet className="h-4 w-4" />
        {busy ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }
  return (
    <Button
      onClick={disconnect}
      disabled={busy}
      variant="outline"
      className="gap-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
    >
      <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      <span className="font-mono text-xs">{busy ? "Disconnecting..." : label}</span>
    </Button>
  );
}
