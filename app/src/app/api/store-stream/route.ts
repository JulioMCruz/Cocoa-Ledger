import { NextRequest } from "next/server";
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
  const { readings, farmName, origin } = await req.json();

  if (!PRIVATE_KEY) {
    return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const provider = new ethers.JsonRpcProvider(RPC);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT, DATA_ABI, wallet);

        // Create lot
        send({ type: "status", message: "Creating lot...", progress: 0 });
        const createTx = await contract.createLot(farmName || "Finca Dorada", origin || "Peru");
        await createTx.wait();
        const lotId = (await contract.nextLotId()) - 1n;
        send({ type: "lot_created", lotId: lotId.toString(), hash: createTx.hash });

        const total = readings.length;

        // Store readings one by one
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
            send({ type: "reading_stored", index: i, total, hash: tx.hash, progress: Math.round(((i + 1) / total) * 100) });
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            send({ type: "reading_error", index: i, error: msg.slice(0, 100) });
          }
        }

        // Finalize
        send({ type: "status", message: "Finalizing lot...", progress: 100 });
        const finalizeTx = await contract.finalizeLot(lotId);
        await finalizeTx.wait();
        // Trigger AI agent analysis
        const agentUrl = process.env.AGENT_URL || "http://46.225.67.25:3001";
        send({ type: "agent_event", step: "connect", message: `Connecting to Cocoa Agent at ${agentUrl}...` });
        try {
          send({ type: "agent_event", step: "request", message: `POST /api/analyze-lot — sending lot ID ${lotId}` });
          send({ type: "agent_event", step: "blockchain_read", message: "Agent reading all IoT transactions from Privacy Node..." });
          const analysisRes = await fetch(`${agentUrl}/api/analyze-lot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lotId: Number(lotId) }),
          });
          if (analysisRes.ok) {
            const analysis = await analysisRes.json() as Record<string, unknown>;
            const pub = analysis.publicMetadata as Record<string, unknown> | undefined;
            const priv = analysis.privateMetadata as Record<string, unknown> | undefined;
            send({ type: "agent_event", step: "ai_analysis", message: `AI model analyzing ${analysis.readingsCount} readings — computing averages, device stats, anomaly detection...` });
            send({ type: "agent_event", step: "scoring", message: `Quality scoring: Grade ${pub?.qualityGrade}, Score ${pub?.qualityScore}/100` });
            send({ type: "agent_event", step: "scoring_detail", message: `Scoring based on: avg temp ${pub?.avgTemperature}C (ideal 20-30C), humidity ${pub?.avgHumidity}% (ideal 70-90%), soil pH ${pub?.avgSoilPH} (ideal 5.0-7.5), rainfall ${pub?.avgRainfall}mm` });
            send({ type: "agent_event", step: "pricing", message: `Market price estimate: $${priv?.priceEstimatePerKg}/kg based on grade and regional comparables` });
            send({ type: "agent_event", step: "metadata", message: `Generated public metadata (visible pre-purchase) + private metadata (revealed post-purchase)` });
            send({ type: "agent_event", step: "hash", message: `IoT data hash: ${priv?.iotDataHash} — verifiable proof of analyzed data` });
            send({ type: "agent_event", step: "complete", message: `Cocoa Agent analysis complete — recommended use: ${pub?.recommendedUse}` });
            send({ type: "analysis_complete", lotId: lotId.toString(), analysis });
          } else {
            send({ type: "agent_event", step: "error", message: `Agent returned HTTP ${analysisRes.status}` });
            send({ type: "analysis_error", message: `Agent returned ${analysisRes.status}` });
          }
        } catch (agentErr: unknown) {
          const agentMsg = agentErr instanceof Error ? agentErr.message : String(agentErr);
          send({ type: "agent_event", step: "error", message: `Connection failed: ${agentMsg}` });
          send({ type: "analysis_error", message: agentMsg });
        }

        send({ type: "complete", lotId: lotId.toString(), finalizeHash: finalizeTx.hash, stored: total });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        send({ type: "error", message: msg });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
