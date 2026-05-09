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
import { chainConfig } from "./chain/config";
import {
  cancelMockInvoice,
  createMockInvoice,
  decryptMockInvoice,
  evaluateMockInvoice,
  fetchMockChainState,
  finalizeMockEligibility,
  fundMockInvoice,
  grantMockAuditorAccess,
  markMockRepaid,
  requestMockAuditInfo,
  reviewMockInvoice,
  updateMockAuditor,
  mockWalletAddress,
} from "./mock";

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
  cancelInvoice: (invoice: Invoice, reason: string) => Promise<void>;
  assignAuditor: (invoice: Invoice, auditorAddress: string) => Promise<void>;
  approveAudit: (invoice: Invoice, notes: string) => Promise<void>;
  rejectAudit: (invoice: Invoice, notes: string) => Promise<void>;
  requestAuditInfo: (invoice: Invoice, notes: string) => Promise<void>;
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
      const { invoices, audit } = chainConfig.mockDataEnabled
        ? await fetchMockChainState()
        : await fetchChainState(get().walletAddress);
      set({ invoices, audit, chainError: null });
    } catch (error) {
      set({ invoices: [], audit: [], chainError: getErrorMessage(error) });
    } finally {
      set({ chainLoading: false });
    }
  },
  connectWallet: async () => {
    const walletAddress = chainConfig.mockDataEnabled
      ? mockWalletAddress
      : await connectBrowserWallet();
    set({ walletConnected: true, walletAddress });
    await get().refreshChainData();
  },
  disconnectWallet: async () => {
    set({ walletConnected: false, walletAddress: null });
    await get().refreshChainData();
  },
  createInvoice: async (input) => {
    if (chainConfig.mockDataEnabled) {
      await createMockInvoice(input);
    } else {
      await createInvoiceOnchain(input);
    }
    await get().refreshChainData();
  },
  evaluateInvoice: async (invoice) => {
    if (chainConfig.mockDataEnabled) {
      await evaluateMockInvoice(invoice.onchainId);
    } else {
      await evaluateInvoiceOnchain(invoice.onchainId);
    }
    await get().refreshChainData();
  },
  finalizeEligibility: async (invoice) => {
    if (chainConfig.mockDataEnabled) {
      await finalizeMockEligibility(invoice.onchainId);
    } else {
      await finalizeEligibilityOnchain(invoice.onchainId);
    }
    await get().refreshChainData();
  },
  grantAuditorAccess: async (invoice) => {
    if (chainConfig.mockDataEnabled) {
      await grantMockAuditorAccess(invoice.onchainId);
    } else {
      await grantAuditorAccessOnchain(invoice.onchainId);
    }
    await get().refreshChainData();
  },
  fundInvoice: async (invoice, amount) => {
    if (chainConfig.mockDataEnabled) {
      await fundMockInvoice(invoice.onchainId, amount);
    } else {
      await fundInvoiceOnchain(invoice.onchainId, amount);
    }
    await get().refreshChainData();
  },
  markRepaid: async (invoice) => {
    if (chainConfig.mockDataEnabled) {
      await markMockRepaid(invoice.onchainId);
    } else {
      await markRepaidOnchain(invoice.onchainId);
    }
    await get().refreshChainData();
  },
  cancelInvoice: async (invoice, reason) => {
    if (!chainConfig.mockDataEnabled) {
      throw new Error("Invoice cancellation is available in mock workflow only for now.");
    }
    await cancelMockInvoice(invoice.onchainId, reason);
    await get().refreshChainData();
  },
  assignAuditor: async (invoice, auditorAddress) => {
    if (!chainConfig.mockDataEnabled) {
      throw new Error("Auditor selection is available in mock workflow only for now.");
    }
    await updateMockAuditor(invoice.onchainId, auditorAddress);
    await get().refreshChainData();
  },
  approveAudit: async (invoice, notes) => {
    if (!chainConfig.mockDataEnabled) {
      throw new Error("Audit review decisions are available in mock workflow only for now.");
    }
    await reviewMockInvoice(invoice.onchainId, "Approved", notes);
    await get().refreshChainData();
  },
  rejectAudit: async (invoice, notes) => {
    if (!chainConfig.mockDataEnabled) {
      throw new Error("Audit review decisions are available in mock workflow only for now.");
    }
    await reviewMockInvoice(invoice.onchainId, "Rejected", notes);
    await get().refreshChainData();
  },
  requestAuditInfo: async (invoice, notes) => {
    if (!chainConfig.mockDataEnabled) {
      throw new Error("Audit information requests are available in mock workflow only for now.");
    }
    await requestMockAuditInfo(invoice.onchainId, notes);
    await get().refreshChainData();
  },
  decryptInvoice: async (invoice) => {
    const privateFields = chainConfig.mockDataEnabled
      ? await decryptMockInvoice(invoice.onchainId)
      : await recordAndDecryptInvoiceOnchain(invoice.onchainId);
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
