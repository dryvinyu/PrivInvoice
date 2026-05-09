import { BrowserProvider } from "ethers";
import { chainConfig } from "./config";
import tfheWasmUrl from "tfhe/tfhe_bg.wasm?url";
import kmsWasmUrl from "tkms/kms_lib_bg.wasm?url";

type RelayerSdk = typeof import("@zama-fhe/relayer-sdk/web");
type FhevmInstance = Awaited<ReturnType<RelayerSdk["createInstance"]>>;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

let sdkPromise: Promise<RelayerSdk> | null = null;
let instancePromise: Promise<FhevmInstance> | null = null;

function loadRelayerSdk() {
  if (!sdkPromise) {
    sdkPromise = import("@zama-fhe/relayer-sdk/web");
  }
  return sdkPromise;
}

async function getRelayerInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const { createInstance, initSDK, SepoliaConfig } = await loadRelayerSdk();
      await initSDK({
        tfheParams: tfheWasmUrl,
        kmsParams: kmsWasmUrl,
      });

      return createInstance({
        ...SepoliaConfig,
        network: chainConfig.rpcUrl || SepoliaConfig.network,
      });
    })();
  }

  return instancePromise;
}

async function getWalletSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Wallet is not connected");
  }

  const provider = new BrowserProvider(window.ethereum as never);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

async function userDecrypt(handle: string, contractAddress: string, userAddress: string) {
  const instance = await getRelayerInstance();
  const signer = await getWalletSigner();
  const signerAddress = await signer.getAddress();

  if (signerAddress.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error("Connected wallet does not match the decryption user address");
  }

  const keypair = instance.generateKeypair();
  const contractAddresses = [contractAddress];
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 10;
  const eip712 = instance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimestamp,
    durationDays,
  );

  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message,
  );

  const result = await instance.userDecrypt(
    [{ handle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    userAddress,
    startTimestamp,
    durationDays,
  );

  return result[handle as `0x${string}`];
}

export async function initZamaRelayer() {
  if (typeof window === "undefined") return;

  window.privInvoiceFhe = {
    createEncryptedInput(contractAddress, userAddress) {
      let inputPromise = getRelayerInstance().then((instance) =>
        instance.createEncryptedInput(contractAddress, userAddress),
      );

      return {
        add64(value) {
          inputPromise = inputPromise.then((input) => {
            input.add64(value);
            return input;
          });
        },
        add32(value) {
          inputPromise = inputPromise.then((input) => {
            input.add32(value);
            return input;
          });
        },
        encrypt() {
          return inputPromise.then((input) => input.encrypt());
        },
      };
    },
    async userDecryptEuint64(handle, contractAddress, userAddress) {
      const value = await userDecrypt(handle, contractAddress, userAddress);
      if (typeof value !== "bigint" && typeof value !== "number") {
        throw new Error("Expected decrypted euint64 value");
      }
      return value;
    },
    async userDecryptEuint32(handle, contractAddress, userAddress) {
      const value = await userDecrypt(handle, contractAddress, userAddress);
      if (typeof value !== "bigint" && typeof value !== "number") {
        throw new Error("Expected decrypted euint32 value");
      }
      return value;
    },
    async userDecryptEbool(handle, contractAddress, userAddress) {
      const value = await userDecrypt(handle, contractAddress, userAddress);
      if (typeof value !== "boolean") {
        throw new Error("Expected decrypted ebool value");
      }
      return value;
    },
  };

  await getRelayerInstance();
}
