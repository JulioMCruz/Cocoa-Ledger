import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "crypto";
import {
  ParsedLot,
  ParsedReading,
  AnalysisResponse,
  PublicMetadata,
  PrivateMetadata,
  DeviceStat,
} from "./types";

let genai: GoogleGenerativeAI;

function getGenAI(): GoogleGenerativeAI {
  if (!genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");
    genai = new GoogleGenerativeAI(apiKey);
  }
  return genai;
}

function computeDeviceStats(readings: ParsedReading[]): DeviceStat[] {
  const deviceMap = new Map<number, ParsedReading[]>();

  for (const r of readings) {
    const existing = deviceMap.get(r.deviceId) || [];
    existing.push(r);
    deviceMap.set(r.deviceId, existing);
  }

  const stats: DeviceStat[] = [];
  for (const [deviceId, devReadings] of deviceMap) {
    const temps = devReadings.map((r) => r.temperature);
    const hums = devReadings.map((r) => r.humidity);
    const phs = devReadings.map((r) => r.soilPH);

    stats.push({
      deviceId,
      readingCount: devReadings.length,
      avgTemperature: +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2),
      avgHumidity: +(hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(2),
      avgSoilPH: +(phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2),
      temperatureRange: { min: Math.min(...temps), max: Math.max(...temps) },
      humidityRange: { min: Math.min(...hums), max: Math.max(...hums) },
    });
  }

  return stats;
}

function computeAverages(readings: ParsedReading[]) {
  const n = readings.length;
  if (n === 0)
    return {
      avgTemperature: 0,
      avgHumidity: 0,
      avgSoilPH: 0,
      avgRainfall: 0,
      avgSoilMoisture: 0,
      avgLightIntensity: 0,
    };

  return {
    avgTemperature: +(readings.reduce((s, r) => s + r.temperature, 0) / n).toFixed(2),
    avgHumidity: +(readings.reduce((s, r) => s + r.humidity, 0) / n).toFixed(2),
    avgSoilPH: +(readings.reduce((s, r) => s + r.soilPH, 0) / n).toFixed(2),
    avgRainfall: +(readings.reduce((s, r) => s + r.rainfall, 0) / n).toFixed(2),
    avgSoilMoisture: +(readings.reduce((s, r) => s + r.soilMoisture, 0) / n).toFixed(2),
    avgLightIntensity: +(readings.reduce((s, r) => s + r.lightIntensity, 0) / n).toFixed(1),
  };
}

function hashIoTData(readings: ParsedReading[]): string {
  const data = JSON.stringify(
    readings.map((r) => ({
      deviceId: r.deviceId,
      timestamp: r.timestamp,
      temperature: r.temperature,
      humidity: r.humidity,
      soilMoisture: r.soilMoisture,
      soilPH: r.soilPH,
      rainfall: r.rainfall,
      lightIntensity: r.lightIntensity,
      gpsLocation: r.gpsLocation,
    }))
  );
  return "0x" + createHash("sha256").update(data).digest("hex");
}

function buildAnalysisPrompt(
  lot: ParsedLot,
  readings: ParsedReading[],
  averages: ReturnType<typeof computeAverages>,
  deviceStats: DeviceStat[]
): string {
  const gpsLocations = [...new Set(readings.map((r) => r.gpsLocation))];
  const readingSummary = readings
    .map(
      (r) =>
        `Device ${r.deviceId} @ ${new Date(r.timestamp * 1000).toISOString()}: ` +
        `temp=${r.temperature}C, humidity=${r.humidity}%, soil_moisture=${r.soilMoisture}%, ` +
        `pH=${r.soilPH}, rainfall=${r.rainfall}mm, light=${r.lightIntensity}lux, GPS=${r.gpsLocation}`
    )
    .join("\n");

  return `You are an expert cacao agronomist and quality analyst. Analyze the following IoT sensor data from a cacao farm lot and produce a comprehensive quality assessment.

## Lot Information
- Lot ID: ${lot.lotId}
- Farm: ${lot.farmName}
- Origin: ${lot.origin}
- Created: ${new Date(lot.createdAt * 1000).toISOString()}
- Total Readings: ${lot.readingsCount}
- Finalized: ${lot.finalized}

## Computed Averages
- Average Temperature: ${averages.avgTemperature}C
- Average Humidity: ${averages.avgHumidity}%
- Average Soil pH: ${averages.avgSoilPH}
- Average Rainfall: ${averages.avgRainfall}mm
- Average Soil Moisture: ${averages.avgSoilMoisture}%
- Average Light Intensity: ${averages.avgLightIntensity} lux

## GPS Locations
${gpsLocations.join(", ")}

## Per-Device Statistics
${deviceStats
  .map(
    (d) =>
      `Device ${d.deviceId}: ${d.readingCount} readings, avg temp=${d.avgTemperature}C (${d.temperatureRange.min}-${d.temperatureRange.max}), avg humidity=${d.avgHumidity}% (${d.humidityRange.min}-${d.humidityRange.max}), avg pH=${d.avgSoilPH}`
  )
  .join("\n")}

## Raw Readings
${readingSummary}

## Scoring Methodology (MUST follow this)
The qualityScore is a WEIGHTED AVERAGE of 5 sub-scores:

1. FLAVOR/SENSORY POTENTIAL (30% weight): Score 0-100
   - Based on environmental conditions that produce fine flavor cacao
   - Temperature 20-28°C and humidity 75-90% → optimal flavor development
   - Soil pH 5.0-7.0 → ideal nutrient absorption

2. PROCESSING READINESS (25% weight): Score 0-100
   - Soil moisture consistency → even fermentation potential
   - Light exposure patterns → maturity indicators
   - Rainfall regularity → harvest timing

3. IoT DATA QUALITY (20% weight): Score 0-100
   - Number of readings (more = higher confidence)
   - Sensor consistency across devices
   - Data completeness and anomaly rate
   - NOTE: This data is immutable on-chain — it cannot be falsified

4. FARM ENVIRONMENT (15% weight): Score 0-100
   - Temperature stability (low variance = good)
   - Humidity within cacao-growing range
   - Soil pH stability
   - GPS consistency (readings from same area)

5. DISEASE RISK (10% weight): Score 0-100 (100 = no risk)
   - High humidity + high temperature = monilia risk
   - pH anomalies = nutrient deficiency risk
   - Sudden environmental changes = stress indicators

GRADES:
- S (95-100): Exceptional — top 1% of cacao
- A (85-94): Premium Fine Flavor — 50-80% price premium
- B (70-84): Fine Flavor — 25-50% premium
- C (50-69): Standard — 0-25% premium
- D (0-49): Below Standard — REJECTED

## Required Output
Respond with ONLY a JSON object (no markdown, no code fences, just raw JSON):

{
  "qualityGrade": "S|A|B|C|D",
  "qualityScore": 0-100,
  "scoreBreakdown": {
    "flavorScore": 0-100,
    "processingScore": 0-100,
    "iotScore": 0-100,
    "farmScore": 0-100,
    "diseaseScore": 0-100
  },
  "premiumRecommendation": "e.g. 45-60%",
  "originVerified": true,
  "cropHealthAssessment": "2-3 sentences",
  "regionSummary": "1-2 sentences",
  "harvestAssessment": "1-2 sentences",
  "recommendedUse": "specific recommendation",
  "gpsAreaCoverage": "describe the area",
  "anomalies": [{"type": "string", "deviceId": 0, "timestamp": 0, "description": "string", "severity": "low|medium|high"}],
  "priceEstimatePerKg": 0.00,
  "labQualityAnalysis": "detailed paragraph",
  "producerRecommendations": "actionable recommendations"
}`;
}

export async function analyzeLot(
  lot: ParsedLot,
  readings: ParsedReading[]
): Promise<AnalysisResponse> {
  const averages = computeAverages(readings);
  const deviceStats = computeDeviceStats(readings);
  const iotDataHash = hashIoTData(readings);

  const prompt = buildAnalysisPrompt(lot, readings, averages, deviceStats);

  const client = getGenAI();
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(
    `You are a cacao quality analysis AI. Respond only with valid JSON. No markdown, no explanations.\n\n${prompt}`
  );
  const content = result.response.text();
  if (!content) throw new Error("Empty response from Gemini");

  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];

  const aiResult = JSON.parse(cleaned);

  const publicMetadata: PublicMetadata = {
    qualityGrade: aiResult.qualityGrade,
    qualityScore: aiResult.qualityScore,
    scoreBreakdown: {
      flavorScore: aiResult.scoreBreakdown?.flavorScore ?? 0,
      processingScore: aiResult.scoreBreakdown?.processingScore ?? 0,
      iotScore: aiResult.scoreBreakdown?.iotScore ?? 0,
      farmScore: aiResult.scoreBreakdown?.farmScore ?? 0,
      diseaseScore: aiResult.scoreBreakdown?.diseaseScore ?? 0,
    },
    premiumRecommendation: aiResult.premiumRecommendation || "0%",
    originVerified: aiResult.originVerified ?? true,
    avgTemperature: averages.avgTemperature,
    avgHumidity: averages.avgHumidity,
    avgSoilPH: averages.avgSoilPH,
    avgRainfall: averages.avgRainfall,
    cropHealthAssessment: aiResult.cropHealthAssessment,
    regionSummary: aiResult.regionSummary,
    harvestAssessment: aiResult.harvestAssessment,
    recommendedUse: aiResult.recommendedUse,
    totalReadings: readings.length,
    farmName: lot.farmName,
    origin: lot.origin,
  };

  const privateMetadata: PrivateMetadata = {
    deviceStats,
    gpsAreaCoverage: aiResult.gpsAreaCoverage,
    anomalies: aiResult.anomalies || [],
    priceEstimatePerKg: aiResult.priceEstimatePerKg,
    labQualityAnalysis: aiResult.labQualityAnalysis,
    iotDataHash,
    producerRecommendations: aiResult.producerRecommendations,
  };

  return {
    lotId: lot.lotId,
    farmName: lot.farmName,
    origin: lot.origin,
    readingsCount: readings.length,
    analyzedAt: new Date().toISOString(),
    publicMetadata,
    privateMetadata,
  };
}
