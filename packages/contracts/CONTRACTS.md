# PrivInvoice Contract Notes

## Encrypted fields

`PrivInvoice` stores invoice amount, requested amount, credit score, max finance amount, amount check, score check, and final eligibility as Zama FHEVM encrypted types:

- `invoiceAmount`: `euint64`
- `requestedAmount`: `euint64`
- `creditScore`: `euint32`
- `maxFinanceAmount`: `euint64`
- `amountOk`: `ebool`
- `scoreOk`: `ebool`
- `eligible`: `ebool`

No plaintext invoice amount, requested amount, or credit score is emitted or returned.

## Eligibility and status

The contract evaluates:

- `requestedAmount <= invoiceAmount * 80 / 100`
- `creditScore >= 650`
- `dueDays <= 90`

The public status enum mirrors the frontend flow exactly:

- `Created`
- `Eligible`
- `Rejected`
- `Funded`
- `Repaid`

The FHE result is stored as encrypted `eligible`. Solidity cannot branch with `if (eligible)` because `eligible` is an encrypted boolean, so `evaluateInvoice` computes encrypted handles and keeps the public status as `Created`. The company, owner, or an authorized auditor then calls `finalizeEligibility(invoiceId, approved, riskLevel)` after offchain/public finalization to set the frontend-visible `Eligible` or `Rejected` status and public risk band.

Production should replace this MVP finalization path with verified asynchronous public decryption proof, gateway callback, oracle, or another audited FHEVM finalization flow.

## Frontend-aligned public fields

`getInvoicePublic` returns both the onchain numeric id and the frontend-facing `externalInvoiceId`, plus the string `invoiceHash` / IPFS reference used by the app. Public metadata also includes industry, due days, APR basis points, status, risk level, investor, funding amount, creation timestamp, and whether encrypted evaluation has run.

## Auditor access

Only the invoice company can grant auditor access. `grantAuditorAccess` stores `auditorAccess[invoiceId][auditor] = true` and calls `FHE.allow` for the encrypted invoice values and any evaluated result handles.

Authorized companies and auditors can call `recordDecryption(invoiceId)` to emit `DataDecryptionRecorded`, giving the frontend compliance log a chain-backed event for authorized decrypt actions.

## Frontend flow

1. Encrypt `invoiceAmount`, `requestedAmount`, and `creditScore` with the FHEVM relayer/SDK for the `PrivInvoice` contract and company address.
2. Call `createInvoice(externalInvoiceId, invoiceHash, industry, dueDays, aprBps, ...)` with the encrypted handles and `inputProof`.
3. Call `evaluateInvoice(invoiceId)` to compute and store encrypted eligibility.
4. Use the encrypted handle getters with `userDecrypt` for authorized company/auditor views.
5. The company, owner, or authorized auditor finalizes the public marketplace status with `finalizeEligibility(invoiceId, approved, riskLevel)`.
6. Company calls `grantAuditorAccess(invoiceId, auditor)` when an auditor should decrypt private handles.
7. Authorized decryptors call `recordDecryption(invoiceId)` when a decrypted view is shown.
8. Investor approves `MockUSDZ`, then calls `fundInvoice(invoiceId, amount)` for `Eligible` invoices.
9. Company calls `markRepaid(invoiceId)` after repayment.

## MVP/demo parts

- `MockUSDZ` is a demo ERC20 with unrestricted minting.
- Funding amount is public because the MVP focuses privacy on invoice underwriting data.
- Eligibility finalization is intentionally not privacy-preserving governance; it exists only to avoid pretending an encrypted `ebool` can directly drive public status.
