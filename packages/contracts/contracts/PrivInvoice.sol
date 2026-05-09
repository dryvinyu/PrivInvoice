// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    FHE,
    ebool,
    euint32,
    euint64,
    externalEuint32,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PrivInvoice is ZamaEthereumConfig {
    using SafeERC20 for IERC20;

    enum InvoiceStatus {
        Created,
        Eligible,
        Rejected,
        Funded,
        Repaid
    }

    enum RiskLevel {
        Unset,
        Low,
        Medium,
        High
    }

    struct InvoiceRequest {
        uint256 id;
        string externalInvoiceId;
        address company;
        string invoiceHash;
        string industry;
        uint32 dueDays;
        uint16 aprBps;
        InvoiceStatus status;
        RiskLevel riskLevel;
        bool riskLevelSet;
        euint64 invoiceAmount;
        euint64 requestedAmount;
        euint32 creditScore;
        euint64 maxFinanceAmount;
        ebool amountOk;
        ebool scoreOk;
        ebool eligible;
        address investor;
        uint256 publicFundingAmount;
        uint256 createdAt;
        bool hasEvaluation;
    }

    IERC20 public immutable usdz;
    address public immutable owner;
    uint256 public nextInvoiceId = 1;

    mapping(uint256 => InvoiceRequest) private invoices;
    mapping(uint256 => mapping(address => bool)) public auditorAccess;
    mapping(uint256 => address[]) private invoiceAuditors;

    event InvoiceCreated(uint256 indexed invoiceId, address indexed company, string externalInvoiceId, string invoiceHash);
    event InvoiceEvaluated(uint256 indexed invoiceId);
    event EligibilityFinalized(uint256 indexed invoiceId, bool approved, RiskLevel riskLevel);
    event AuditorAccessGranted(uint256 indexed invoiceId, address indexed auditor);
    event InvoiceFunded(uint256 indexed invoiceId, address indexed investor, uint256 amount);
    event InvoiceRepaid(uint256 indexed invoiceId);
    event DataDecryptionRecorded(uint256 indexed invoiceId, address indexed account);

    error InvalidInvoiceId();
    error NotCompany();
    error NotAuthorizedFinalizer();
    error NotAuthorizedDecryptor();
    error InvalidStatus();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidRiskLevel();
    error MissingEvaluation();

    modifier invoiceExists(uint256 invoiceId) {
        if (invoices[invoiceId].company == address(0)) revert InvalidInvoiceId();
        _;
    }

    modifier onlyCompany(uint256 invoiceId) {
        if (invoices[invoiceId].company != msg.sender) revert NotCompany();
        _;
    }

    constructor(address usdz_) {
        if (usdz_ == address(0)) revert InvalidAddress();
        usdz = IERC20(usdz_);
        owner = msg.sender;
    }

    function createInvoice(
        string calldata externalInvoiceId,
        string calldata invoiceHash,
        string calldata industry,
        uint32 dueDays,
        uint16 aprBps,
        externalEuint64 encryptedInvoiceAmount,
        externalEuint64 encryptedRequestedAmount,
        externalEuint32 encryptedCreditScore,
        bytes calldata inputProof
    ) external returns (uint256) {
        uint256 invoiceId = nextInvoiceId++;
        InvoiceRequest storage inv = invoices[invoiceId];

        inv.id = invoiceId;
        inv.externalInvoiceId = externalInvoiceId;
        inv.company = msg.sender;
        inv.invoiceHash = invoiceHash;
        inv.industry = industry;
        inv.dueDays = dueDays;
        inv.aprBps = aprBps;
        inv.status = InvoiceStatus.Created;
        inv.createdAt = block.timestamp;

        inv.invoiceAmount = FHE.fromExternal(encryptedInvoiceAmount, inputProof);
        inv.requestedAmount = FHE.fromExternal(encryptedRequestedAmount, inputProof);
        inv.creditScore = FHE.fromExternal(encryptedCreditScore, inputProof);

        _allowPrivateInputs(inv, msg.sender);

        emit InvoiceCreated(invoiceId, msg.sender, externalInvoiceId, invoiceHash);
        return invoiceId;
    }

    function evaluateInvoice(uint256 invoiceId) external invoiceExists(invoiceId) {
        InvoiceRequest storage inv = invoices[invoiceId];
        if (inv.status != InvoiceStatus.Created || inv.hasEvaluation) revert InvalidStatus();

        inv.maxFinanceAmount = FHE.div(FHE.mul(inv.invoiceAmount, 80), 100);
        inv.amountOk = FHE.le(inv.requestedAmount, inv.maxFinanceAmount);
        inv.scoreOk = FHE.ge(inv.creditScore, 650);

        ebool dueDaysOk = FHE.asEbool(inv.dueDays <= 90);
        inv.eligible = FHE.and(FHE.and(inv.amountOk, inv.scoreOk), dueDaysOk);
        inv.hasEvaluation = true;

        _allowEvaluation(inv, inv.company);
        address[] storage auditors = invoiceAuditors[invoiceId];
        for (uint256 i = 0; i < auditors.length; i++) {
            _allowEvaluation(inv, auditors[i]);
        }

        emit InvoiceEvaluated(invoiceId);
    }

    function grantAuditorAccess(uint256 invoiceId, address auditor)
        external
        invoiceExists(invoiceId)
        onlyCompany(invoiceId)
    {
        if (auditor == address(0)) revert InvalidAddress();

        if (!auditorAccess[invoiceId][auditor]) {
            auditorAccess[invoiceId][auditor] = true;
            invoiceAuditors[invoiceId].push(auditor);
        }
        InvoiceRequest storage inv = invoices[invoiceId];
        _allowPrivateInputs(inv, auditor);
        if (inv.hasEvaluation) {
            _allowEvaluation(inv, auditor);
        }

        emit AuditorAccessGranted(invoiceId, auditor);
    }

    function fundInvoice(uint256 invoiceId, uint256 amount) external invoiceExists(invoiceId) {
        InvoiceRequest storage inv = invoices[invoiceId];
        if (inv.status != InvoiceStatus.Eligible) revert InvalidStatus();
        if (amount == 0) revert InvalidAmount();

        usdz.safeTransferFrom(msg.sender, inv.company, amount);
        inv.investor = msg.sender;
        inv.publicFundingAmount = amount;
        inv.status = InvoiceStatus.Funded;

        emit InvoiceFunded(invoiceId, msg.sender, amount);
    }

    function markRepaid(uint256 invoiceId) external invoiceExists(invoiceId) onlyCompany(invoiceId) {
        InvoiceRequest storage inv = invoices[invoiceId];
        if (inv.status != InvoiceStatus.Funded) revert InvalidStatus();

        inv.status = InvoiceStatus.Repaid;
        emit InvoiceRepaid(invoiceId);
    }

    function finalizeEligibility(uint256 invoiceId, bool approved, RiskLevel riskLevel)
        external
        invoiceExists(invoiceId)
    {
        InvoiceRequest storage inv = invoices[invoiceId];
        if (msg.sender != owner && msg.sender != inv.company && !auditorAccess[invoiceId][msg.sender]) {
            revert NotAuthorizedFinalizer();
        }
        if (!inv.hasEvaluation) revert MissingEvaluation();
        if (inv.status != InvoiceStatus.Created) revert InvalidStatus();
        if (riskLevel == RiskLevel.Unset) revert InvalidRiskLevel();

        inv.status = approved ? InvoiceStatus.Eligible : InvoiceStatus.Rejected;
        inv.riskLevel = riskLevel;
        inv.riskLevelSet = true;

        emit EligibilityFinalized(invoiceId, approved, riskLevel);
    }

    function recordDecryption(uint256 invoiceId) external invoiceExists(invoiceId) {
        InvoiceRequest storage inv = invoices[invoiceId];
        if (msg.sender != inv.company && !auditorAccess[invoiceId][msg.sender]) revert NotAuthorizedDecryptor();

        emit DataDecryptionRecorded(invoiceId, msg.sender);
    }

    function getEncryptedInvoiceAmountHandle(uint256 invoiceId)
        external
        view
        invoiceExists(invoiceId)
        returns (euint64)
    {
        return invoices[invoiceId].invoiceAmount;
    }

    function getEncryptedRequestedAmountHandle(uint256 invoiceId)
        external
        view
        invoiceExists(invoiceId)
        returns (euint64)
    {
        return invoices[invoiceId].requestedAmount;
    }

    function getEncryptedCreditScoreHandle(uint256 invoiceId) external view invoiceExists(invoiceId) returns (euint32) {
        return invoices[invoiceId].creditScore;
    }

    function getEncryptedMaxFinanceAmountHandle(uint256 invoiceId)
        external
        view
        invoiceExists(invoiceId)
        returns (euint64)
    {
        return invoices[invoiceId].maxFinanceAmount;
    }

    function getEncryptedAmountOkHandle(uint256 invoiceId) external view invoiceExists(invoiceId) returns (ebool) {
        return invoices[invoiceId].amountOk;
    }

    function getEncryptedScoreOkHandle(uint256 invoiceId) external view invoiceExists(invoiceId) returns (ebool) {
        return invoices[invoiceId].scoreOk;
    }

    function getEncryptedEligibilityHandle(uint256 invoiceId) external view invoiceExists(invoiceId) returns (ebool) {
        return invoices[invoiceId].eligible;
    }

    function getInvoicePublic(uint256 invoiceId)
        external
        view
        invoiceExists(invoiceId)
        returns (
            uint256 id,
            string memory externalInvoiceId,
            address company,
            string memory invoiceHash,
            string memory industry,
            uint32 dueDays,
            uint16 aprBps,
            InvoiceStatus status,
            RiskLevel riskLevel,
            bool riskLevelSet,
            address investor,
            uint256 publicFundingAmount,
            uint256 createdAt,
            bool hasEvaluation
        )
    {
        InvoiceRequest storage inv = invoices[invoiceId];
        return (
            inv.id,
            inv.externalInvoiceId,
            inv.company,
            inv.invoiceHash,
            inv.industry,
            inv.dueDays,
            inv.aprBps,
            inv.status,
            inv.riskLevel,
            inv.riskLevelSet,
            inv.investor,
            inv.publicFundingAmount,
            inv.createdAt,
            inv.hasEvaluation
        );
    }

    function _allowPrivateInputs(InvoiceRequest storage inv, address account) private {
        FHE.allowThis(inv.invoiceAmount);
        FHE.allow(inv.invoiceAmount, account);
        FHE.allowThis(inv.requestedAmount);
        FHE.allow(inv.requestedAmount, account);
        FHE.allowThis(inv.creditScore);
        FHE.allow(inv.creditScore, account);
    }

    function _allowEvaluation(InvoiceRequest storage inv, address account) private {
        FHE.allowThis(inv.maxFinanceAmount);
        FHE.allow(inv.maxFinanceAmount, account);
        FHE.allowThis(inv.amountOk);
        FHE.allow(inv.amountOk, account);
        FHE.allowThis(inv.scoreOk);
        FHE.allow(inv.scoreOk, account);
        FHE.allowThis(inv.eligible);
        FHE.allow(inv.eligible, account);
    }
}
