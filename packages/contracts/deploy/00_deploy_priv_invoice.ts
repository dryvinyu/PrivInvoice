import { DeployFunction } from "hardhat-deploy/types";
import { ethers, network } from "hardhat";

const func: DeployFunction = async function () {
  const [deployer] = await ethers.getSigners();
  if (deployer === undefined) {
    throw new Error(
      "No deployer account configured. Set DEPLOYER_PRIVATE_KEY with `pnpm --dir packages/contracts exec hardhat vars set DEPLOYER_PRIVATE_KEY`.",
    );
  }

  console.log(`Deploying PrivInvoice stack to ${network.name} with ${deployer.address}`);

  const MockUSDZ = await ethers.getContractFactory("MockUSDZ");
  const mockUSDZ = await MockUSDZ.deploy();
  const mockUSDZReceipt = await mockUSDZ.deploymentTransaction()?.wait();
  await mockUSDZ.waitForDeployment();

  const PrivInvoice = await ethers.getContractFactory("PrivInvoice");
  const privInvoice = await PrivInvoice.deploy(await mockUSDZ.getAddress());
  const privInvoiceReceipt = await privInvoice.deploymentTransaction()?.wait();
  await privInvoice.waitForDeployment();

  const demoMint = ethers.parseUnits("1000000", 18);
  const mintReceipt = await (await mockUSDZ.mint(deployer.address, demoMint)).wait();

  const mockUSDZAddress = await mockUSDZ.getAddress();
  const privInvoiceAddress = await privInvoice.getAddress();
  const privInvoiceDeployBlock = privInvoiceReceipt?.blockNumber ?? 0;

  console.log(`MockUSDZ deployed to: ${mockUSDZAddress}`);
  console.log(`MockUSDZ deploy tx: ${mockUSDZReceipt?.hash ?? "unknown"}`);
  console.log(`PrivInvoice deployed to: ${privInvoiceAddress}`);
  console.log(`PrivInvoice deploy tx: ${privInvoiceReceipt?.hash ?? "unknown"}`);
  console.log(`PrivInvoice deploy block: ${privInvoiceDeployBlock}`);
  console.log(`Minted ${ethers.formatUnits(demoMint, 18)} USDZ to ${deployer.address}`);
  console.log(`Mint tx: ${mintReceipt?.hash ?? "unknown"}`);
  console.log("");
  console.log("Frontend .env.local values:");
  console.log(`VITE_PRIVINVOICE_ADDRESS=${privInvoiceAddress}`);
  console.log(`VITE_USDZ_ADDRESS=${mockUSDZAddress}`);
  console.log(`VITE_PRIVINVOICE_DEPLOY_BLOCK=${privInvoiceDeployBlock}`);
};

export default func;
func.tags = ["PrivInvoice"];
