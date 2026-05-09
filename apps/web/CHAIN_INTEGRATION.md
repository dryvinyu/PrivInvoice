# Frontend Chain Integration

The frontend now treats the chain as the source of truth. Invoice lists, status, audit logs, auditor ACL state, funding state, and decrypted-value requests all flow through `src/lib/chain` and the Zustand store in `src/lib/store.ts`.

## Required Environment

Create `apps/web/.env.local` from `.env.example`:

```bash
VITE_RPC_URL=http://127.0.0.1:8545
VITE_PRIVINVOICE_ADDRESS=0x...
VITE_USDZ_ADDRESS=0x...
VITE_DEFAULT_AUDITOR_ADDRESS=0x...
VITE_PRIVINVOICE_DEPLOY_BLOCK=0
```

## Required FHE Adapter

The create/finalize/decrypt flows require a browser-side FHE adapter. Initialize the official Zama relayer/FHEVM browser SDK and expose this shape before users call encrypted actions:

```ts
window.privInvoiceFhe = {
  createEncryptedInput(contractAddress, userAddress) {
    return fhevm.createEncryptedInput(contractAddress, userAddress);
  },
  userDecryptEuint64(handle, contractAddress, userAddress) {
    return fhevm.userDecryptEuint64(handle, contractAddress, userAddress);
  },
  userDecryptEuint32(handle, contractAddress, userAddress) {
    return fhevm.userDecryptEuint32(handle, contractAddress, userAddress);
  },
  userDecryptEbool(handle, contractAddress, userAddress) {
    return fhevm.userDecryptEbool(handle, contractAddress, userAddress);
  },
};
```

If your chosen SDK exposes different method names, keep the app code unchanged and adapt those calls inside `window.privInvoiceFhe`.

## Chain-Backed Frontend Flows

- `CreateInvoiceForm` encrypts fields through the FHE adapter, calls `createInvoice`, then refreshes chain state.
- `InvoiceCard` calls `evaluateInvoice`, `finalizeEligibility`, `grantAuditorAccess`, and `markRepaid`.
- `InvestorFundingModal` approves USDZ if needed and calls `fundInvoice`.
- `InvoiceDetailModal` and the auditor page call `recordDecryption`, then decrypt authorized handles through the FHE adapter.
- Audit timelines are reconstructed from PrivInvoice events, not local mock data.
