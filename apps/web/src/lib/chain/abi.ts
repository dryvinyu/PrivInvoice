export const privInvoiceAbi = [
  "function nextInvoiceId() view returns (uint256)",
  "function createInvoice(string externalInvoiceId,string invoiceHash,string industry,uint32 dueDays,uint16 aprBps,bytes32 encryptedInvoiceAmount,bytes32 encryptedRequestedAmount,bytes32 encryptedCreditScore,bytes inputProof) returns (uint256)",
  "function evaluateInvoice(uint256 invoiceId)",
  "function finalizeEligibility(uint256 invoiceId,bool approved,uint8 riskLevel)",
  "function grantAuditorAccess(uint256 invoiceId,address auditor)",
  "function fundInvoice(uint256 invoiceId,uint256 amount)",
  "function markRepaid(uint256 invoiceId)",
  "function recordDecryption(uint256 invoiceId)",
  "function auditorAccess(uint256 invoiceId,address auditor) view returns (bool)",
  "function getEncryptedInvoiceAmountHandle(uint256 invoiceId) view returns (bytes32)",
  "function getEncryptedRequestedAmountHandle(uint256 invoiceId) view returns (bytes32)",
  "function getEncryptedCreditScoreHandle(uint256 invoiceId) view returns (bytes32)",
  "function getEncryptedEligibilityHandle(uint256 invoiceId) view returns (bytes32)",
  "function getInvoicePublic(uint256 invoiceId) view returns (uint256 id,string externalInvoiceId,address company,string invoiceHash,string industry,uint32 dueDays,uint16 aprBps,uint8 status,uint8 riskLevel,bool riskLevelSet,address investor,uint256 publicFundingAmount,uint256 createdAt,bool hasEvaluation)",
  "event InvoiceCreated(uint256 indexed invoiceId,address indexed company,string externalInvoiceId,string invoiceHash)",
  "event InvoiceEvaluated(uint256 indexed invoiceId)",
  "event EligibilityFinalized(uint256 indexed invoiceId,bool approved,uint8 riskLevel)",
  "event AuditorAccessGranted(uint256 indexed invoiceId,address indexed auditor)",
  "event InvoiceFunded(uint256 indexed invoiceId,address indexed investor,uint256 amount)",
  "event InvoiceRepaid(uint256 indexed invoiceId)",
  "event DataDecryptionRecorded(uint256 indexed invoiceId,address indexed account)",
] as const;

export const mockUsdzAbi = [
  "function approve(address spender,uint256 amount) returns (bool)",
  "function allowance(address owner,address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const;
