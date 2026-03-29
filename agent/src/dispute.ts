import { getLot, getAllReadings } from "./blockchain";
import { analyzeLot } from "./analyzer";
import { ParsedReading } from "./types";

export interface DisputeRequest {
  lotId: number;
  deviceId: number;
  reason: string;
}

export interface DisputeResponse {
  lotId: number;
  disputedDeviceId: number;
  originalGrade: string;
  originalScore: number;
  revisedGrade: string;
  revisedScore: number;
  excludedReadings: number;
  remainingReadings: number;
  crossDeviceValidation: boolean;
  resolution: "revised" | "upheld" | "insufficient_data";
  explanation: string;
}

/**
 * Detect if readings from a specific device are anomalous compared to other devices.
 * Returns true if the disputed device shows significantly different patterns.
 */
function detectCrossDeviceAnomaly(
  disputedReadings: ParsedReading[],
  otherReadings: ParsedReading[]
): boolean {
  if (disputedReadings.length === 0 || otherReadings.length === 0) return false;

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const disputedAvgTemp = avg(disputedReadings.map((r) => r.temperature));
  const otherAvgTemp = avg(otherReadings.map((r) => r.temperature));
  const disputedAvgHumidity = avg(disputedReadings.map((r) => r.humidity));
  const otherAvgHumidity = avg(otherReadings.map((r) => r.humidity));
  const disputedAvgPH = avg(disputedReadings.map((r) => r.soilPH));
  const otherAvgPH = avg(otherReadings.map((r) => r.soilPH));

  // If any metric deviates by more than 15% from other devices, flag it
  const tempDiff = Math.abs(disputedAvgTemp - otherAvgTemp);
  const humDiff = Math.abs(disputedAvgHumidity - otherAvgHumidity);
  const phDiff = Math.abs(disputedAvgPH - otherAvgPH);

  const tempThreshold = Math.abs(otherAvgTemp) * 0.15 || 3;
  const humThreshold = Math.abs(otherAvgHumidity) * 0.15 || 10;
  const phThreshold = Math.abs(otherAvgPH) * 0.15 || 0.8;

  return tempDiff > tempThreshold || humDiff > humThreshold || phDiff > phThreshold;
}

export async function handleDispute(req: DisputeRequest): Promise<DisputeResponse> {
  const { lotId, deviceId, reason } = req;

  console.log(`[dispute] Processing dispute for lot ${lotId}, device ${deviceId}`);
  console.log(`[dispute] Reason: ${reason}`);

  // 1. Fetch lot and all readings from blockchain
  const lot = await getLot(lotId);
  if (lot.readingsCount === 0) {
    throw new Error(`Lot ${lotId} has no readings`);
  }

  const allReadings = await getAllReadings(lotId, lot.readingsCount);

  // 2. Separate readings by device
  const disputedReadings = allReadings.filter((r) => r.deviceId === deviceId);
  const otherReadings = allReadings.filter((r) => r.deviceId !== deviceId);

  if (disputedReadings.length === 0) {
    throw new Error(`No readings found from device ${deviceId} in lot ${lotId}`);
  }

  if (otherReadings.length === 0) {
    return {
      lotId,
      disputedDeviceId: deviceId,
      originalGrade: "N/A",
      originalScore: 0,
      revisedGrade: "N/A",
      revisedScore: 0,
      excludedReadings: disputedReadings.length,
      remainingReadings: 0,
      crossDeviceValidation: false,
      resolution: "insufficient_data",
      explanation: `Device ${deviceId} is the only device for lot ${lotId}. Cannot cross-reference with other devices.`,
    };
  }

  // 3. Cross-device validation
  const crossDeviceValidation = detectCrossDeviceAnomaly(disputedReadings, otherReadings);

  console.log(`[dispute] Disputed device readings: ${disputedReadings.length}`);
  console.log(`[dispute] Other device readings: ${otherReadings.length}`);
  console.log(`[dispute] Cross-device anomaly detected: ${crossDeviceValidation}`);

  // 4. Run original analysis (all readings)
  console.log(`[dispute] Running original analysis with all ${allReadings.length} readings...`);
  const originalAnalysis = await analyzeLot(lot, allReadings);

  // 5. Run revised analysis (excluding disputed device)
  console.log(`[dispute] Running revised analysis with ${otherReadings.length} readings (excluding device ${deviceId})...`);
  const revisedAnalysis = await analyzeLot(lot, otherReadings);

  const originalScore = originalAnalysis.publicMetadata.qualityScore;
  const originalGrade = originalAnalysis.publicMetadata.qualityGrade;
  const revisedScore = revisedAnalysis.publicMetadata.qualityScore;
  const revisedGrade = revisedAnalysis.publicMetadata.qualityGrade;

  // 6. Determine resolution
  const scoreDiff = revisedScore - originalScore;
  const isRevised = crossDeviceValidation && scoreDiff > 3;

  const resolution: DisputeResponse["resolution"] = isRevised ? "revised" : "upheld";

  // 7. Build explanation
  let explanation: string;
  if (isRevised) {
    explanation =
      `Device #${deviceId} readings were anomalous compared to ${otherReadings.length} readings from other devices. ` +
      `Cross-device validation confirmed sensor inconsistency. ` +
      `Excluding ${disputedReadings.length} readings from device #${deviceId} improved the quality score ` +
      `from ${originalScore} (${originalGrade}) to ${revisedScore} (${revisedGrade}). ` +
      `Reason provided: "${reason}"`;
  } else if (!crossDeviceValidation) {
    explanation =
      `Device #${deviceId} readings appear consistent with other devices. ` +
      `Cross-device validation did not detect significant anomalies. ` +
      `The original score of ${originalScore} (${originalGrade}) is upheld. ` +
      `Revised analysis yielded ${revisedScore} (${revisedGrade}), which does not indicate sensor malfunction.`;
  } else {
    explanation =
      `While device #${deviceId} showed some deviation from other sensors, ` +
      `the score difference (${originalScore} → ${revisedScore}) was minimal. ` +
      `The original grade of ${originalGrade} is upheld.`;
  }

  console.log(`[dispute] Resolution: ${resolution} — ${originalGrade}(${originalScore}) → ${revisedGrade}(${revisedScore})`);

  return {
    lotId,
    disputedDeviceId: deviceId,
    originalGrade,
    originalScore,
    revisedGrade,
    revisedScore,
    excludedReadings: disputedReadings.length,
    remainingReadings: otherReadings.length,
    crossDeviceValidation,
    resolution,
    explanation,
  };
}
