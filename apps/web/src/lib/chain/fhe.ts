import { withTimeout } from "@/lib/async";

export type PlainInvoiceFields = {
  invoiceAmount: number;
  requestedAmount: number;
  creditScore: number;
};

type EncryptedInputBuilder = {
  add64: (value: bigint | number) => void;
  add32: (value: bigint | number) => void;
  encrypt: () => Promise<{ handles: readonly string[]; inputProof: string }>;
};

type FheAdapter = {
  createEncryptedInput?: (contractAddress: string, userAddress: string) => EncryptedInputBuilder;
  userDecryptEuint64?: (
    handle: string,
    contractAddress: string,
    userAddress: string,
  ) => Promise<bigint | number | string>;
  userDecryptEuint32?: (
    handle: string,
    contractAddress: string,
    userAddress: string,
  ) => Promise<bigint | number | string>;
  userDecryptEbool?: (
    handle: string,
    contractAddress: string,
    userAddress: string,
  ) => Promise<boolean>;
};

declare global {
  interface Window {
    privInvoiceFhe?: FheAdapter;
    fhevm?: FheAdapter;
  }
}

function getFheAdapter() {
  if (typeof window === "undefined") return null;
  return window.privInvoiceFhe ?? window.fhevm ?? null;
}

export function assertFheAdapter() {
  const adapter = getFheAdapter();
  if (!adapter) {
    throw new Error(
      "FHE adapter is not configured. Attach the Zama relayer/FHEVM SDK to window.privInvoiceFhe before using encrypted actions.",
    );
  }
  return adapter;
}

export async function encryptInvoiceFields(
  contractAddress: string,
  userAddress: string,
  fields: PlainInvoiceFields,
  onProgress?: (message: string) => void,
) {
  console.info("[PrivInvoice] Preparing FHE encrypted input");
  onProgress?.("Preparing encrypted input...");
  const adapter = assertFheAdapter();
  if (!adapter.createEncryptedInput) {
    throw new Error("FHE adapter does not expose createEncryptedInput");
  }

  const input = adapter.createEncryptedInput(contractAddress, userAddress);
  console.info("[PrivInvoice] Adding private invoice fields");
  input.add64(BigInt(fields.invoiceAmount));
  input.add64(BigInt(fields.requestedAmount));
  input.add32(BigInt(fields.creditScore));
  onProgress?.("Encrypting fields and requesting input proof...");
  console.info("[PrivInvoice] Encrypting fields and requesting input proof");
  const encrypted = await withTimeout(input.encrypt(), 120_000, "FHE encryption/input proof");
  console.info("[PrivInvoice] FHE encryption completed", {
    handles: encrypted.handles.length,
    inputProofBytes: encrypted.inputProof.length,
  });

  if (encrypted.handles.length < 3) {
    throw new Error("FHE encryption did not return the expected invoice handles");
  }

  return {
    encryptedInvoiceAmount: encrypted.handles[0],
    encryptedRequestedAmount: encrypted.handles[1],
    encryptedCreditScore: encrypted.handles[2],
    inputProof: encrypted.inputProof,
  };
}

export async function decryptInvoiceFields(
  contractAddress: string,
  userAddress: string,
  handles: {
    invoiceAmount: string;
    requestedAmount: string;
    creditScore: string;
  },
): Promise<PlainInvoiceFields> {
  const adapter = assertFheAdapter();
  if (!adapter.userDecryptEuint64 || !adapter.userDecryptEuint32) {
    throw new Error("FHE adapter does not expose the required encrypted integer decryptors");
  }

  const [invoiceAmount, requestedAmount, creditScore] = await Promise.all([
    adapter.userDecryptEuint64(handles.invoiceAmount, contractAddress, userAddress),
    adapter.userDecryptEuint64(handles.requestedAmount, contractAddress, userAddress),
    adapter.userDecryptEuint32(handles.creditScore, contractAddress, userAddress),
  ]);

  return {
    invoiceAmount: Number(invoiceAmount),
    requestedAmount: Number(requestedAmount),
    creditScore: Number(creditScore),
  };
}

export async function decryptEligibility(
  contractAddress: string,
  userAddress: string,
  eligibilityHandle: string,
) {
  const adapter = assertFheAdapter();
  if (!adapter.userDecryptEbool) {
    throw new Error("FHE adapter does not expose userDecryptEbool");
  }
  return adapter.userDecryptEbool(eligibilityHandle, contractAddress, userAddress);
}
