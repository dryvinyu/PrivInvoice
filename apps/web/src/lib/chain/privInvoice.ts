import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  ZeroAddress,
  formatUnits,
  parseUnits,
} from "ethers";
import type { AuditEvent, Invoice, InvoiceStatus, RiskLevel } from "@/lib/types";
import { mockUsdzAbi, privInvoiceAbi } from "./abi";
import { chainConfig, requireConfiguredAddress } from "./config";
import {
  assertFheAdapter,
  decryptEligibility,
  decryptInvoiceFields,
  encryptInvoiceFields,
  type PlainInvoiceFields,
} from "./fhe";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export type CreateInvoiceInput = PlainInvoiceFields & {
  id: string;
  invoiceHash: string;
  industry: string;
  dueDays: number;
  apr: number;
};

const statusMap: InvoiceStatus[] = ["Created", "Eligible", "Rejected", "Funded", "Repaid"];
const riskMap: RiskLevel[] = ["Unset", "Low", "Medium", "High"];

function getPrivInvoiceAddress() {
  return requireConfiguredAddress(chainConfig.privInvoiceAddress, "VITE_PRIVINVOICE_ADDRESS");
}

function getUsdzAddress() {
  return requireConfiguredAddress(chainConfig.usdzAddress, "VITE_USDZ_ADDRESS");
}

function getReadProvider() {
  if (chainConfig.rpcUrl) {
    return new JsonRpcProvider(chainConfig.rpcUrl);
  }
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum as never);
  }
  throw new Error("No chain provider available. Set VITE_RPC_URL or connect a browser wallet.");
}

async function getBrowserSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No browser wallet found");
  }
  const provider = new BrowserProvider(window.ethereum as never);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

async function getReadContract() {
  const provider = getReadProvider();
  return {
    provider,
    contract: new Contract(getPrivInvoiceAddress(), privInvoiceAbi, provider),
  };
}

async function getWriteContract() {
  const signer = await getBrowserSigner();
  return {
    signer,
    signerAddress: await signer.getAddress(),
    contract: new Contract(getPrivInvoiceAddress(), privInvoiceAbi, signer),
  };
}

function shortAddress(address: string) {
  if (!address || address === ZeroAddress) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function statusFromChain(status: bigint | number) {
  return statusMap[Number(status)] ?? "Created";
}

function riskFromChain(riskLevel: bigint | number, riskLevelSet: boolean): RiskLevel {
  if (!riskLevelSet) return "Unset";
  return riskMap[Number(riskLevel)] ?? "Unset";
}

function riskIndexFromCreditScore(creditScore: number) {
  if (creditScore >= 720) return 1;
  if (creditScore >= 660) return 2;
  return 3;
}

function invoiceIdFromArgs(args: Record<string, unknown>) {
  return String(args.invoiceId ?? args[0] ?? "0");
}

async function blockTimestamp(provider: BrowserProvider | JsonRpcProvider, blockNumber: number) {
  const block = await provider.getBlock(blockNumber);
  return Number(block?.timestamp ?? 0) * 1000;
}

type AuditQuery = {
  events: AuditEvent[];
  grantedOnchainIds: Set<string>;
};

async function loadAuditEvents(
  contract: Contract,
  provider: BrowserProvider | JsonRpcProvider,
): Promise<AuditQuery> {
  const fromBlock = chainConfig.deploymentBlock;
  const timestampCache = new Map<number, number>();
  const labelsByOnchainId = new Map<string, string>();
  const grantedOnchainIds = new Set<string>();
  const events: AuditEvent[] = [];

  async function timestampFor(blockNumber: number) {
    const cached = timestampCache.get(blockNumber);
    if (cached !== undefined) return cached;
    const ts = await blockTimestamp(provider, blockNumber);
    timestampCache.set(blockNumber, ts);
    return ts;
  }

  const createdLogs = await contract.queryFilter(contract.filters.InvoiceCreated(), fromBlock);
  for (const log of createdLogs) {
    const event = log as never as {
      args?: { invoiceId?: bigint; company?: string; externalInvoiceId?: string };
      blockNumber: number;
    };
    if (!event.args?.invoiceId) continue;
    const onchainId = event.args.invoiceId.toString();
    const label = event.args.externalInvoiceId || `INV-${onchainId}`;
    labelsByOnchainId.set(onchainId, label);
    events.push({
      invoiceId: label,
      ts: await timestampFor(event.blockNumber),
      label: "Invoice created",
      actor: event.args.company ? shortAddress(event.args.company) : "Company",
    });
  }

  function displayId(onchainId: string) {
    return labelsByOnchainId.get(onchainId) ?? `INV-${onchainId}`;
  }

  async function pushEvent(
    eventName: string,
    makeLabel: (args: Record<string, unknown>) => string,
    makeActor: (args: Record<string, unknown>) => string,
  ) {
    const eventFilter = contract.filters[eventName] as () => unknown;
    const logs = await contract.queryFilter(eventFilter(), fromBlock);
    for (const log of logs) {
      const event = log as never as { args?: Record<string, unknown>; blockNumber: number };
      if (!event.args) continue;
      const onchainId = invoiceIdFromArgs(event.args);
      events.push({
        invoiceId: displayId(onchainId),
        ts: await timestampFor(event.blockNumber),
        label: makeLabel(event.args),
        actor: makeActor(event.args),
      });
    }
  }

  await pushEvent(
    "InvoiceEvaluated",
    () => "Eligibility evaluated (FHE)",
    () => "Smart Contract",
  );
  await pushEvent(
    "EligibilityFinalized",
    (args) => `Eligibility finalized -> ${args.approved ? "Eligible" : "Rejected"}`,
    () => "Finalizer",
  );
  await pushEvent(
    "AuditorAccessGranted",
    (args) => {
      const onchainId = invoiceIdFromArgs(args);
      grantedOnchainIds.add(onchainId);
      return "Auditor access granted";
    },
    () => "Company",
  );
  await pushEvent(
    "InvoiceFunded",
    (args) =>
      `Investor funded ${Number(formatUnits(args.amount as bigint, 18)).toLocaleString()} USDZ`,
    (args) => shortAddress(args.investor as string) || "Investor",
  );
  await pushEvent(
    "InvoiceRepaid",
    () => "Invoice repaid",
    () => "Company",
  );
  await pushEvent(
    "DataDecryptionRecorded",
    () => "Authorized data decrypted",
    (args) => shortAddress(args.account as string) || "Authorized user",
  );

  return {
    events: events.sort((a, b) => b.ts - a.ts),
    grantedOnchainIds,
  };
}

async function parseInvoice(
  contract: Contract,
  onchainId: bigint,
  walletAddress: string | null | undefined,
  grantedOnchainIds: Set<string>,
): Promise<Invoice> {
  const publicInvoice = await contract.getInvoicePublic(onchainId);
  const onchainIdText = publicInvoice[0].toString();
  const externalInvoiceId = publicInvoice[1] || `INV-${onchainIdText}`;
  const currentWalletHasAccess = walletAddress
    ? await contract.auditorAccess(onchainId, walletAddress).catch(() => false)
    : false;

  return {
    onchainId: onchainIdText,
    id: externalInvoiceId,
    company: publicInvoice[2],
    invoiceHash: publicInvoice[3],
    industry: publicInvoice[4],
    dueDays: Number(publicInvoice[5]),
    apr: Number(publicInvoice[6]) / 100,
    invoiceAmount: 0,
    requestedAmount: 0,
    creditScore: 0,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: grantedOnchainIds.has(onchainIdText) || currentWalletHasAccess,
    status: statusFromChain(publicInvoice[7]),
    riskLevel: riskFromChain(publicInvoice[8], publicInvoice[9]),
    investor: publicInvoice[10] === ZeroAddress ? null : publicInvoice[10],
    publicFundingAmount: Number(formatUnits(publicInvoice[11], 18)),
    createdAt: Number(publicInvoice[12]) * 1000,
    hasEvaluation: publicInvoice[13],
  };
}

export async function connectBrowserWallet() {
  const signer = await getBrowserSigner();
  return signer.getAddress();
}

export async function fetchChainState(walletAddress?: string | null) {
  const { provider, contract } = await getReadContract();
  const [auditQuery, nextInvoiceId] = await Promise.all([
    loadAuditEvents(contract, provider),
    contract.nextInvoiceId(),
  ]);

  const ids: bigint[] = [];
  for (let invoiceId = 1n; invoiceId < nextInvoiceId; invoiceId++) {
    ids.push(invoiceId);
  }

  const invoices = await Promise.all(
    ids.map((invoiceId) =>
      parseInvoice(contract, invoiceId, walletAddress, auditQuery.grantedOnchainIds),
    ),
  );

  return {
    invoices: invoices.reverse(),
    audit: auditQuery.events,
  };
}

export async function createInvoiceOnchain(input: CreateInvoiceInput) {
  const { contract, signerAddress } = await getWriteContract();
  const privInvoiceAddress = getPrivInvoiceAddress();
  const encrypted = await encryptInvoiceFields(privInvoiceAddress, signerAddress, input);
  const aprBps = Math.round(input.apr * 100);

  const tx = await contract.createInvoice(
    input.id,
    input.invoiceHash,
    input.industry,
    input.dueDays,
    aprBps,
    encrypted.encryptedInvoiceAmount,
    encrypted.encryptedRequestedAmount,
    encrypted.encryptedCreditScore,
    encrypted.inputProof,
  );
  await tx.wait();
}

export async function evaluateInvoiceOnchain(onchainId: string) {
  const { contract } = await getWriteContract();
  const tx = await contract.evaluateInvoice(onchainId);
  await tx.wait();
}

export async function decryptPrivateInvoiceFields(onchainId: string) {
  const { contract: readContract } = await getReadContract();
  const { signerAddress } = await getWriteContract();
  const privInvoiceAddress = getPrivInvoiceAddress();

  const [invoiceAmount, requestedAmount, creditScore] = await Promise.all([
    readContract.getEncryptedInvoiceAmountHandle(onchainId),
    readContract.getEncryptedRequestedAmountHandle(onchainId),
    readContract.getEncryptedCreditScoreHandle(onchainId),
  ]);

  return decryptInvoiceFields(privInvoiceAddress, signerAddress, {
    invoiceAmount,
    requestedAmount,
    creditScore,
  });
}

export async function finalizeEligibilityOnchain(onchainId: string) {
  assertFheAdapter();
  const { contract: readContract } = await getReadContract();
  const { contract, signerAddress } = await getWriteContract();
  const privInvoiceAddress = getPrivInvoiceAddress();
  const privateFields = await decryptPrivateInvoiceFields(onchainId);
  const eligibilityHandle = await readContract.getEncryptedEligibilityHandle(onchainId);
  const approved = await decryptEligibility(privInvoiceAddress, signerAddress, eligibilityHandle);
  const riskLevel = riskIndexFromCreditScore(privateFields.creditScore);

  const tx = await contract.finalizeEligibility(onchainId, approved, riskLevel);
  await tx.wait();
}

export async function grantAuditorAccessOnchain(onchainId: string) {
  const auditor = requireConfiguredAddress(
    chainConfig.defaultAuditorAddress,
    "VITE_DEFAULT_AUDITOR_ADDRESS",
  );
  const { contract } = await getWriteContract();
  const tx = await contract.grantAuditorAccess(onchainId, auditor);
  await tx.wait();
}

export async function fundInvoiceOnchain(onchainId: string, amount: number) {
  const privInvoiceAddress = getPrivInvoiceAddress();
  const usdzAddress = getUsdzAddress();
  const signer = await getBrowserSigner();
  const signerAddress = await signer.getAddress();
  const amountWei = parseUnits(String(amount), 18);
  const usdz = new Contract(usdzAddress, mockUsdzAbi, signer);
  const allowance = await usdz.allowance(signerAddress, privInvoiceAddress);

  if (allowance < amountWei) {
    const approveTx = await usdz.approve(privInvoiceAddress, amountWei);
    await approveTx.wait();
  }

  const privInvoice = new Contract(privInvoiceAddress, privInvoiceAbi, signer);
  const tx = await privInvoice.fundInvoice(onchainId, amountWei);
  await tx.wait();
}

export async function markRepaidOnchain(onchainId: string) {
  const { contract } = await getWriteContract();
  const tx = await contract.markRepaid(onchainId);
  await tx.wait();
}

export async function recordAndDecryptInvoiceOnchain(onchainId: string) {
  assertFheAdapter();
  const { contract } = await getWriteContract();
  const tx = await contract.recordDecryption(onchainId);
  await tx.wait();
  return decryptPrivateInvoiceFields(onchainId);
}
