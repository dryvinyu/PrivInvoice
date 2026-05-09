export type InvoiceStatus = "Created" | "Eligible" | "Rejected" | "Funded" | "Repaid";

export type RiskLevel = "Unset" | "Low" | "Medium" | "High";

export type Role = "Company" | "Investor" | "Auditor";

export type Invoice = {
  onchainId: string;
  id: string;
  company: string;
  invoiceHash: string;
  industry: string;
  dueDays: number;
  apr: number;
  invoiceAmount: number;
  requestedAmount: number;
  creditScore: number;
  privateValuesLoaded: boolean;
  encrypted: boolean;
  auditorAccessGranted: boolean;
  status: InvoiceStatus;
  riskLevel: RiskLevel;
  investor: string | null;
  publicFundingAmount: number;
  createdAt: number;
  hasEvaluation: boolean;
};

export type AuditEvent = {
  invoiceId: string;
  ts: number;
  label: string;
  actor: string;
};
