/**
 * Cocoa Ledger AI Agent
 *
 * Reads IoT data from Privacy Node → AI analyzes cacao quality → Posts attestation on Public Chain
 */
import { ethers } from "ethers";
import { config } from "./config";
import { analyzeToken } from "./llm";

const COCOA_DATA_ABI = [
  "function getLot(uint256 lotId) view returns (tuple(uint256 lotId, string farmName, string origin, uint256 createdAt, uint256 readingsCount, bool finalized))",
  "function getReading(uint256 lotId, uint256 index) view returns (tuple(uint256 deviceId, uint256 timestamp, int256 temperature, uint256 humidity, uint256 soilMoisture, uint256 soilPH, uint256 rainfall, uint256 lightIntensity, string gpsLocation))",
  "function nextLotId() view returns (uint256)",
];

const ATTESTATION_ABI = [
  "function attest(address token, bool approved, string reason, uint256 score)",
];

async function main() {
  console.log("=== Cocoa Ledger AI Agent ===");
  console.log("Connecting to Rayls Privacy Node...");

  const privateProvider = new ethers.JsonRpcProvider(config.publicChainRpc.replace("testnet-rpc", "privacy-node-0"));
  const publicProvider = new ethers.JsonRpcProvider(config.publicChainRpc);
  const wallet = new ethers.Wallet(config.agentPrivateKey, publicProvider);

  // Read IoT data from Privacy Node
  const dataContract = new ethers.Contract(
    "0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC",
    COCOA_DATA_ABI,
    privateProvider
  );

  const attestation = new ethers.Contract(config.attestationAddress, ATTESTATION_ABI, wallet);

  // Check how many lots exist
  let lotCount;
  try {
    lotCount = await dataContract.nextLotId();
    console.log(`Found ${lotCount} harvest lots on Privacy Node`);
  } catch {
    console.log("No lots found yet, using simulated IoT data for analysis");
    lotCount = 0n;
  }

  // Simulated IoT summary for analysis (or real data if lots exist)
  let iotSummary: string;

  if (lotCount > 0n) {
    const lot = await dataContract.getLot(0);
    console.log(`Lot 0: ${lot.farmName} (${lot.origin}), ${lot.readingsCount} readings`);
    iotSummary = `Farm: ${lot.farmName}, Origin: ${lot.origin}, Readings: ${lot.readingsCount}`;
  } else {
    iotSummary = "Farm: Finca San Miguel, Origin: Peru, Devices: 8, Readings: 156, Avg Temp: 27.5C, Humidity: 85%, Soil pH: 6.5, Rainfall: 120mm/month";
    console.log("Using simulated IoT data:");
    console.log(`  ${iotSummary}`);
  }

  // AI Analysis
  console.log("\nCalling AI agent for cacao quality analysis...");
  const tokenData = {
    address: config.tokenAddress,
    name: "Cacao Harvest Lot #001 - Finca San Miguel, Peru",
    symbol: "CACAO",
    totalSupply: `IoT Data Summary: ${iotSummary}. Evaluate this cacao harvest for quality (A/B/C/D grade), considering temperature, humidity, soil conditions, and rainfall patterns for premium cacao production.`,
  };

  const result = await analyzeToken(tokenData);
  console.log(`\nAI Verdict: ${result.approved ? "APPROVED" : "REJECTED"}`);
  console.log(`Quality Score: ${result.score}/100`);
  console.log(`Reason: ${result.reason}`);

  // Post attestation on Public Chain
  console.log("\nPosting attestation to Rayls Public Chain...");
  const tx = await attestation.attest(
    config.tokenAddress,
    result.approved,
    result.reason,
    result.score
  );
  console.log(`TX submitted: ${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`TX confirmed: ${receipt!.status === 1 ? "SUCCESS" : "FAILED"}`);
  console.log(`\nView on explorer: https://testnet-explorer.rayls.com/tx/${tx.hash}`);
  console.log("\n=== Attestation Complete ===");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
