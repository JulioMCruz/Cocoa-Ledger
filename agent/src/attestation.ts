import { ethers } from "ethers";

// Attestation contract ABI
const ATTESTATION_ABI = [
  "function attest(address token, bool approved, string calldata reason, uint256 score) external",
  "function getAttestations(address token) external view returns (tuple(address attester, address token, bool approved, string reason, uint256 score, uint256 timestamp)[])",
  "function getAttestationCount(address token) external view returns (uint256)",
  "event Attested(address indexed token, address indexed attester, bool approved, uint256 score)",
];

export interface AttestationResult {
  txHash: string;
  blockNumber: number;
  attester: string;
  token: string;
  approved: boolean;
  score: number;
  reason: string;
  chain: string;
  explorerUrl: string;
}

let publicProvider: ethers.JsonRpcProvider | null = null;
let privacyProvider: ethers.JsonRpcProvider | null = null;

function getPublicProvider(): ethers.JsonRpcProvider {
  if (!publicProvider) {
    const rpc = process.env.PUBLIC_CHAIN_RPC_URL;
    if (!rpc) throw new Error("PUBLIC_CHAIN_RPC_URL not set");
    publicProvider = new ethers.JsonRpcProvider(rpc);
  }
  return publicProvider;
}

function getPrivacyProvider(): ethers.JsonRpcProvider {
  if (!privacyProvider) {
    const rpc = process.env.PRIVACY_NODE_RPC;
    if (!rpc) throw new Error("PRIVACY_NODE_RPC not set");
    privacyProvider = new ethers.JsonRpcProvider(rpc);
  }
  return privacyProvider;
}

/**
 * Post an AI attestation on-chain after quality analysis.
 *
 * Strategy:
 * 1. Try Public Chain first (preferred — visible to marketplace buyers)
 * 2. Fall back to Privacy Node (still on-chain, verifiable)
 * 3. If no chain available, return null (attestation skipped)
 */
export async function postAttestation(
  qualityScore: number,
  qualityGrade: string,
  lotId: number,
  farmName: string,
  origin: string,
  readingsCount: number
): Promise<AttestationResult | null> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.log("[attestation] No DEPLOYER_PRIVATE_KEY — skipping on-chain attestation");
    return null;
  }

  const attestationAddress = process.env.ATTESTATION_ADDRESS;
  if (!attestationAddress) {
    console.log("[attestation] No ATTESTATION_ADDRESS — skipping on-chain attestation");
    return null;
  }

  // Use the Data contract address as the "token" being attested
  // (it represents the lot's data contract on the privacy node)
  const tokenAddress = process.env.DATA_CONTRACT_ADDRESS || ethers.ZeroAddress;

  const approved = qualityScore >= 50; // C grade or above = approved
  const reason = `Cacao Quality Attestation | Lot #${lotId} | Farm: ${farmName} | Origin: ${origin} | Grade: ${qualityGrade} | Score: ${qualityScore}/100 | IoT Readings: ${readingsCount} | Cocoa Ledger Agent`;

  // Try Public Chain first
  const publicRpc = process.env.PUBLIC_CHAIN_RPC_URL;
  if (publicRpc) {
    try {
      console.log("[attestation] Posting to Public Chain...");
      const provider = getPublicProvider();
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(attestationAddress, ATTESTATION_ABI, wallet);

      const tx = await contract.attest(tokenAddress, approved, reason, qualityScore, {
        gasLimit: 500000,
      });
      console.log(`[attestation] TX submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[attestation] ✅ Confirmed in block ${receipt!.blockNumber}`);

      return {
        txHash: tx.hash,
        blockNumber: receipt!.blockNumber,
        attester: wallet.address,
        token: tokenAddress,
        approved,
        score: qualityScore,
        reason,
        chain: "Rayls Public Chain (7295799)",
        explorerUrl: `https://testnet-explorer.rayls.com/tx/${tx.hash}`,
      };
    } catch (error: any) {
      console.error("[attestation] Public Chain failed:", error.message);
      // Fall through to Privacy Node
    }
  }

  // Fallback: Privacy Node
  try {
    console.log("[attestation] Falling back to Privacy Node...");
    const provider = getPrivacyProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(attestationAddress, ATTESTATION_ABI, wallet);

    const tx = await contract.attest(tokenAddress, approved, reason, qualityScore, {
      gasLimit: 500000,
    });
    console.log(`[attestation] TX submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[attestation] ✅ Confirmed in block ${receipt!.blockNumber}`);

    return {
      txHash: tx.hash,
      blockNumber: receipt!.blockNumber,
      attester: wallet.address,
      token: tokenAddress,
      approved,
      score: qualityScore,
      reason,
      chain: "Rayls Privacy Node (800000)",
      explorerUrl: `https://blockscout-privacy-node-0.rayls.com/tx/${tx.hash}`,
    };
  } catch (error: any) {
    console.error("[attestation] Privacy Node also failed:", error.message);
    return null;
  }
}

/**
 * Read existing attestations for a token
 */
export async function getAttestations(tokenAddress: string): Promise<any[]> {
  const attestationAddress = process.env.ATTESTATION_ADDRESS;
  if (!attestationAddress) return [];

  try {
    // Try public chain first
    const publicRpc = process.env.PUBLIC_CHAIN_RPC_URL;
    if (publicRpc) {
      const provider = getPublicProvider();
      const contract = new ethers.Contract(attestationAddress, ATTESTATION_ABI, provider);
      return await contract.getAttestations(tokenAddress);
    }

    // Fallback: privacy node
    const provider = getPrivacyProvider();
    const contract = new ethers.Contract(attestationAddress, ATTESTATION_ABI, provider);
    return await contract.getAttestations(tokenAddress);
  } catch (error: any) {
    console.error("[attestation] Read failed:", error.message);
    return [];
  }
}
