import "dotenv/config";
import express from "express";
import cors from "cors";
import { getLot, getAllReadings, getNextLotId } from "./blockchain";
import { analyzeLot } from "./analyzer";
import {
  fetchCacaoPrice,
  estimateLotValue,
  getHistoricalContext,
} from "./price-oracle";
import { postAttestation, getAttestations } from "./attestation";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// Analyze a cacao lot
app.post("/api/analyze-lot", async (req, res) => {
  try {
    const { lotId } = req.body;

    if (lotId === undefined || lotId === null) {
      res.status(400).json({ error: "lotId is required" });
      return;
    }

    const lotIdNum = Number(lotId);
    if (isNaN(lotIdNum) || lotIdNum < 0) {
      res.status(400).json({ error: "lotId must be a non-negative number" });
      return;
    }

    // Check lot exists
    const nextId = await getNextLotId();
    if (lotIdNum >= nextId) {
      res.status(404).json({
        error: `Lot ${lotIdNum} not found. Next lot ID is ${nextId}`,
      });
      return;
    }

    console.log(`[analyze] Fetching lot ${lotIdNum}...`);
    const lot = await getLot(lotIdNum);

    if (lot.readingsCount === 0) {
      res.status(400).json({
        error: `Lot ${lotIdNum} has no readings yet`,
        lot,
      });
      return;
    }

    console.log(
      `[analyze] Lot "${lot.farmName}" from ${lot.origin} — ${lot.readingsCount} readings`
    );

    console.log(`[analyze] Fetching ${lot.readingsCount} readings...`);
    const readings = await getAllReadings(lotIdNum, lot.readingsCount);

    console.log(`[analyze] Analyzing with AI...`);
    const result = await analyzeLot(lot, readings);

    console.log(
      `[analyze] Done! Grade: ${result.publicMetadata.qualityGrade}, Score: ${result.publicMetadata.qualityScore}`
    );

    // Post attestation on-chain
    console.log(`[analyze] Posting on-chain attestation...`);
    const attestation = await postAttestation(
      result.publicMetadata.qualityScore,
      result.publicMetadata.qualityGrade,
      lotIdNum,
      lot.farmName,
      lot.origin,
      readings.length
    );

    // Register lot on marketplace
    let marketplace = null;
    const marketplaceUrl = process.env.MARKETPLACE_URL;
    if (marketplaceUrl) {
      try {
        console.log(`[analyze] Registering lot on marketplace...`);
        const marketRes = await fetch(`${marketplaceUrl}/api/cacao-market/lot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotId: lotIdNum,
            farmName: lot.farmName,
            origin: lot.origin,
            analyzedAt: result.analyzedAt,
            publicMetadata: result.publicMetadata,
            privateMetadata: result.privateMetadata,
            attestation: attestation
              ? {
                  txHash: attestation.txHash,
                  explorerUrl: attestation.explorerUrl,
                  chain: attestation.chain,
                  attester: attestation.attester,
                  approved: attestation.approved,
                }
              : null,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (marketRes.ok) {
          marketplace = await marketRes.json();
          console.log(
            `[analyze] ✅ Lot registered on marketplace — tokenId: ${marketplace.tokenId}`
          );
        } else {
          console.log(`[analyze] ⚠️ Marketplace returned ${marketRes.status}`);
        }
      } catch (marketErr: any) {
        console.log(`[analyze] ⚠️ Marketplace unavailable: ${marketErr.message}`);
      }
    }

    const response = {
      ...result,
      attestation: attestation
        ? {
            txHash: attestation.txHash,
            blockNumber: attestation.blockNumber,
            attester: attestation.attester,
            chain: attestation.chain,
            explorerUrl: attestation.explorerUrl,
            approved: attestation.approved,
          }
        : null,
      marketplace: marketplace
        ? {
            tokenId: marketplace.tokenId,
            listed: true,
            url: marketplaceUrl,
          }
        : null,
    };

    res.json(response);
  } catch (error: any) {
    console.error("[analyze] Error:", error.message);
    res.status(500).json({
      error: "Analysis failed",
      details: error.message,
    });
  }
});

// ─── Attestation Endpoints ───

// GET /api/attestations/:token — read attestations for a token
app.get("/api/attestations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const attestations = await getAttestations(token);
    res.json({
      token,
      count: attestations.length,
      attestations: attestations.map((a: any) => ({
        attester: a.attester,
        approved: a.approved,
        reason: a.reason,
        score: Number(a.score),
        timestamp: Number(a.timestamp),
      })),
    });
  } catch (error: any) {
    console.error("[attestation] Read error:", error.message);
    res.status(500).json({ error: "Failed to read attestations", details: error.message });
  }
});

// ─── Price Oracle Endpoints ───

// GET /api/oracle/price — current cacao market price
app.get("/api/oracle/price", async (_req, res) => {
  try {
    const priceData = await fetchCacaoPrice();
    console.log(
      `[oracle] Price request: $${priceData.price}/ton via ${priceData.source}${priceData.cached ? " (cached)" : ""}`
    );
    res.json(priceData);
  } catch (error: any) {
    console.error("[oracle] Price fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch price", details: error.message });
  }
});

// GET /api/oracle/history — historical price data
app.get("/api/oracle/history", (_req, res) => {
  const history = getHistoricalContext();
  res.json({
    history,
    unit: "USD/ton",
    exchange: "ICE Futures US",
    contract: "CC (Cocoa Futures)",
    months: history.length,
  });
});

// POST /api/oracle/valuation — estimate lot value using market price + quality
app.post("/api/oracle/valuation", async (req, res) => {
  try {
    const { lotId, lotVolumeKg, qualityScore, qualityGrade } = req.body;

    if (!lotVolumeKg || !qualityScore) {
      res.status(400).json({
        error: "lotVolumeKg and qualityScore are required",
      });
      return;
    }

    const marketPrice = await fetchCacaoPrice();
    const valuation = estimateLotValue(
      marketPrice.pricePerKg,
      lotVolumeKg,
      qualityScore
    );

    const result = {
      lotId: lotId || null,
      marketPrice,
      lotVolumeKg,
      qualityScore,
      qualityGrade: qualityGrade || "N/A",
      ...valuation,
      historicalContext: getHistoricalContext().slice(-6),
      valuedAt: new Date().toISOString(),
    };

    console.log(
      `[oracle] Valuation: ${lotVolumeKg}kg × $${marketPrice.pricePerKg}/kg × ${valuation.qualityMultiplier} = $${valuation.estimatedValue}`
    );

    res.json(result);
  } catch (error: any) {
    console.error("[oracle] Valuation error:", error.message);
    res.status(500).json({ error: "Valuation failed", details: error.message });
  }
});

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`🍫 Cocoa Ledger Agent running on port ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log(`   Analyze:     POST http://localhost:${PORT}/api/analyze-lot`);
  console.log(`   Attestation: GET  http://localhost:${PORT}/api/attestations/:token`);
  console.log(`   Oracle:      http://localhost:${PORT}/api/oracle/price`);
  console.log(`   History:     http://localhost:${PORT}/api/oracle/history`);
  console.log(`   Valuation:   POST http://localhost:${PORT}/api/oracle/valuation`);
  console.log(`   On-chain:    ${process.env.ATTESTATION_ADDRESS ? "✅ Attestation enabled" : "⚠️  No ATTESTATION_ADDRESS — attestations disabled"}`);
});
