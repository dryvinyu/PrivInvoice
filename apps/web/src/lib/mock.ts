import type { AuditEvent, AuditReviewStatus, Invoice, RiskLevel } from "./types";
import type { CreateInvoiceInput } from "./chain/privInvoice";

const company = "0x7A24c620F7A4e4Bf68f6F428c6D4E48dbB0B8E71";
const logisticsCompany = "0xA91f85cF9e3aB242C0C4905E85fD7B1b2e6b9a30";
const saasCompany = "0x6Ff1f8A8eE91C56C96f25c95D01D4C9aD2A63811";
const energyCompany = "0xC412Bf8D3D0294C8f4f12C1a6D9e7e84e45f2190";
const healthcareCompany = "0xD5f9a7Cb91B34E91528eC98a78312e6DDB2e8C44";
const retailCompany = "0xE81825C8c58A72F9159F5FAb3dCa9eF414A10C21";
const constructionCompany = "0xF3B2A9d66A88f3044EC0A0b17D0f2b56f3305eF2";
const agricultureCompany = "0x92C8e5f2B8818A6eE02031f7D99D9c9fA80615c2";
const investor = "0x33E45F0Fb9E0C8c2bD58F03f1B263B9B2Fc8b2d1";
const secondInvestor = "0x4D29e50A78dA9Bf3F82F5440b3Aa9F8Ce80f0991";
const creditOfficer = "0x8b1fD2c99eA7C64Ea21E2D9A0BCc72F27D02e3B1";
const auditor = "0xB2385DfF0f40920D27E9f613612CB4E74f7B8d91";

export const mockCompanyAddress = company;
export const mockInvestorAddress = investor;
export const mockAuditorAddress = auditor;

const companyNames: Record<string, string> = {
  [company]: "Northstar Components LLC",
  [logisticsCompany]: "Meridian Freight Partners",
  [saasCompany]: "Atlas Subscription Systems",
  [energyCompany]: "HelioGrid Services Inc.",
  [healthcareCompany]: "Pioneer Medical Supply Co.",
  [retailCompany]: "Silverline Retail Group",
  [constructionCompany]: "Keystone Build Partners",
  [agricultureCompany]: "Greenfield Produce Cooperative",
};

const investorNames: Record<string, string> = {
  [investor]: "Cedar Ridge Credit Fund",
  [secondInvestor]: "Juniper Yield Partners",
};

function daysAgo(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function daysAfter(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function dueDateFromCreated(createdAt: number, dueDays: number) {
  return new Date(createdAt + dueDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function evidence(allComplete = false) {
  return [
    { label: "Invoice hash matches uploaded file", completed: allComplete },
    { label: "Buyer identity and payment history checked", completed: allComplete },
    { label: "Requested financing ratio reviewed", completed: allComplete },
    { label: "Sanctions and duplicate invoice screen completed", completed: allComplete },
  ];
}

export const mockWalletAddress = company;

const seedInvoices: Invoice[] = [
  {
    onchainId: "318742",
    id: "AR-2026-0418",
    company,
    companyName: companyNames[company],
    counterparty: "Precision Retail Group",
    invoiceHash: "ipfs://bafybeif7mve6cq4n24q4n5v4m3k7zt2qsp4q3q3n7bpy3p6xhzr6p5wyde",
    documentName: "northstar-prg-april-components.pdf",
    industry: "Manufacturing",
    dueDays: 45,
    dueDate: dueDateFromCreated(daysAgo(1), 45),
    apr: 8.4,
    invoiceAmount: 128450,
    requestedAmount: 92000,
    creditScore: 714,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: false,
    status: "Created",
    riskLevel: "Unset",
    investor: null,
    investorName: null,
    publicFundingAmount: 0,
    createdAt: daysAgo(1),
    hasEvaluation: false,
    fundingTarget: 92000,
    fundingDeadline: daysAfter(12),
    repaymentDueDate: dueDateFromCreated(daysAgo(1), 45),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: null,
    auditReviewStatus: "NotRequested",
    auditDecision: null,
    auditNotes: null,
    auditReportHash: null,
    evidenceChecklist: evidence(false),
  },
  {
    onchainId: "318719",
    id: "BOL-2026-0172",
    company: logisticsCompany,
    companyName: companyNames[logisticsCompany],
    counterparty: "Harborline Wholesale Inc.",
    invoiceHash: "ipfs://bafybeidnmr7su24ctn3a2ylcse5s7xq7g2grrvepwh6bgj7nmwm7t5srkq",
    documentName: "meridian-harborline-bol-0172.pdf",
    industry: "Logistics",
    dueDays: 75,
    dueDate: dueDateFromCreated(daysAgo(4), 75),
    apr: 9.25,
    invoiceAmount: 236780,
    requestedAmount: 165000,
    creditScore: 681,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Eligible",
    riskLevel: "Medium",
    investor: null,
    investorName: null,
    publicFundingAmount: 0,
    createdAt: daysAgo(4),
    hasEvaluation: true,
    fundingTarget: 165000,
    fundingDeadline: daysAfter(9),
    repaymentDueDate: dueDateFromCreated(daysAgo(4), 75),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "PendingReview",
    auditDecision: null,
    auditNotes: "Awaiting buyer remittance confirmation from Harborline AP.",
    auditReportHash: null,
    evidenceChecklist: evidence(false),
  },
  {
    onchainId: "318681",
    id: "SUB-2026-0096",
    company: saasCompany,
    companyName: companyNames[saasCompany],
    counterparty: "Blue Oak Dental Network",
    invoiceHash: "ipfs://bafybeia5lmkzrvfw35v6nuw3y2h7d6sr2ebmjtwqdzksct5ft4c5c7cn2e",
    documentName: "atlas-blue-oak-mrr-q1.pdf",
    industry: "SaaS",
    dueDays: 30,
    dueDate: dueDateFromCreated(daysAgo(8), 30),
    apr: 7.1,
    invoiceAmount: 84200,
    requestedAmount: 58000,
    creditScore: 768,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Funded",
    riskLevel: "Low",
    investor,
    investorName: investorNames[investor],
    publicFundingAmount: 58000,
    createdAt: daysAgo(8),
    hasEvaluation: true,
    fundingTarget: 58000,
    fundingDeadline: dueDateFromCreated(daysAgo(8), 14),
    repaymentDueDate: dueDateFromCreated(daysAgo(8), 30),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "Approved",
    auditDecision: "Approved for financing. Subscription revenue history is consistent.",
    auditNotes: "Buyer payment behavior and MRR schedule reviewed.",
    auditReportHash: "ipfs://bafybeih3kn2l7sro5vdtj6iyvcr7plhhmjqnlm2swivrxhm75k44zjnefi",
    evidenceChecklist: evidence(true),
  },
  {
    onchainId: "318660",
    id: "MED-2026-0284",
    company: healthcareCompany,
    companyName: companyNames[healthcareCompany],
    counterparty: "Canyon Regional Hospital",
    invoiceHash: "ipfs://bafybeic5pioneer7medsupply2q3rvhgz55qht4kr2m74plq5wr6mi",
    documentName: "pioneer-canyon-surgical-supply-0284.pdf",
    industry: "Healthcare",
    dueDays: 60,
    dueDate: dueDateFromCreated(daysAgo(10), 60),
    apr: 8.9,
    invoiceAmount: 312900,
    requestedAmount: 218000,
    creditScore: 702,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Eligible",
    riskLevel: "Medium",
    investor: null,
    investorName: null,
    publicFundingAmount: 0,
    createdAt: daysAgo(10),
    hasEvaluation: true,
    fundingTarget: 218000,
    fundingDeadline: daysAfter(6),
    repaymentDueDate: dueDateFromCreated(daysAgo(10), 60),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "Approved",
    auditDecision: "Approved after hospital AP confirmation and delivery receipt review.",
    auditNotes: "Matched PO, packing slips, and buyer payment schedule.",
    auditReportHash: "ipfs://bafybeig7pioneerauditmed284qkx3mznq5tyc74zp2usv7g5a",
    evidenceChecklist: evidence(true),
  },
  {
    onchainId: "318633",
    id: "ENG-2026-0147",
    company: energyCompany,
    companyName: companyNames[energyCompany],
    counterparty: "Red Mesa Utilities",
    invoiceHash: "ipfs://bafybeibhelio7grid147energyw6r2qupxz4b2n4lnj6guz5sx5gq",
    documentName: "heliogrid-red-mesa-maintenance-0147.pdf",
    industry: "Energy",
    dueDays: 90,
    dueDate: dueDateFromCreated(daysAgo(12), 90),
    apr: 11.2,
    invoiceAmount: 487600,
    requestedAmount: 340000,
    creditScore: 662,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Eligible",
    riskLevel: "Medium",
    investor: null,
    investorName: null,
    publicFundingAmount: 125000,
    createdAt: daysAgo(12),
    hasEvaluation: true,
    fundingTarget: 340000,
    fundingDeadline: daysAfter(4),
    repaymentDueDate: dueDateFromCreated(daysAgo(12), 90),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "PendingReview",
    auditDecision: null,
    auditNotes: "Utility counterparty confirmation received; service order sample pending.",
    auditReportHash: null,
    evidenceChecklist: [
      { label: "Invoice hash matches uploaded file", completed: true },
      { label: "Buyer identity and payment history checked", completed: true },
      { label: "Requested financing ratio reviewed", completed: false },
      { label: "Sanctions and duplicate invoice screen completed", completed: true },
    ],
  },
  {
    onchainId: "318610",
    id: "RTL-2026-0733",
    company: retailCompany,
    companyName: companyNames[retailCompany],
    counterparty: "Mason Department Stores",
    invoiceHash: "ipfs://bafybeidretail733seasonalapparelx27qvhr6yjmlyfnp4ksf",
    documentName: "silverline-mason-spring-apparel-0733.pdf",
    industry: "Retail",
    dueDays: 45,
    dueDate: dueDateFromCreated(daysAgo(15), 45),
    apr: 12.4,
    invoiceAmount: 176240,
    requestedAmount: 151000,
    creditScore: 621,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Rejected",
    riskLevel: "High",
    investor: null,
    investorName: null,
    publicFundingAmount: 0,
    createdAt: daysAgo(15),
    hasEvaluation: true,
    fundingTarget: 151000,
    fundingDeadline: dueDateFromCreated(daysAgo(15), 14),
    repaymentDueDate: dueDateFromCreated(daysAgo(15), 45),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: "Requested financing exceeded policy threshold after risk review.",
    auditorAddress: auditor,
    auditReviewStatus: "Rejected",
    auditDecision: "Rejected due to elevated financing ratio and buyer dispute flag.",
    auditNotes: "Buyer reported short shipment variance on the related PO.",
    auditReportHash: null,
    evidenceChecklist: [
      { label: "Invoice hash matches uploaded file", completed: true },
      { label: "Buyer identity and payment history checked", completed: false },
      { label: "Requested financing ratio reviewed", completed: true },
      { label: "Sanctions and duplicate invoice screen completed", completed: true },
    ],
  },
  {
    onchainId: "318584",
    id: "CON-2026-0221",
    company: constructionCompany,
    companyName: companyNames[constructionCompany],
    counterparty: "Summit County Public Works",
    invoiceHash: "ipfs://bafybeicconstruct221milestonepayapp9xr4le5q6w2qjcg",
    documentName: "keystone-summit-payapp-0221.pdf",
    industry: "Construction",
    dueDays: 120,
    dueDate: dueDateFromCreated(daysAgo(18), 120),
    apr: 13.1,
    invoiceAmount: 650400,
    requestedAmount: 390000,
    creditScore: 676,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Funded",
    riskLevel: "Medium",
    investor: secondInvestor,
    investorName: investorNames[secondInvestor],
    publicFundingAmount: 390000,
    createdAt: daysAgo(18),
    hasEvaluation: true,
    fundingTarget: 390000,
    fundingDeadline: dueDateFromCreated(daysAgo(18), 10),
    repaymentDueDate: dueDateFromCreated(daysAgo(18), 120),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "Approved",
    auditDecision: "Approved with public works milestone certificate attached.",
    auditNotes: "Retainage excluded from eligible receivable amount.",
    auditReportHash: "ipfs://bafybeibkeystoneaudit221m9khv76p3nlrxbk6wf5xrjjq",
    evidenceChecklist: evidence(true),
  },
  {
    onchainId: "318559",
    id: "AGR-2026-0388",
    company: agricultureCompany,
    companyName: companyNames[agricultureCompany],
    counterparty: "FreshWay Market Distribution",
    invoiceHash: "ipfs://bafybeigreenfield388producecoldchainm3lrvxuh6wqq",
    documentName: "greenfield-freshway-produce-0388.pdf",
    industry: "Agriculture",
    dueDays: 30,
    dueDate: dueDateFromCreated(daysAgo(20), 30),
    apr: 9.8,
    invoiceAmount: 96400,
    requestedAmount: 69000,
    creditScore: 735,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Repaid",
    riskLevel: "Low",
    investor,
    investorName: investorNames[investor],
    publicFundingAmount: 69000,
    createdAt: daysAgo(20),
    hasEvaluation: true,
    fundingTarget: 69000,
    fundingDeadline: dueDateFromCreated(daysAgo(20), 7),
    repaymentDueDate: dueDateFromCreated(daysAgo(20), 30),
    repaidAt: daysAgo(2),
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "Approved",
    auditDecision: "Approved. Cold-chain delivery records and buyer remittance matched.",
    auditNotes: "Seasonal produce invoice settled ahead of due date.",
    auditReportHash: "ipfs://bafybeigreenfieldaudit388p7n65rkcwjoq6psbc2n",
    evidenceChecklist: evidence(true),
  },
  {
    onchainId: "318531",
    id: "WHL-2026-0462",
    company,
    companyName: companyNames[company],
    counterparty: "Lakeshore Hardware Co.",
    invoiceHash: "ipfs://bafybeifnorthstar462hardwarefastenersl8adkx6nqz2",
    documentName: "northstar-lakeshore-fasteners-0462.pdf",
    industry: "Wholesale",
    dueDays: 60,
    dueDate: dueDateFromCreated(daysAgo(6), 60),
    apr: 8.7,
    invoiceAmount: 204300,
    requestedAmount: 142000,
    creditScore: 728,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Eligible",
    riskLevel: "Low",
    investor: null,
    investorName: null,
    publicFundingAmount: 45000,
    createdAt: daysAgo(6),
    hasEvaluation: true,
    fundingTarget: 142000,
    fundingDeadline: daysAfter(8),
    repaymentDueDate: dueDateFromCreated(daysAgo(6), 60),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "InfoRequested",
    auditDecision: "Need updated buyer aging report before final approval.",
    auditNotes: "Lakeshore AP confirmation received, but aging report is older than 30 days.",
    auditReportHash: null,
    evidenceChecklist: [
      { label: "Invoice hash matches uploaded file", completed: true },
      { label: "Buyer identity and payment history checked", completed: false },
      { label: "Requested financing ratio reviewed", completed: true },
      { label: "Sanctions and duplicate invoice screen completed", completed: true },
    ],
  },
  {
    onchainId: "318508",
    id: "MFG-2026-0520",
    company,
    companyName: companyNames[company],
    counterparty: "Cobalt Home Systems",
    invoiceHash: "ipfs://bafybeifnorthstar520cobaltsubassemblyy5h2dq8jmsn",
    documentName: "northstar-cobalt-subassembly-0520.pdf",
    industry: "Manufacturing",
    dueDays: 75,
    dueDate: dueDateFromCreated(daysAgo(25), 75),
    apr: 8.1,
    invoiceAmount: 118750,
    requestedAmount: 83000,
    creditScore: 746,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: true,
    status: "Funded",
    riskLevel: "Low",
    investor,
    investorName: investorNames[investor],
    publicFundingAmount: 83000,
    createdAt: daysAgo(25),
    hasEvaluation: true,
    fundingTarget: 83000,
    fundingDeadline: dueDateFromCreated(daysAgo(25), 12),
    repaymentDueDate: dueDateFromCreated(daysAgo(25), 75),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: auditor,
    auditReviewStatus: "Approved",
    auditDecision: "Approved based on repeat buyer payment history and PO match.",
    auditNotes: "No duplicate invoice flags found.",
    auditReportHash: "ipfs://bafybeinorthstaraudit520h27r9qxlc62mpp6zq4",
    evidenceChecklist: evidence(true),
  },
];

const seedAudit: AuditEvent[] = [
  {
    invoiceId: "SUB-2026-0096",
    ts: daysAgo(8),
    label: "Invoice submitted",
    actor: saasCompany,
  },
  {
    invoiceId: "SUB-2026-0096",
    ts: daysAgo(7),
    label: "Encrypted eligibility evaluated",
    actor: creditOfficer,
  },
  {
    invoiceId: "SUB-2026-0096",
    ts: daysAgo(6),
    label: "Auditor access granted",
    actor: saasCompany,
  },
  {
    invoiceId: "SUB-2026-0096",
    ts: daysAgo(5),
    label: "Invoice funded",
    actor: investor,
  },
  {
    invoiceId: "BOL-2026-0172",
    ts: daysAgo(4),
    label: "Invoice submitted",
    actor: logisticsCompany,
  },
  {
    invoiceId: "BOL-2026-0172",
    ts: daysAgo(3),
    label: "Eligibility finalized",
    actor: creditOfficer,
  },
  {
    invoiceId: "BOL-2026-0172",
    ts: daysAgo(2),
    label: "Auditor reviewed encrypted handles",
    actor: auditor,
  },
  {
    invoiceId: "AR-2026-0418",
    ts: daysAgo(1),
    label: "Invoice submitted",
    actor: company,
  },
  {
    invoiceId: "MED-2026-0284",
    ts: daysAgo(10),
    label: "Invoice submitted",
    actor: healthcareCompany,
  },
  {
    invoiceId: "MED-2026-0284",
    ts: daysAgo(9),
    label: "Hospital AP confirmation received",
    actor: auditor,
  },
  {
    invoiceId: "MED-2026-0284",
    ts: daysAgo(8),
    label: "Audit review approved",
    actor: auditor,
  },
  {
    invoiceId: "ENG-2026-0147",
    ts: daysAgo(12),
    label: "Invoice submitted",
    actor: energyCompany,
  },
  {
    invoiceId: "ENG-2026-0147",
    ts: daysAgo(11),
    label: "Partial funding received",
    actor: secondInvestor,
  },
  {
    invoiceId: "RTL-2026-0733",
    ts: daysAgo(15),
    label: "Invoice submitted",
    actor: retailCompany,
  },
  {
    invoiceId: "RTL-2026-0733",
    ts: daysAgo(14),
    label: "Audit review rejected",
    actor: auditor,
  },
  {
    invoiceId: "CON-2026-0221",
    ts: daysAgo(18),
    label: "Public works certificate verified",
    actor: auditor,
  },
  {
    invoiceId: "CON-2026-0221",
    ts: daysAgo(16),
    label: "Invoice funded",
    actor: secondInvestor,
  },
  {
    invoiceId: "AGR-2026-0388",
    ts: daysAgo(20),
    label: "Invoice submitted",
    actor: agricultureCompany,
  },
  {
    invoiceId: "AGR-2026-0388",
    ts: daysAgo(2),
    label: "Invoice repaid",
    actor: agricultureCompany,
  },
  {
    invoiceId: "WHL-2026-0462",
    ts: daysAgo(6),
    label: "Invoice submitted",
    actor: company,
  },
  {
    invoiceId: "WHL-2026-0462",
    ts: daysAgo(5),
    label: "Additional buyer aging report requested",
    actor: auditor,
  },
  {
    invoiceId: "MFG-2026-0520",
    ts: daysAgo(25),
    label: "Invoice funded",
    actor: investor,
  },
];

let mockInvoices = [...seedInvoices];
let mockAudit = [...seedAudit];
let nextMockId = 318743;

function riskFromCreditScore(score: number): RiskLevel {
  if (score >= 720) return "Low";
  if (score >= 650) return "Medium";
  return "High";
}

function addAudit(invoice: Invoice, label: string, actor = mockWalletAddress) {
  mockAudit = [
    {
      invoiceId: invoice.id,
      ts: Date.now(),
      label,
      actor,
    },
    ...mockAudit,
  ];
}

function replaceInvoice(onchainId: string, update: (invoice: Invoice) => Invoice) {
  mockInvoices = mockInvoices.map((invoice) =>
    invoice.onchainId === onchainId ? update(invoice) : invoice,
  );
  return mockInvoices.find((invoice) => invoice.onchainId === onchainId);
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMockChainState() {
  await delay(150);
  return {
    invoices: [...mockInvoices],
    audit: [...mockAudit],
  };
}

export async function createMockInvoice(input: CreateInvoiceInput) {
  input.onProgress?.("Creating encrypted invoice...");
  await delay();
  const invoice: Invoice = {
    onchainId: String(nextMockId++),
    id: input.id,
    company: mockWalletAddress,
    companyName: companyNames[mockWalletAddress] ?? "Connected Company",
    counterparty: input.counterparty || "Pending buyer",
    invoiceHash: input.invoiceHash,
    documentName: input.documentName || `${input.id.toLowerCase()}.pdf`,
    industry: input.industry,
    dueDays: input.dueDays,
    dueDate: daysAfter(input.dueDays),
    apr: input.apr,
    invoiceAmount: input.invoiceAmount,
    requestedAmount: input.requestedAmount,
    creditScore: input.creditScore,
    privateValuesLoaded: false,
    encrypted: true,
    auditorAccessGranted: false,
    status: "Created",
    riskLevel: "Unset",
    investor: null,
    investorName: null,
    publicFundingAmount: 0,
    createdAt: Date.now(),
    hasEvaluation: false,
    fundingTarget: input.requestedAmount,
    fundingDeadline: daysAfter(14),
    repaymentDueDate: daysAfter(input.dueDays),
    repaidAt: null,
    cancelledAt: null,
    cancellationReason: null,
    auditorAddress: null,
    auditReviewStatus: "NotRequested",
    auditDecision: null,
    auditNotes: null,
    auditReportHash: null,
    evidenceChecklist: evidence(false),
  };
  mockInvoices = [invoice, ...mockInvoices];
  addAudit(invoice, "Invoice submitted");
}

export async function evaluateMockInvoice(onchainId: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({ ...item, hasEvaluation: true }));
  if (invoice) addAudit(invoice, "Encrypted eligibility evaluated", creditOfficer);
}

export async function finalizeMockEligibility(onchainId: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => {
    const approved =
      item.requestedAmount <= item.invoiceAmount * 0.8 &&
      item.creditScore >= 650 &&
      item.dueDays <= 90;
    return {
      ...item,
      status: approved ? "Eligible" : "Rejected",
      riskLevel: riskFromCreditScore(item.creditScore),
      hasEvaluation: true,
    };
  });
  if (invoice) addAudit(invoice, "Eligibility finalized", creditOfficer);
}

export async function grantMockAuditorAccess(onchainId: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({
    ...item,
    auditorAccessGranted: true,
    auditorAddress: auditor,
    auditReviewStatus: "PendingReview",
  }));
  if (invoice) addAudit(invoice, "Auditor access granted");
}

export async function fundMockInvoice(onchainId: string, amount: number) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({
    ...item,
    status: item.publicFundingAmount + amount >= item.fundingTarget ? "Funded" : item.status,
    investor,
    investorName: investorNames[investor],
    publicFundingAmount: Math.min(item.fundingTarget, item.publicFundingAmount + amount),
  }));
  if (invoice) addAudit(invoice, "Invoice funded");
}

export async function markMockRepaid(onchainId: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({
    ...item,
    status: "Repaid",
    repaidAt: Date.now(),
  }));
  if (invoice) addAudit(invoice, "Invoice repaid");
}

export async function cancelMockInvoice(onchainId: string, reason: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({
    ...item,
    status: "Rejected",
    cancelledAt: Date.now(),
    cancellationReason: reason || "Cancelled by company before funding",
  }));
  if (invoice) addAudit(invoice, "Invoice cancelled by company");
}

export async function updateMockAuditor(onchainId: string, auditorAddress: string) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => ({
    ...item,
    auditorAddress,
  }));
  if (invoice) addAudit(invoice, "Auditor assigned");
}

export async function reviewMockInvoice(
  onchainId: string,
  status: Exclude<AuditReviewStatus, "NotRequested" | "PendingReview">,
  notes: string,
) {
  await delay();
  const invoice = replaceInvoice(onchainId, (item) => {
    const approved = status === "Approved";
    return {
      ...item,
      auditReviewStatus: status,
      auditDecision: notes,
      auditNotes: notes,
      auditReportHash: approved
        ? `ipfs://bafybei${item.onchainId.toLowerCase()}auditreport7cn2ehz4xvqqpwm`
        : item.auditReportHash,
      evidenceChecklist: item.evidenceChecklist.map((entry) => ({
        ...entry,
        completed: approved ? true : entry.completed,
      })),
    };
  });
  if (invoice) addAudit(invoice, `Audit review ${status.toLowerCase()}`, auditor);
}

export async function requestMockAuditInfo(onchainId: string, notes: string) {
  return reviewMockInvoice(
    onchainId,
    "InfoRequested",
    notes || "Additional buyer confirmation requested before approval.",
  );
}

export async function decryptMockInvoice(onchainId: string) {
  await delay();
  const invoice = mockInvoices.find((item) => item.onchainId === onchainId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  addAudit(invoice, "Private values decrypted", auditor);
  return {
    invoiceAmount: invoice.invoiceAmount,
    requestedAmount: invoice.requestedAmount,
    creditScore: invoice.creditScore,
  };
}
