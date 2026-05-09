# PrivInvoice 端到端跑通 Workflow

这份文档只针对新项目目录 `PrivInvoice-platform`。

当前项目是前后端分离的 monorepo：

```text
PrivInvoice-platform/
  apps/web/              # 前端，TanStack/Vite/React
  packages/contracts/    # 合约，Hardhat/Zama FHEVM
```

整体目标是：合约部署完成后，前端所有业务数据都从链上读取，创建发票、评估、授权审计、投资、还款、审计日志都通过合约交易或合约事件完成。

## 0. 前置环境

在 Windows PowerShell 中进入新项目根目录：

```powershell
Set-Location "c:\VS_Project\RWA\PrivInvoice-platform"
```

需要准备：

- Node.js 20 或更高版本
- Corepack 可用，用来运行项目指定的 pnpm
- 浏览器钱包，例如 MetaMask
- 如果要上真实测试网，需要一个 Zama FHEVM 兼容网络 RPC
- 如果要跑 FHE 加密/解密前端流程，需要接入 Zama 浏览器端 FHE/relayer SDK

成功标准：

- `node -v` 能输出版本
- `pnpm --version` 能输出版本
- 浏览器钱包可以切换到你要连接的本地链或测试网

## 1. 安装依赖

分别安装前端和合约依赖：

```powershell
pnpm --dir apps/web install
pnpm --dir packages/contracts install
```

成功标准：

- 两条命令都正常结束，没有 dependency resolution 或 install failed 错误
- `apps/web/node_modules` 存在
- `packages/contracts/node_modules` 存在
- VS Code 不再提示前端找不到 `ethers`

如果公司网络限制导致安装失败，先确认是否需要配置公司 npm 镜像、代理或离线依赖缓存。依赖没装完之前，后面的编译、测试和前端启动都会受到影响。

## 2. 合约编译

执行：

```powershell
pnpm run contracts:compile
```

等价于：

```powershell
pnpm --dir packages/contracts compile
```

成功标准：

- 终端没有 Solidity compile error
- `packages/contracts/artifacts` 生成
- `packages/contracts/cache` 生成
- `PrivInvoice.sol` 和 `MockUSDZ.sol` 都能成功编译

常见失败点：

- 编译器或 npm 包未下载成功：优先处理网络/镜像问题
- FHEVM 依赖缺失：重新执行 `pnpm --dir packages/contracts install`
- Solidity 版本不匹配：当前配置使用 `0.8.27`

## 3. 合约测试

执行：

```powershell
pnpm run contracts:test
```

等价于：

```powershell
pnpm --dir packages/contracts test
```

测试覆盖的关键链路包括：

- 创建加密发票
- 执行加密资格评估
- 授权审计员访问
- 记录解密事件
- 最终确认 `Eligible` 或 `Rejected`
- 投资人使用 USDZ 进行 funding
- 公司标记还款
- 非法状态流转和权限限制

成功标准：

- Hardhat 测试全部通过
- 没有 reverted with unexpected reason
- 没有 FHE encrypted input 或 ACL 相关错误


## 4. 本地链部署

本地跑通推荐先启动 Hardhat localhost 网络。打开一个 PowerShell 终端并保持它运行：

```powershell
pnpm --dir packages/contracts exec hardhat node
```

成功标准：

- 终端显示 JSON-RPC server started
- RPC 地址是 `http://127.0.0.1:8545`
- 终端打印出本地测试账户和私钥

再打开另一个 PowerShell 终端，进入项目根目录并部署：

```powershell
Set-Location "c:\VS_Project\RWA\PrivInvoice-platform"
pnpm run contracts:deploy:localhost
```

部署脚本会做三件事：

- 部署 `MockUSDZ`
- 部署 `PrivInvoice`，并把 `MockUSDZ` 地址传入构造函数
- 给 deployer mint 一批 demo USDZ

成功标准：

- 终端输出 `MockUSDZ deployed to: 0x...`
- 终端输出 `PrivInvoice deployed to: 0x...`
- 终端输出 `Minted ... USDZ to ...`
- Hardhat node 终端能看到部署交易被打包

本地开发时，前端事件查询可以把部署区块设置成 `0`。真实测试网或生产环境必须填写实际部署区块，避免从创世区块扫描事件。

## 5. 配置前端环境变量

复制环境变量模板：

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

然后编辑 `apps/web/.env.local`：

```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_PRIVINVOICE_ADDRESS=上一步输出的 PrivInvoice 地址
VITE_USDZ_ADDRESS=上一步输出的 MockUSDZ 地址
VITE_DEFAULT_AUDITOR_ADDRESS=审计员钱包地址
VITE_PRIVINVOICE_DEPLOY_BLOCK=0
```

成功标准：

- `VITE_PRIVINVOICE_ADDRESS` 是有效合约地址
- `VITE_USDZ_ADDRESS` 是有效合约地址
- `VITE_RPC_URL` 指向前端钱包当前连接的同一个网络
- `VITE_DEFAULT_AUDITOR_ADDRESS` 是你准备授权的审计员地址

注意：Vite 只会在启动时读取 `.env.local`。修改环境变量后，需要重启前端开发服务器。

## 6. 接入浏览器端 FHE SDK

前端现在把链上数据作为唯一数据源，但创建发票、解密字段和最终确认前的私密查看依赖浏览器端 FHE SDK。

当前前端预留了 `window.privInvoiceFhe` 适配器。你需要用官方 Zama FHEVM/relayer SDK 初始化它，暴露下面这些方法：

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

如果官方 SDK 的方法名不同，不要改业务组件，优先在这个 adapter 里做适配。

成功标准：

- 创建发票时不会报 `FHE browser SDK is not configured`
- 输入金额、融资金额、信用分后，可以得到 encrypted handles 和 input proof
- 解密按钮触发后，可以完成用户签名/授权流程并返回明文字段

## 7. 启动前端

执行：

```powershell
pnpm run web:dev
```

成功标准：

- Vite dev server 正常启动
- 终端输出本地访问地址，通常是 `http://localhost:5173`
- 页面可以打开，没有白屏
- 浏览器控制台没有环境变量缺失、合约地址非法或 RPC 连接失败错误

打开页面后，把浏览器钱包切换到部署合约的网络：

- 本地链：chain id `31337`，RPC `http://127.0.0.1:8545`
- 测试网/生产链：使用对应链的 chain id 和 RPC

成功标准：

- 点击钱包按钮后能连接真实钱包
- 页面显示的钱包地址与浏览器钱包一致
- 刷新页面后，发票列表仍然来自链上读取，不会出现本地 mock 数据

## 8. 本地端到端业务验收

建议准备三个钱包角色：

- Company：创建发票、评估、授权审计、还款
- Auditor：查看授权后的加密字段，记录解密事件
- Investor：投资 eligible 发票

### 8.1 Company 创建发票

操作：

1. 使用 Company 钱包连接前端
2. 进入公司页面
3. 填写 invoice id、invoice hash、industry、due days、APR、invoice amount、requested amount、credit score
4. 提交创建

成功标准：

- 钱包弹出交易确认
- 交易成功后页面刷新链上数据
- 新发票出现在列表中
- 状态为 `Created`
- 私密金额字段默认不直接明文暴露

### 8.2 执行资格评估

操作：

1. 在发票卡片点击 `Evaluate Eligibility`
2. 等待链上交易完成

成功标准：

- 发票仍为 `Created`
- `hasEvaluation` 变为 true
- 页面出现可以执行最终确认的入口
- 审计日志出现评估相关事件

### 8.3 最终确认 Eligible 或 Rejected

操作：

1. Company、owner 或已授权 auditor 根据解密/审核结果点击最终确认
2. 前端调用 `finalizeEligibility`

成功标准：

- 通过的发票状态变成 `Eligible`
- 不通过的发票状态变成 `Rejected`
- 风险等级变成 `Low`、`Medium` 或 `High`
- Marketplace 只展示可投资的 eligible 发票

### 8.4 授权审计员并解密查看

操作：

1. Company 在发票卡片上给 `VITE_DEFAULT_AUDITOR_ADDRESS` 授权
2. 切换到 Auditor 钱包
3. 进入审计页面并解密查看

成功标准：

- 授权交易成功
- Auditor 可以查看授权发票
- 解密时会先调用 `recordDecryption`
- 审计日志出现 `DataDecryptionRecorded`
- 未授权钱包不能解密该发票私密字段

### 8.5 给 Investor 准备 USDZ

本地部署脚本默认只给 deployer mint USDZ。Investor 如果不是 deployer，需要额外 mint。

可在 Hardhat console 中执行：

```powershell
pnpm --dir packages/contracts exec hardhat console --network localhost
```

进入 console 后执行：

```js
const usdz = await ethers.getContractAt("MockUSDZ", "你的 MockUSDZ 地址");
await (await usdz.mint("投资人钱包地址", ethers.parseUnits("100000", 18))).wait();
await usdz.balanceOf("投资人钱包地址");
```

成功标准：

- Investor 钱包的 USDZ `balanceOf` 大于 0
- 前端 funding 时不会因为余额不足失败

### 8.6 Investor 投资发票

操作：

1. 使用 Investor 钱包连接前端
2. 进入 marketplace
3. 选择 `Eligible` 发票
4. 输入投资金额并确认

成功标准：

- 如果 allowance 不足，前端会先发起 USDZ `approve`
- approve 成功后，前端发起 `fundInvoice`
- 发票状态变为 `Funded`
- 发票 public funding amount 更新
- 审计/时间线中出现 funding 事件

### 8.7 Company 标记还款

操作：

1. 切回 Company 钱包
2. 对 `Funded` 发票执行还款完成操作

成功标准：

- `markRepaid` 交易成功
- 发票状态变成 `Repaid`
- 刷新页面后状态仍然是 `Repaid`

## 9. 前端构建和静态检查

前端开发流程跑通后，执行：

```powershell
pnpm run web:lint
pnpm run web:build
```

成功标准：

- lint 没有 blocking error
- build 成功结束
- `apps/web/dist` 或框架对应构建产物生成
- 构建过程中没有环境变量、类型或导入错误

如果出现 `Cannot find module 'ethers'`，说明前端依赖没有安装完成，回到第 1 步。

## 10. 部署到真实测试网或生产链

当前 `packages/contracts/hardhat.config.ts` 只内置了 `hardhat` 和 `localhost` 网络。要部署到真实链，需要先添加网络配置。

示例方向：

```ts
networks: {
  // existing hardhat and localhost...
  yourFhevmTestnet: {
    url: vars.get("YOUR_FHEVM_TESTNET_RPC"),
    accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
    chainId: 你的链 ID,
  },
}
```

然后通过 Hardhat vars 设置敏感配置，不要把私钥写进代码：

```powershell
pnpm --dir packages/contracts exec hardhat vars set YOUR_FHEVM_TESTNET_RPC
pnpm --dir packages/contracts exec hardhat vars set DEPLOYER_PRIVATE_KEY
```

部署：

```powershell
pnpm --dir packages/contracts exec hardhat deploy --network yourFhevmTestnet
```

成功标准：

- 部署账户有足够 gas
- `MockUSDZ` 和 `PrivInvoice` 都部署成功
- 区块浏览器或 RPC 能查到合约代码
- 记录 `PrivInvoice` 地址、`MockUSDZ` 地址和 `PrivInvoice` 部署区块
- 前端 `.env.local` 或部署平台环境变量更新为真实链配置

重要限制：`PrivInvoice` 使用 Zama FHEVM 加密类型和运算，不能随便部署到普通 EVM 链后期待 FHE 逻辑正常工作。真实上链必须选择支持当前 FHEVM 依赖和执行环境的网络。

### 10.1 Sepolia 部署建议

Sepolia 适合作为第一个公开测试网 Demo 环境，因为它可以验证真实钱包、真实 RPC、真实交易确认、前端链上事件恢复、USDZ approve/fund 等流程。

但这里有一个关键前提：不要把它当成普通 Solidity 合约随便部署到任意 Sepolia RPC 就算完成。当前 `PrivInvoice` 继承的是 `ZamaEthereumConfig`，并且使用了 FHEVM 加密类型和运算，所以 Sepolia 路线应该是“支持当前 Zama FHEVM 配置和 browser/relayer SDK 的 Sepolia 环境”。如果只是普通 Sepolia RPC，而前端没有接入 Zama FHE SDK/relayer，那么合约部署可能成功，但创建加密发票、FHE 评估、授权解密这些核心流程仍然跑不完整。

当前 `packages/contracts/hardhat.config.ts` 已经内置 Sepolia 配置：

```ts
sepolia: {
  url: vars.get("SEPOLIA_RPC_URL"),
  accounts: [vars.get("DEPLOYER_PRIVATE_KEY")],
  chainId: 11155111,
},
```

然后用 Hardhat vars 配置 RPC 和部署私钥，不要把私钥写进源码：

```powershell
pnpm --dir packages/contracts exec hardhat vars set SEPOLIA_RPC_URL
pnpm --dir packages/contracts exec hardhat vars set DEPLOYER_PRIVATE_KEY
```

部署前需要确认：

- 部署钱包有足够 Sepolia ETH 支付 gas
- Sepolia RPC 可以正常访问
- 目标 Sepolia 环境支持当前 FHEVM 合约依赖和执行流程
- 前端使用的 Zama browser/relayer SDK 与目标网络匹配

部署命令：

```powershell
pnpm run contracts:deploy:sepolia
```

部署成功后记录：

- `MockUSDZ` 地址
- `PrivInvoice` 地址
- `PrivInvoice` 部署区块高度

部署脚本会直接输出这三项，并额外打印可复制到前端 `.env.local` 的 `VITE_PRIVINVOICE_ADDRESS`、`VITE_USDZ_ADDRESS`、`VITE_PRIVINVOICE_DEPLOY_BLOCK`。

然后更新 `apps/web/.env.local`：

```env
VITE_RPC_URL=你的 Sepolia RPC
VITE_PRIVINVOICE_ADDRESS=Sepolia 上的 PrivInvoice 地址
VITE_USDZ_ADDRESS=Sepolia 上的 MockUSDZ 地址
VITE_DEFAULT_AUDITOR_ADDRESS=审计员钱包地址
VITE_PRIVINVOICE_DEPLOY_BLOCK=PrivInvoice 部署区块高度
VITE_ENABLE_MOCK_DATA=false
```

如果只想演示前端流程、不想走钱包、FHE、RPC 和真实合约交易，可以临时设置：

```env
VITE_ENABLE_MOCK_DATA=true
```

mock 模式会使用本地发票和审计时间线，并模拟创建、评估、finalize、授权审计员、投资、还款和解密流程。切回真实链上流程时改回 `false` 并重启前端 dev server。

Sepolia 部署的成功标准：

- `MockUSDZ` 和 `PrivInvoice` 都在 Sepolia 上部署成功
- RPC 或区块浏览器可以查到合约代码
- 浏览器钱包切到 Sepolia 后可以连接前端
- 前端可以从 Sepolia RPC 读取 `nextInvoiceId` 和历史事件
- Company 能用真实 FHE encrypted input 创建发票
- `evaluateInvoice` 能在 Sepolia 上完成交易
- Auditor 授权、解密记录、Investor approve/fund、Company mark repaid 都能完成真实交易
- 页面刷新后，发票状态和审计时间线仍然从 Sepolia 链上恢复

如果只完成合约部署，但 FHE encrypted input、FHE 评估或前端解密流程没有跑通，只能算“部署成功”，不能算“项目端到端跑通”。

## 11. 生产前替换或确认的内容

上线前必须逐项确认：

- `MockUSDZ` 只是 demo token，生产应替换为正式稳定币或受控资产合约
- `MockUSDZ.mint` 当前是公开 mint，不适合生产环境
- `finalizeEligibility` 是 MVP finalization，生产应替换为经过审计的异步公共解密证明、gateway callback、oracle 或正式 FHEVM finalization 流程
- `VITE_DEFAULT_AUDITOR_ADDRESS` 应接入真实审计员管理，不应长期只靠一个环境变量
- 前端 FHE SDK 初始化、密钥授权、用户解密流程必须按 Zama 官方生产方案接入
- RPC、合约地址、部署区块应由部署环境管理，不要硬编码到源码
- 所有关键角色钱包应使用真实权限模型和多签/后台管理流程

成功标准：

- 普通用户不能 mint 资产
- 未授权用户不能解密私密字段
- 资格确认流程有可审计依据
- 合约地址和部署参数可追溯
- 前端刷新后仍完全从链上恢复业务状态

## 12. 怎么判断“整个项目已经跑通”

满足下面条件，才算当前版本完整跑通：

- 合约依赖安装成功
- 合约编译成功
- 合约测试通过，或至少在受限网络外补跑通过
- 本地链或目标 FHEVM 网络部署成功
- 前端 `.env.local` 填入正确 RPC、合约地址、审计员地址和部署区块
- 浏览器端 FHE adapter 已初始化
- 前端能连接钱包
- Company 能创建发票
- 链上能完成 eligibility evaluation
- Company/owner/auditor 能 finalize eligibility
- Auditor 授权和解密日志能上链
- Investor 能 approve USDZ 并 fund invoice
- Company 能 mark repaid
- 页面刷新后，所有发票状态和审计时间线仍然来自链上事件/链上读取
- 前端 build 成功

如果其中任何一步失败，就按失败所在章节回退排查。不要用本地 mock 数据绕过，因为当前项目目标是所有业务数据调用全部走链上。
