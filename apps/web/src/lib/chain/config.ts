export const chainConfig = {
  mockDataEnabled: import.meta.env.VITE_ENABLE_MOCK_DATA === "true",
  privInvoiceAddress: import.meta.env.VITE_PRIVINVOICE_ADDRESS?.trim() || "",
  usdzAddress: import.meta.env.VITE_USDZ_ADDRESS?.trim() || "",
  rpcUrl: import.meta.env.VITE_RPC_URL?.trim() || "",
  defaultAuditorAddress: import.meta.env.VITE_DEFAULT_AUDITOR_ADDRESS?.trim() || "",
  deploymentBlock: Number(import.meta.env.VITE_PRIVINVOICE_DEPLOY_BLOCK || 0),
};

export function requireConfiguredAddress(value: string, envName: string) {
  if (!value) {
    throw new Error(`${envName} is not configured`);
  }
  return value;
}
