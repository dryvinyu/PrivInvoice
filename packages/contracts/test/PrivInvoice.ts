import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { MockUSDZ, MockUSDZ__factory, PrivInvoice, PrivInvoice__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  company: HardhatEthersSigner;
  investor: HardhatEthersSigner;
  auditor: HardhatEthersSigner;
  other: HardhatEthersSigner;
};

const Status = {
  Created: 0n,
  Eligible: 1n,
  Rejected: 2n,
  Funded: 3n,
  Repaid: 4n,
};

const RiskLevel = {
  Unset: 0n,
  Low: 1n,
  Medium: 2n,
  High: 3n,
};

async function deployFixture() {
  const mockFactory = (await ethers.getContractFactory("MockUSDZ")) as MockUSDZ__factory;
  const mockUSDZ = (await mockFactory.deploy()) as MockUSDZ;
  await mockUSDZ.waitForDeployment();

  const invoiceFactory = (await ethers.getContractFactory("PrivInvoice")) as PrivInvoice__factory;
  const privInvoice = (await invoiceFactory.deploy(await mockUSDZ.getAddress())) as PrivInvoice;
  await privInvoice.waitForDeployment();

  return {
    mockUSDZ,
    mockUSDZAddress: await mockUSDZ.getAddress(),
    privInvoice,
    privInvoiceAddress: await privInvoice.getAddress(),
  };
}

async function createInvoice(
  privInvoice: PrivInvoice,
  privInvoiceAddress: string,
  company: HardhatEthersSigner,
  overrides: Partial<{
    invoiceAmount: number;
    requestedAmount: number;
    creditScore: number;
    dueDays: number;
  }> = {},
) {
  const invoiceId = await privInvoice.nextInvoiceId();
  const input = fhevm.createEncryptedInput(privInvoiceAddress, company.address);
  input.add64(overrides.invoiceAmount ?? 100000);
  input.add64(overrides.requestedAmount ?? 75000);
  input.add32(overrides.creditScore ?? 720);
  const encryptedInput = await input.encrypt();

  const externalInvoiceId = `INV-2026-${invoiceId.toString().padStart(3, "0")}`;
  const invoiceHash = "ipfs://QmInvoiceDocumentHash";
  const tx = await privInvoice.connect(company).createInvoice(
    externalInvoiceId,
    invoiceHash,
    "Manufacturing",
    overrides.dueDays ?? 60,
    800,
    encryptedInput.handles[0],
    encryptedInput.handles[1],
    encryptedInput.handles[2],
    encryptedInput.inputProof,
  );
  await tx.wait();

  return { invoiceId, externalInvoiceId, invoiceHash };
}

describe("PrivInvoice", function () {
  let signers: Signers;
  let mockUSDZ: MockUSDZ;
  let privInvoice: PrivInvoice;
  let privInvoiceAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      company: ethSigners[1],
      investor: ethSigners[2],
      auditor: ethSigners[3],
      other: ethSigners[4],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite is intended for the local FHEVM mock environment");
      this.skip();
    }

    ({ mockUSDZ, privInvoice, privInvoiceAddress } = await deployFixture());
    await mockUSDZ.mint(signers.investor.address, ethers.parseUnits("1000000", 18));
  });

  it("runs the confidential invoice financing lifecycle", async function () {
    const { invoiceId, externalInvoiceId, invoiceHash } = await createInvoice(
      privInvoice,
      privInvoiceAddress,
      signers.company,
    );

    let publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.externalInvoiceId).to.equal(externalInvoiceId);
    expect(publicInvoice.company).to.equal(signers.company.address);
    expect(publicInvoice.invoiceHash).to.equal(invoiceHash);
    expect(publicInvoice.industry).to.equal("Manufacturing");
    expect(publicInvoice.dueDays).to.equal(60n);
    expect(publicInvoice.aprBps).to.equal(800n);
    expect(publicInvoice.status).to.equal(Status.Created);
    expect(publicInvoice.riskLevel).to.equal(RiskLevel.Unset);
    expect(publicInvoice.riskLevelSet).to.equal(false);

    await (await privInvoice.evaluateInvoice(invoiceId)).wait();

    publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.status).to.equal(Status.Created);
    expect(publicInvoice.hasEvaluation).to.equal(true);

    const maxFinanceAmountHandle = await privInvoice.getEncryptedMaxFinanceAmountHandle(invoiceId);
    const eligibilityHandle = await privInvoice.getEncryptedEligibilityHandle(invoiceId);
    expect(maxFinanceAmountHandle).to.not.equal(ethers.ZeroHash);
    expect(eligibilityHandle).to.not.equal(ethers.ZeroHash);

    const maxFinanceAmount = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      maxFinanceAmountHandle,
      privInvoiceAddress,
      signers.company,
    );
    const eligible = await fhevm.userDecryptEbool(eligibilityHandle, privInvoiceAddress, signers.company);
    expect(maxFinanceAmount).to.equal(80000n);
    expect(eligible).to.equal(true);

    await (await privInvoice.connect(signers.company).finalizeEligibility(invoiceId, true, RiskLevel.Low)).wait();
    publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.status).to.equal(Status.Eligible);
    expect(publicInvoice.riskLevel).to.equal(RiskLevel.Low);
    expect(publicInvoice.riskLevelSet).to.equal(true);

    await (await privInvoice.connect(signers.company).grantAuditorAccess(invoiceId, signers.auditor.address)).wait();
    expect(await privInvoice.auditorAccess(invoiceId, signers.auditor.address)).to.equal(true);

    const auditorEligible = await fhevm.userDecryptEbool(eligibilityHandle, privInvoiceAddress, signers.auditor);
    expect(auditorEligible).to.equal(true);

    const fundingAmount = ethers.parseUnits("75000", 18);
    await (await mockUSDZ.connect(signers.investor).approve(privInvoiceAddress, fundingAmount)).wait();
    await (await privInvoice.connect(signers.investor).fundInvoice(invoiceId, fundingAmount)).wait();

    publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.status).to.equal(Status.Funded);
    expect(publicInvoice.investor).to.equal(signers.investor.address);
    expect(publicInvoice.publicFundingAmount).to.equal(fundingAmount);

    await (await privInvoice.connect(signers.company).markRepaid(invoiceId)).wait();

    publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.status).to.equal(Status.Repaid);
  });

  it("rejects unauthorized and invalid actions", async function () {
    const { invoiceId } = await createInvoice(privInvoice, privInvoiceAddress, signers.company);

    await expect(
      privInvoice.connect(signers.other).grantAuditorAccess.staticCall(invoiceId, signers.auditor.address),
    ).to.be.revertedWithCustomError(privInvoice, "NotCompany");

    await expect(privInvoice.connect(signers.other).markRepaid.staticCall(invoiceId)).to.be.revertedWithCustomError(
      privInvoice,
      "NotCompany",
    );

    await expect(privInvoice.evaluateInvoice.staticCall(999n)).to.be.revertedWithCustomError(
      privInvoice,
      "InvalidInvoiceId",
    );

    await (await privInvoice.evaluateInvoice(invoiceId)).wait();
    const fundingAmount = ethers.parseUnits("75000", 18);
    await (await mockUSDZ.connect(signers.investor).approve(privInvoiceAddress, fundingAmount)).wait();

    await expect(
      privInvoice.connect(signers.investor).fundInvoice.staticCall(invoiceId, fundingAmount),
    ).to.be.revertedWithCustomError(privInvoice, "InvalidStatus");

    await (await privInvoice.finalizeEligibility(invoiceId, true, RiskLevel.Medium)).wait();
    await (await privInvoice.connect(signers.investor).fundInvoice(invoiceId, fundingAmount)).wait();
    await (await privInvoice.connect(signers.company).markRepaid(invoiceId)).wait();

    await expect(
      privInvoice.connect(signers.investor).fundInvoice.staticCall(invoiceId, fundingAmount),
    ).to.be.revertedWithCustomError(privInvoice, "InvalidStatus");
  });

  it("supports eligibility finalization by company, owner, or auditor after FHE evaluation", async function () {
    const { invoiceId } = await createInvoice(privInvoice, privInvoiceAddress, signers.company);

    await expect(privInvoice.finalizeEligibility.staticCall(invoiceId, true, RiskLevel.Low)).to.be.revertedWithCustomError(
      privInvoice,
      "MissingEvaluation",
    );

    await (await privInvoice.evaluateInvoice(invoiceId)).wait();

    await expect(
      privInvoice.connect(signers.other).finalizeEligibility.staticCall(invoiceId, true, RiskLevel.Low),
    ).to.be.revertedWithCustomError(privInvoice, "NotAuthorizedFinalizer");

    await (await privInvoice.connect(signers.company).finalizeEligibility(invoiceId, true, RiskLevel.Low)).wait();
    let publicInvoice = await privInvoice.getInvoicePublic(invoiceId);
    expect(publicInvoice.status).to.equal(Status.Eligible);
    expect(publicInvoice.riskLevel).to.equal(RiskLevel.Low);

    const { invoiceId: ownerFinalizedInvoiceId } = await createInvoice(
      privInvoice,
      privInvoiceAddress,
      signers.company,
    );
    await (await privInvoice.evaluateInvoice(ownerFinalizedInvoiceId)).wait();
    await (await privInvoice.finalizeEligibility(ownerFinalizedInvoiceId, true, RiskLevel.Medium)).wait();
    publicInvoice = await privInvoice.getInvoicePublic(ownerFinalizedInvoiceId);
    expect(publicInvoice.status).to.equal(Status.Eligible);
    expect(publicInvoice.riskLevel).to.equal(RiskLevel.Medium);

    const { invoiceId: secondInvoiceId } = await createInvoice(privInvoice, privInvoiceAddress, signers.company);
    await (await privInvoice.connect(signers.company).grantAuditorAccess(secondInvoiceId, signers.auditor.address)).wait();
    await (await privInvoice.evaluateInvoice(secondInvoiceId)).wait();
    await (await privInvoice.connect(signers.auditor).finalizeEligibility(secondInvoiceId, false, RiskLevel.High)).wait();
    publicInvoice = await privInvoice.getInvoicePublic(secondInvoiceId);
    expect(publicInvoice.status).to.equal(Status.Rejected);
    expect(publicInvoice.riskLevel).to.equal(RiskLevel.High);
  });

  it("allows auditors granted before evaluation to decrypt evaluation handles", async function () {
    const { invoiceId } = await createInvoice(privInvoice, privInvoiceAddress, signers.company);

    await (await privInvoice.connect(signers.company).grantAuditorAccess(invoiceId, signers.auditor.address)).wait();
    await (await privInvoice.evaluateInvoice(invoiceId)).wait();

    const eligibilityHandle = await privInvoice.getEncryptedEligibilityHandle(invoiceId);
    const auditorEligible = await fhevm.userDecryptEbool(eligibilityHandle, privInvoiceAddress, signers.auditor);
    expect(auditorEligible).to.equal(true);
  });

  it("records authorized decryption events for compliance audit trails", async function () {
    const { invoiceId } = await createInvoice(privInvoice, privInvoiceAddress, signers.company);

    await expect(privInvoice.connect(signers.other).recordDecryption.staticCall(invoiceId)).to.be.revertedWithCustomError(
      privInvoice,
      "NotAuthorizedDecryptor",
    );

    await expect(privInvoice.connect(signers.company).recordDecryption(invoiceId))
      .to.emit(privInvoice, "DataDecryptionRecorded")
      .withArgs(invoiceId, signers.company.address);

    await (await privInvoice.connect(signers.company).grantAuditorAccess(invoiceId, signers.auditor.address)).wait();
    await expect(privInvoice.connect(signers.auditor).recordDecryption(invoiceId))
      .to.emit(privInvoice, "DataDecryptionRecorded")
      .withArgs(invoiceId, signers.auditor.address);
  });
});
