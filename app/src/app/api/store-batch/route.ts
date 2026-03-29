import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const DATA_ABI = [
  "function createLot(string farmName, string origin) returns (uint256)",
  "function storeReading(uint256 lotId, uint256 deviceId, int256 temperature, uint256 humidity, uint256 soilMoisture, uint256 soilPH, uint256 rainfall, uint256 lightIntensity, string gpsLocation)",
  "function finalizeLot(uint256 lotId)",
  "function nextLotId() view returns (uint256)",
];

const RPC = process.env.PRIVACY_NODE_RPC || "https://privacy-node-0.rayls.com";
const CONTRACT = process.env.DATA_CONTRACT_ADDRESS || "0x47B1C749cB7f1b48679E872E6DF3d1223cb4c6fC";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { readings, farmName, origin } = await req.json();

    if (!PRIVATE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT, DATA_ABI, wallet);

    // Create lot
    const createTx = await contract.createLot(farmName || "Finca Dorada", origin || "Peru");
    await createTx.wait();

    // Get the lot ID
    const lotId = (await contract.nextLotId()) - 1n;

    const results: { index: number; hash: string; status: string }[] = [];
    const total = readings.length;

    // Store readings in batches
    for (let i = 0; i < total; i++) {
      const r = readings[i];
      try {
        const tx = await contract.storeReading(
          lotId,
          BigInt(r.device_id || 1),
          BigInt(Math.round(parseFloat(r.temperature || "2500"))),
          BigInt(Math.round(parseFloat(r.humidity || "8000"))),
          BigInt(Math.round(parseFloat(r.soil_moisture || "6000"))),
          BigInt(Math.round(parseFloat(r.soil_ph || "650"))),
          BigInt(Math.round(parseFloat(r.precipitation || "12000"))),
          BigInt(Math.round(parseFloat(r.light_intensity || "25000"))),
          `${r.gps_lat || "-9.0"},${r.gps_lng || "-75.0"}`
        );
        await tx.wait();
        results.push({ index: i, hash: tx.hash, status: "ok" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ index: i, hash: "", status: `error: ${msg.slice(0, 100)}` });
      }
    }

    // Finalize lot
    const finalizeTx = await contract.finalizeLot(lotId);
    await finalizeTx.wait();

    return NextResponse.json({
      lotId: lotId.toString(),
      createHash: createTx.hash,
      finalizeHash: finalizeTx.hash,
      stored: results.filter((r) => r.status === "ok").length,
      total,
      results,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
