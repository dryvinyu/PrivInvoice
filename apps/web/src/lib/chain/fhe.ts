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
) {
  const adapter = assertFheAdapter();
  if (!adapter.createEncryptedInput) {
    throw new Error("FHE adapter does not expose createEncryptedInput");
  }

  const input = adapter.createEncryptedInput(contractAddress, userAddress);
  input.add64(BigInt(fields.invoiceAmount));
  input.add64(BigInt(fields.requestedAmount));
  input.add32(BigInt(fields.creditScore));
  const encrypted = await input.encrypt();

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
