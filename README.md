# PrivInvoice Platform

Production-oriented monorepo layout for the PrivInvoice app and contracts. The frontend and smart contracts remain separated so each side can be built, deployed, and tested independently.

## Structure

```text
PrivInvoice-platform/
  apps/
    web/                 # TanStack/Vite frontend app
  packages/
    contracts/           # Hardhat + Zama FHEVM contracts
  package.json           # Root convenience scripts
  pnpm-workspace.yaml    # Workspace package discovery
```

## Frontend

The web app lives in `apps/web` and keeps the original frontend logic and configuration.

```bash
pnpm --dir apps/web install
pnpm --dir apps/web dev
```

Root convenience scripts:

```bash
pnpm run web:dev
pnpm run web:build
pnpm run web:lint
```

Chain integration details live in [apps/web/CHAIN_INTEGRATION.md](apps/web/CHAIN_INTEGRATION.md). Copy [apps/web/.env.example](apps/web/.env.example) to `apps/web/.env.local` after deploying contracts, then fill in the RPC URL, PrivInvoice address, USDZ address, default auditor address, and deployment block.

For UI-only role demos, set `VITE_ENABLE_MOCK_DATA=true`. Mock mode now covers Company, Investor, and Auditor workflows without wallet, FHE, RPC, or contract calls.

For the full Chinese end-to-end setup, testing, deployment, and acceptance workflow, see [WORKFLOW_CN.md](WORKFLOW_CN.md).

## Contracts

The contract project lives in `packages/contracts` and keeps the Hardhat project structure, tests, deploy scripts, and docs.

```bash
pnpm --dir packages/contracts install
pnpm --dir packages/contracts compile
pnpm --dir packages/contracts test
```

Root convenience scripts:

```bash
pnpm run contracts:compile
pnpm run contracts:test
pnpm run contracts:deploy:localhost
pnpm run contracts:deploy:sepolia
```

Sepolia deployment uses Hardhat vars:

```bash
pnpm --dir packages/contracts exec hardhat vars set SEPOLIA_RPC_URL
pnpm --dir packages/contracts exec hardhat vars set DEPLOYER_PRIVATE_KEY
pnpm run contracts:deploy:sepolia
```

## Migration Notes

- Frontend source was moved under `apps/web`.
- Contract source was moved under `packages/contracts`.
- Generated folders and local dependencies were not copied: `node_modules`, Hardhat artifacts/cache/types, coverage output, and FHEVM temp output.
- Business logic was preserved during the structure migration.
