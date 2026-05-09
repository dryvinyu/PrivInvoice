import { create } from "zustand";
import type { AuditEvent, Invoice, Role } from "./types";
import {
  connectBrowserWallet,
  createInvoiceOnchain,
  evaluateInvoiceOnchain,
  fetchChainState,
  finalizeEligibilityOnchain,
  fundInvoiceOnchain,
  grantAuditorAccessOnchain,
  markRepaidOnchain,
  recordAndDecryptInvoiceOnchain,
  type CreateInvoiceInput,
} from "./chain/privInvoice";

type State = {
  role: Role;
  walletConnected: boolean;
  walletAddress: string | null;
  invoices: Invoice[];
  audit: AuditEvent[];
  chainLoading: boolean;
  chainError: string | null;
  setRole: (r: Role) => void;
  refreshChainData: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  createInvoice: (input: CreateInvoiceInput) => Promise<void>;
  evaluateInvoice: (invoice: Invoice) => Promise<void>;
  finalizeEligibility: (invoice: Invoice) => Promise<void>;
  grantAuditorAccess: (invoice: Invoice) => Promise<void>;
  fundInvoice: (invoice: Invoice, amount: number) => Promise<void>;
  markRepaid: (invoice: Invoice) => Promise<void>;
  decryptInvoice: (invoice: Invoice) => Promise<void>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown chain error";
}

export const useStore = create<State>((set, get) => ({
  role: "Company",
  walletConnected: false,
  walletAddress: null,
  invoices: [],
  audit: [],
  chainLoading: false,
  chainError: null,
  setRole: (role) => set({ role }),
  refreshChainData: async () => {
    set({ chainLoading: true, chainError: null });
    try {
      const { invoices, audit } = await fetchChainState(get().walletAddress);
      set({ invoices, audit, chainError: null });
    } catch (error) {
      set({ invoices: [], audit: [], chainError: getErrorMessage(error) });
    } finally {
      set({ chainLoading: false });
    }
  },
  connectWallet: async () => {
    const walletAddress = await connectBrowserWallet();
    set({ walletConnected: true, walletAddress });
    await get().refreshChainData();
  },
  disconnectWallet: async () => {
    set({ walletConnected: false, walletAddress: null });
    await get().refreshChainData();
  },
  createInvoice: async (input) => {
    await createInvoiceOnchain(input);
    await get().refreshChainData();
  },
  evaluateInvoice: async (invoice) => {
    await evaluateInvoiceOnchain(invoice.onchainId);
    await get().refreshChainData();
  },
  finalizeEligibility: async (invoice) => {
    await finalizeEligibilityOnchain(invoice.onchainId);
    await get().refreshChainData();
  },
  grantAuditorAccess: async (invoice) => {
    await grantAuditorAccessOnchain(invoice.onchainId);
    await get().refreshChainData();
  },
  fundInvoice: async (invoice, amount) => {
    await fundInvoiceOnchain(invoice.onchainId, amount);
    await get().refreshChainData();
  },
  markRepaid: async (invoice) => {
    await markRepaidOnchain(invoice.onchainId);
    await get().refreshChainData();
  },
  decryptInvoice: async (invoice) => {
    const privateFields = await recordAndDecryptInvoiceOnchain(invoice.onchainId);
    await get().refreshChainData();
    set((state) => ({
      invoices: state.invoices.map((item) =>
        item.onchainId === invoice.onchainId
          ? { ...item, ...privateFields, privateValuesLoaded: true }
          : item,
      ),
    }));
  },
}));
