export type InvoiceStatus = "Created" | "Eligible" | "Rejected" | "Funded" | "Repaid";

export type RiskLevel = "Unset" | "Low" | "Medium" | "High";

export type Role = "Company" | "Investor" | "Auditor";

export type AuditReviewStatus =
  | "NotRequested"
  | "PendingReview"
  | "InfoRequested"
  | "Approved"
  | "Rejected";

export type Invoice = {
  onchainId: string;
  id: string;
  company: string;
  companyName: string;
  counterparty: string;
  invoiceHash: string;
  documentName: string;
  industry: string;
  dueDays: number;
  dueDate: string;
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
  investorName: string | null;
  publicFundingAmount: number;
  createdAt: number;
  hasEvaluation: boolean;
  fundingTarget: number;
  fundingDeadline: string;
  repaymentDueDate: string;
  repaidAt: number | null;
  cancelledAt: number | null;
  cancellationReason: string | null;
  auditorAddress: string | null;
  auditReviewStatus: AuditReviewStatus;
  auditDecision: string | null;
  auditNotes: string | null;
  auditReportHash: string | null;
  evidenceChecklist: {
    label: string;
    completed: boolean;
  }[];
};

export type AuditEvent = {
  invoiceId: string;
  ts: number;
  label: string;
  actor: string;
};
