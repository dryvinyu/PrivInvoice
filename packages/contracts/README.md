# PrivInvoice Contracts

PrivInvoice is a hackathon MVP for confidential RWA invoice financing powered by Zama FHEVM. SMEs can submit encrypted invoice financing data onchain, while the contract evaluates eligibility over encrypted values without revealing invoice amount, requested financing amount, or credit score.

## Stack

- Solidity `^0.8.24`
- Hardhat
- TypeScript tests
- Zama FHEVM Solidity library
- `@fhevm/hardhat-plugin`
- OpenZeppelin ERC20 for the mock stablecoin
- pnpm

## Contracts

### `PrivInvoice.sol`

Main confidential invoice financing contract.

Encrypted fields:

- `invoiceAmount`: `euint64`
- `requestedAmount`: `euint64`
- `creditScore`: `euint32`
- `maxFinanceAmount`: `euint64`
- `amountOk`: `ebool`
- `scoreOk`: `ebool`
- `eligible`: `ebool`

Public fields include frontend invoice id, invoice/IPFS reference, metadata, company address, due days, APR, status, public risk band, investor address, and public funding amount.

Eligibility is computed as:

```text
requestedAmount <= invoiceAmount * 80 / 100
creditScore >= 650
dueDays <= 90
```

The final result is stored as encrypted `eligible`. The contract does not branch on `eligible` with a normal Solidity `if`, because `eligible` is an encrypted boolean.

The public status enum is synchronized with the frontend:

```text
Created -> Eligible / Rejected -> Funded -> Repaid
```

`evaluateInvoice` computes encrypted eligibility handles. `finalizeEligibility` is the MVP finalization step that sets the frontend-visible `Eligible` or `Rejected` status and public risk band after a company, owner, or authorized auditor review/offchain finalization.

### `MockUSDZ.sol`

Simple ERC20 mock token for demo funding flows.

- Name: `Mock USDZ`
- Symbol: `USDZ`
- Decimals: `18`
- Public `mint` function for local testing and demos

## Install

```bash
pnpm install
```

## Compile

```bash
pnpm compile
```

## Test

```bash
pnpm test
```

The tests use the official FHEVM Hardhat encrypted input helper:

```ts
const input = fhevm.createEncryptedInput(privInvoiceAddress, company.address);
input.add64(100000);
input.add64(75000);
input.add32(720);
const encryptedInput = await input.encrypt();
```

## Deploy

Deploy to the in-process Hardhat network:

```bash
pnpm exec hardhat deploy --network hardhat
```

Deploy to a running local node:

```bash
pnpm deploy:localhost
```

The deploy script:

1. Deploys `MockUSDZ`
2. Deploys `PrivInvoice` with the `MockUSDZ` address
3. Mints demo USDZ to the deployer
4. Prints deployed addresses

## Frontend Flow

1. Company encrypts `invoiceAmount`, `requestedAmount`, and `creditScore` using the FHEVM SDK or relayer flow.
2. Company calls `createInvoice(externalInvoiceId, invoiceHash, industry, dueDays, aprBps, ...)` with encrypted handles and `inputProof`.
3. Anyone can call `evaluateInvoice(invoiceId)` to run the encrypted eligibility calculation.
4. Company or authorized auditor reads encrypted handles from the getter functions.
5. Authorized users decrypt handles offchain with `userDecrypt`.
6. Company, owner, or authorized auditor calls `finalizeEligibility(invoiceId, approved, riskLevel)` to publish `Eligible` or `Rejected` for the marketplace.
7. Company can call `grantAuditorAccess(invoiceId, auditor)` to allow auditor decryption.
8. Authorized decryptors call `recordDecryption(invoiceId)` so the compliance log has an onchain event.
9. Investor approves `MockUSDZ` and calls `fundInvoice(invoiceId, amount)` for `Eligible` invoices.
10. Company calls `markRepaid(invoiceId)` after repayment.

## MVP Notes

- Funding amount is public in this MVP.
- `MockUSDZ` is not production-safe because anyone can mint.
- `finalizeEligibility` is a demo helper. Production should replace it with a verified async public decryption proof, gateway callback, oracle, or another audited FHEVM finalization flow.
- Private invoice values are not emitted in events and are not exposed as plaintext getters.

See [CONTRACTS.md](./CONTRACTS.md) for more detailed contract-layer notes.
