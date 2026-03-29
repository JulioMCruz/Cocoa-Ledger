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
    const { action, readings, farmName, origin, lotId } = await req.json();

    if (!PRIVATE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT, DATA_ABI, wallet);

    if (action === "create_lot") {
      const tx = await contract.createLot(farmName || "Finca Dorada", origin || "Peru");
      await tx.wait();
      const newLotId = (await contract.nextLotId()) - 1n;
      return NextResponse.json({ lotId: newLotId.toString(), hash: tx.hash });
    }

    if (action === "store_readings") {
      const results: { index: number; hash: string }[] = [];
      for (const r of readings) {
        const tx = await contract.storeReading(
          BigInt(lotId),
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
        results.push({ index: r._index, hash: tx.hash });
      }
      return NextResponse.json({ stored: results.length, results });
    }

    if (action === "finalize") {
      const tx = await contract.finalizeLot(BigInt(lotId));
      await tx.wait();
      return NextResponse.json({ hash: tx.hash });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
