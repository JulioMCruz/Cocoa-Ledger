import "dotenv/config";
import express from "express";
import cors from "cors";
import { getLot, getAllReadings, getNextLotId } from "./blockchain";
import { analyzeLot } from "./analyzer";

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

    res.json(result);
  } catch (error: any) {
    console.error("[analyze] Error:", error.message);
    res.status(500).json({
      error: "Analysis failed",
      details: error.message,
    });
  }
});

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  console.log(`🍫 Cocoa Ledger Agent running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Analyze: POST http://localhost:${PORT}/api/analyze-lot`);
});
